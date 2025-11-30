import express from "express";
import multer from "multer";
import fs from "fs/promises";
import mammoth from "mammoth";
import { createRequire } from 'module';
import { generateInterviewQuestions, assessAnswer, generateOverallAssessment } from "../utils/gemini.js";
import Candidate from "../models/Candidate.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });


router.post("/generate-questions", upload.single("resume"), async (req, res) => {
  try {
    let resumeText = "";
    let skillsText = "";

    // Extract skills from request body (optional)
    if (req.body.skills) {
      skillsText = String(req.body.skills).trim();
      console.log("Received skills:", skillsText, " ", req.body.skills);
    }

    // Parse resume file if provided (optional)
    if (req.file) {
      if (req.file.mimetype === "application/pdf") {
        // Load pdfjs via createRequire to avoid ESM export resolution issues
        const require = createRequire(import.meta.url);
        const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
        const data = await fs.readFile(req.file.path);
        const loadingTask = pdfjs.getDocument({ data });
        const pdfDoc = await loadingTask.promise;
        let extracted = '';
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const page = await pdfDoc.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((it) => it.str || '');
          extracted += strings.join(' ') + '\n';
        }
        resumeText = extracted;
      } else if (
        req.file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        const result = await mammoth.extractRawText({ path: req.file.path });
        resumeText = result.value;
      } else if (req.file.mimetype === "text/plain") {
        resumeText = await fs.readFile(req.file.path, "utf-8");
      } else {
        return res
          .status(400)
          .json({ error: "Unsupported file type. Use PDF, DOCX, or TXT" });
      }
    }

    // Validate: at least resume or skills must be provided
    if (
      (!resumeText || resumeText.trim().length < 50) &&
      (!skillsText || skillsText.length < 3)
    ) {
      return res.status(400).json({
        error:
          "Please provide either a resume (min 50 chars) or skills (min 3 chars)",
      });
    }

    // Generate questions using Gemini with resume and/or skills
    const questions = await generateInterviewQuestions(resumeText, skillsText);

    // Clean up uploaded file
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    res.json({
      success: true,
      questions,
      resumeLength: resumeText.length,
      skillsProvided: !!skillsText,
      message: "Questions generated successfully",
    });
  } catch (error) {
    console.error("Error in generate-questions:", error);

    // Clean up uploaded file
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    res.status(500).json({
      error: "Failed to generate questions",
      details: error.message,
    });
  }
});

