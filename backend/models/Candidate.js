import mongoose from 'mongoose';

const CandidateSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  chatHistory: [{ from: String, text: String, timestamp: Date }],
  answers: [{
    question: String,
    answer: String,
    score: Number,
    level: String,
    feedback: String,
    strengths: [String],
    weaknesses: [String],
    timestamp: Date
  }],
  finalScore: Number,
  summary: String,
  overallFeedback: String,
  overallStrengths: [String],
  overallWeaknesses: [String],
  recommendation: String,
  previousInterviews: [{
    interviewDate: { type: Date, default: Date.now },
    answers: [{
      question: String,
      answer: String,
      score: Number,
      level: String,
      feedback: String,
      strengths: [String],
      weaknesses: [String],
      timestamp: Date
    }],
    finalScore: Number,
    overallFeedback: String,
    overallStrengths: [String],
    overallWeaknesses: [String],
    recommendation: String,
    summary: String
  }]
});

const Candidate = mongoose.model('Candidate', CandidateSchema);
export default Candidate;