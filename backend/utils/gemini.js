import { GoogleGenAI } from "@google/genai";
import { OpenRouter } from "@openrouter/sdk";
import { Perplexity } from '@perplexity-ai/perplexity_ai';
import dotenv from "dotenv";

dotenv.config();
const client = new Perplexity({
  apiKey: process.env.PERPLEXITY_API_KEY,
});
export async function generateInterviewQuestions(resumeText = "", skillsText = "") {
  try {
    let contextSection = "";
    if (resumeText && resumeText.trim().length > 0) {
      contextSection += `RESUME/EXPERIENCE:\n${resumeText}\n\n`;
    }
    if (skillsText && skillsText.trim().length > 0) {
      contextSection += `SKILLS/TECHNOLOGIES:\n${skillsText}\n`;
    }

    const prompt = `You are an expert technical interviewer. Based on the following candidate information, generate exactly 5 TECHNICAL interview questions.

${contextSection}

Generate ONLY technical/programming questions related to:
- Technologies and frameworks mentioned in the resume or skills
- Programming languages used
- Technical concepts relevant to their experience
- System design (if applicable)
- Database and backend technologies
- Frontend frameworks and tools
- APIs and integrations
- Performance optimization
- Code quality and best practices

DO NOT include:
- Behavioral questions
- Soft skills questions
- Company/cultural fit questions
- Personal questions
- Any non-technical topics

Return ONLY a valid JSON array with no additional text. Each question must have this exact format:
{
  "level": "Easy|Medium|Hard",
  "question": "The technical interview question text",
  "time": number (time in seconds for answering)
}

Guidelines:
- Easy questions: 20-30 seconds (basic concepts, definitions)
- Medium questions: 45-90 seconds (implementation details, practical use)
- Hard questions: 90-180 seconds (system design, complex scenarios, optimization)
- Mix of: 3-4 Easy, 3-4 Medium, 3-4 Hard questions
- ALL questions must be purely technical
- Questions should reference actual technologies from the provided information
- Return exactly 5 questions

Example format (return ONLY the JSON array, no markdown or extra text):
[
  {"level": "Easy", "question": "What is the difference between let, const, and var in JavaScript?", "time": 20},
  {"level": "Medium", "question": "Explain how React hooks manage state compared to class components?", "time": 60},
  {"level": "Hard", "question": "Design a caching strategy for a high-traffic REST API?", "time": 120}
]`;


// const openrouter = new OpenRouter({
//   apiKey: process.env.OPENROUTER_API_KEY,
// });

// const stream = await openrouter.chat.send({
//   model: "google/gemma-3-12b-it:free",
//   messages: [
//     {
//       "role": "user",
//       "content": [
//         {
//             "type": "text",
//             "text": prompt
//           },
//       ]
//     }
//   ],
//   stream: true
// });
const response = await client.chat.completions.create({
  model: 'sonar',
  messages: [
    {
      role: 'user',
      content: prompt,
    }
  ],
  stream: true,
  web_search_options: {
    search_type: 'fast'  // Automatic classification
  }
});
let fullResponse = "";
for await (const chunk of response) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    fullResponse += content;
  }
}
fullResponse.trim();
if(fullResponse.length <= 0) {
  throw new Error("No questions generated");
}
fullResponse = fullResponse.split("```json")[1].split("```")[0]; 
const questions = JSON.parse(fullResponse);
return questions;
} catch (error) {
  console.error("Error generating interview questions:", error);// throw new Error("Failed to generate interview questions");
}
}

// Assess a single answer - scores out of 5 points per question
export async function assessAnswer(question, answer, level = "Medium") {
  try {
    const prompt = `You are an expert technical interviewer evaluating a candidate's answer to an interview question.

QUESTION (${level} level):
${question}

CANDIDATE'S ANSWER:
${answer}

Evaluate the answer based on:
1. Technical accuracy and correctness
2. Depth of understanding (more depth expected for Hard questions, basics for Easy)
3. Clarity and coherence
4. Completeness of the response
5. Practical knowledge and examples (if applicable)

For ${level} level questions:
- Easy: Expect clear, basic understanding of fundamental concepts
- Medium: Expect good understanding with some implementation details or practical application
- Hard: Expect deep understanding, system thinking, optimization considerations, or complex scenarios

Return ONLY a valid JSON object with this exact format (no markdown, no extra text):
{
  "score": number (0-5, where 0=poor/incorrect, 2.5=average/partial, 5=excellent/complete),
  "feedback": "Detailed constructive feedback (3-4 sentences) highlighting what was good and what could be improved",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"]
}

Be fair but thorough. Give partial credit for partially correct answers. Provide specific, actionable feedback.`;

    const response = await client.chat.completions.create({
  model: 'sonar',
  messages: [
    {
      role: 'user',
      content: prompt,
    }
  ],
  stream: true,
  web_search_options: {
    search_type: 'fast'  // Automatic classification
  }
});

    let fullResponse = "";
    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
      }
    }
    fullResponse = fullResponse.trim();

    // Try to extract JSON from markdown code blocks if present
    if (fullResponse.includes("```json")) {
      fullResponse = fullResponse.split("```json")[1].split("```")[0].trim();
    } else if (fullResponse.includes("```")) {
      fullResponse = fullResponse.split("```")[1].split("```")[0].trim();
    }

    const assessment = JSON.parse(fullResponse);

    // Validate and ensure score is between 0-5
    if (assessment.score < 0) assessment.score = 0;
    if (assessment.score > 5) assessment.score = 5;

    return {
      score: Math.round(assessment.score * 10) / 10, // Round to 1 decimal
      feedback: assessment.feedback || "",
      strengths: assessment.strengths || [],
      weaknesses: assessment.weaknesses || [],
    };
  } catch (error) {
    console.error("Error assessing answer:", error);
    throw new Error("Failed to assess answer");
  }
}