// POST /api/submit-answer - Submit all answers for assessment (called once when interview is complete)
router.post("/submit-answer", async (req, res) => {
  try {
    const { questionsAndAnswers, candidateId } = req.body;

    // Validate required fields
    if (!questionsAndAnswers || !Array.isArray(questionsAndAnswers) || questionsAndAnswers.length === 0) {
      return res.status(400).json({
        error: "questionsAndAnswers array is required with at least one question-answer pair",
      });
    }

    // Validate each question-answer pair
    for (const item of questionsAndAnswers) {
      if (!item.question || !item.answer || !item.level) {
        return res.status(400).json({
          error: "Each item in questionsAndAnswers must have: question, answer, and level",
        });
      }
      if (!["Easy", "Medium", "Hard"].includes(item.level)) {
        return res.status(400).json({
          error: "Level must be 'Easy', 'Medium', or 'Hard'",
        });
      }
    }

    // Assess each answer using LLM
    const assessments = [];
    for (const item of questionsAndAnswers) {
      try {
        const assessment = await assessAnswer(item.question, item.answer, item.level);
        assessments.push({
          question: item.question,
          answer: item.answer,
          level: item.level,
          score: assessment.score,
          feedback: assessment.feedback,
          strengths: assessment.strengths,
          weaknesses: assessment.weaknesses,
        });
      } catch (error) {
        console.error(`Error assessing question "${item.question}":`, error);
        // Continue with other questions even if one fails
        assessments.push({
          question: item.question,
          answer: item.answer,
          level: item.level,
          score: 0,
          feedback: "Error assessing this answer",
          strengths: [],
          weaknesses: [],
        });
      }
    }

    // Calculate final score out of 50
    const totalScore = assessments.reduce((sum, assessment) => sum + (assessment.score || 0), 0);
    const maxPossibleScore = assessments.length * 5; // Each question is worth 5 points
    const finalScoreOutOf50 = Math.round((totalScore / maxPossibleScore) * 50 * 10) / 10; // Normalize to 50, rounded to 1 decimal

    // Generate overall assessment (always done since interview is complete)
    let overallAssessment = null;
    try {
      overallAssessment = await generateOverallAssessment(assessments);
    } catch (error) {
      console.error("Error generating overall assessment:", error);
      // Continue even if overall assessment fails
    }

    // Save to database if candidateId is provided
    if (candidateId) {
      try {
        const candidate = await Candidate.findById(candidateId);
        if (candidate) {
          // Prepare interview result object for previousInterviews
          const interviewResult = {
            interviewDate: new Date(),
            answers: assessments.map((assessment) => ({
              question: assessment.question,
              answer: assessment.answer,
              score: assessment.score,
              level: assessment.level,
              feedback: assessment.feedback,
              strengths: assessment.strengths,
              weaknesses: assessment.weaknesses,
              timestamp: new Date(),
            })),
            finalScore: finalScoreOutOf50,
          };

          // Add overall assessment if available
          if (overallAssessment) {
            interviewResult.overallFeedback = overallAssessment.overallFeedback;
            interviewResult.overallStrengths = overallAssessment.overallStrengths;
            interviewResult.overallWeaknesses = overallAssessment.overallWeaknesses;
            interviewResult.recommendation = overallAssessment.recommendation;
            interviewResult.summary = `Completed ${assessments.length} questions with a final score of ${finalScoreOutOf50}/50. ${overallAssessment.recommendation}`;
          } else {
            interviewResult.summary = `Completed ${assessments.length} questions with a final score of ${finalScoreOutOf50}/50.`;
          }

          // Add to previousInterviews array
          candidate.previousInterviews.push(interviewResult);

          // Update current/latest interview fields for backward compatibility
          candidate.answers = interviewResult.answers;
          candidate.finalScore = finalScoreOutOf50;
          if (overallAssessment) {
            candidate.overallFeedback = overallAssessment.overallFeedback;
            candidate.overallStrengths = overallAssessment.overallStrengths;
            candidate.overallWeaknesses = overallAssessment.overallWeaknesses;
            candidate.recommendation = overallAssessment.recommendation;
            candidate.summary = interviewResult.summary;
          }

          await candidate.save();
        }
      } catch (dbError) {
        console.error("Error saving to database:", dbError);
        // Continue even if DB save fails, still return the assessment
      }
    }

    // Prepare response with all assessments, final score, and overall assessment
    const response = {
      success: true,
      assessments: assessments.map((assessment, index) => ({
        questionNumber: index + 1,
        question: assessment.question,
        answer: assessment.answer,
        level: assessment.level,
        score: assessment.score,
        feedback: assessment.feedback,
        strengths: assessment.strengths,
        weaknesses: assessment.weaknesses,
      })),
      finalScore: finalScoreOutOf50,
      maxPossibleScore: 50,
      message: "Answers assessed successfully",
    };

    // Add overall assessment (always included since interview is complete)
    if (overallAssessment) {
      response.overallAssessment = {
        overallFeedback: overallAssessment.overallFeedback,
        overallStrengths: overallAssessment.overallStrengths,
        overallWeaknesses: overallAssessment.overallWeaknesses,
        recommendation: overallAssessment.recommendation,
      };
    }

    res.json(response);
  } catch (error) {
    console.error("Error in submit-answer:", error);
    res.status(500).json({
      error: "Failed to assess answers",
      details: error.message,
    });
  }
});

export default router;
