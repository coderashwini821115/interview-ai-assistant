import rateLimit from "express-rate-limit";  

// Rate limit for question generation (resume upload + 1 LLM call)
export const generateQuestionsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5,  
  message: { error: "Too many resume uploads. Wait 15 minutes or try fewer requests." },
  standardHeaders: true,  
  legacyHeaders: false,
});

// Rate limit for answer submission (handles multiple LLM calls per request)
export const submitAnswerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3,  
  message: { error: "Too many interviews submitted. Wait 15 minutes between full interviews." },
  standardHeaders: true,
});