// Generate overall assessment with strengths and weaknesses
export async function generateOverallAssessment(assessments) {
  try {
    // Format all questions and answers with their assessments for the prompt
    let questionsAnswersSection = "";
    assessments.forEach((item, index) => {
      questionsAnswersSection += `\nQuestion ${index + 1} (${item.level}):\n${item.question}\n\nAnswer:\n${item.answer}\n\nScore: ${item.score}/5\nFeedback: ${item.feedback || "N/A"}\nStrengths: ${(item.strengths || []).join(", ")}\nWeaknesses: ${(item.weaknesses || []).join(", ")}\n---\n`;
    });

    // Calculate total and average score
    const totalScore = assessments.reduce((sum, item) => sum + (item.score || 0), 0);
    const maxPossibleScore = assessments.length * 5; // Each question is worth 5 points
    const finalScoreOutOf50 = (totalScore / maxPossibleScore) * 50; // Normalize to 50

    const prompt = `You are an expert technical interviewer providing a comprehensive overall assessment of a candidate's interview performance.

INTERVIEW SUMMARY:
Total Questions: ${assessments.length}
Total Score: ${totalScore.toFixed(1)}/${maxPossibleScore} points
Final Score (out of 50): ${finalScoreOutOf50.toFixed(1)}/50

ALL QUESTIONS AND ASSESSMENTS:
${questionsAnswersSection}

Based on all the answers and assessments provided, generate a comprehensive overall assessment that includes:

1. Overall feedback: A detailed summary (5-7 sentences) evaluating the candidate's overall technical knowledge, performance patterns, key strengths demonstrated, areas needing improvement, and their potential for growth.

2. Overall strengths: List 4-6 key technical strengths demonstrated across all answers. Look for patterns and recurring themes rather than repeating individual question strengths. Focus on:
   - Core competencies shown
   - Consistent strong points
   - Technical areas of expertise
   - Problem-solving approaches

3. Overall weaknesses: List 4-6 key areas where the candidate needs improvement or has knowledge gaps. Look for patterns across all answers. Focus on:
   - Consistent knowledge gaps
   - Areas needing development
   - Missing competencies
   - Improvement opportunities

4. Recommendation: A brief recommendation on the candidate's suitability (e.g., "Strong candidate suitable for mid-level position", "Good foundation but needs more experience before consideration", "Excellent candidate ready for senior role").

Return ONLY a valid JSON object with this exact format (no markdown, no extra text):
{
  "overallFeedback": "Detailed overall feedback text (5-7 sentences)",
  "overallStrengths": ["strength 1", "strength 2", "strength 3", "strength 4"],
  "overallWeaknesses": ["weakness 1", "weakness 2", "weakness 3", "weakness 4"],
  "recommendation": "Brief recommendation text"
}

Be comprehensive but concise. Focus on patterns and themes across all answers rather than individual question details. Provide actionable insights.`;




const response = await client.chat.completions.create({
  model: 'sonar',
  messages: [
    {
      role: 'user',
      content: prompt,
    }
  ],
  stream: true,
  web_search_options: {
    search_type: 'fast'  // Automatic classification
  }
});

// for await (const chunk of response) {
//   if (chunk.choices[0]?.delta?.content) {
//     process.stdout.write(chunk.choices[0].delta.content);
//   }
// }

    // const openrouter = new OpenRouter({
    //   apiKey: process.env.OPENROUTER_API_KEY,
    // });

    // const stream = await openrouter.chat.send({
    //   model: "google/gemma-3-12b-it:free",
    //   messages: [
    //     {
    //       role: "user",
    //       content: [
    //         {
    //           type: "text",
    //           text: prompt,
    //         },
    //       ],
    //     },
    //   ],
    //   stream: true,
    // });

    let fullResponse = "";
    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
      }
    }
    fullResponse = fullResponse.trim();

    // Try to extract JSON from markdown code blocks if present
    if (fullResponse.includes("```json")) {
      fullResponse = fullResponse.split("```json")[1].split("```")[0].trim();
    } else if (fullResponse.includes("```")) {
      fullResponse = fullResponse.split("```")[1].split("```")[0].trim();
    }

    const overallAssessment = JSON.parse(fullResponse);

    return {
      overallFeedback: overallAssessment.overallFeedback || "",
      overallStrengths: overallAssessment.overallStrengths || [],
      overallWeaknesses: overallAssessment.overallWeaknesses || [],
      recommendation: overallAssessment.recommendation || "",
    };
  } catch (error) {
    console.error("Error generating overall assessment:", error);
    throw new Error("Failed to generate overall assessment");
  }
}
