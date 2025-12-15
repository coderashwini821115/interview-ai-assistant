// src/components/InterviewChat.js
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addChatMessage, addAnswer, setCurrentQuestionIndex, setScore, reset } from '../feature/candidateSlice';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { BASE_URL } from '../config';
const DEFAULT_QUESTIONS = [
  { level: 'Easy', question: 'What is React?', time: 20 },
  { level: 'Easy', question: 'Explain state and props.', time: 20 },
  { level: 'Medium', question: 'How does virtual DOM work?', time: 60 },
  { level: 'Medium', question: 'Explain useEffect hook with example.', time: 60 },
  { level: 'Hard', question: 'What is event delegation?', time: 120 },
  { level: 'Hard', question: 'Explain Node.js event loop.', time: 120 },
];

export default function InterviewChat({ questions = DEFAULT_QUESTIONS }) {
  const dispatch = useDispatch();
  const { user, authHeader } = useAuth();
  const currentIndex = useSelector(state => state.candidate.currentQuestionIndex);
  const chatHistory = useSelector(state => state.candidate.chatHistory);
  const answers = useSelector(state => state.candidate.answers);
  const [answer, setAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(questions[0]?.time || 0);
  const [QUESTIONS, setQUESTIONS] = useState(questions);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState(null);

  // Reset Redux state when component mounts or questions change
  useEffect(() => {
    // Reset Redux state when new questions are loaded
    dispatch(reset());
    dispatch(setCurrentQuestionIndex(0));
    setAnswer('');
    setAssessmentResult(null);
  }, [questions, dispatch]);

  useEffect(() => {
    if (currentIndex < QUESTIONS.length && QUESTIONS.length > 0) {
      setTimeLeft(QUESTIONS[currentIndex]?.time || 0);
      setAnswer('');
    }
  }, [currentIndex, QUESTIONS]);

  useEffect(() => {
    setQUESTIONS(questions);
  }, [questions]);

  useEffect(() => {
    if (timeLeft <= 0) {
      submitAnswer();
    }
    const timer = timeLeft > 0 && setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const submitAnswer = async () => {
  if (currentIndex >= QUESTIONS.length || isSubmitting) return;

  const currentAnswer = answer || '[No response]';
  dispatch(addChatMessage({ from: 'candidate', text: currentAnswer }));
  dispatch(addAnswer({
    question: QUESTIONS[currentIndex].question,
    answer: currentAnswer,
    level: QUESTIONS[currentIndex].level
  }));

  if (currentIndex === QUESTIONS.length - 1) {
    setIsSubmitting(true);
    await submitAllAnswersToAPI(); // call directly, no setTimeout
  } else {
    dispatch(setCurrentQuestionIndex(currentIndex + 1));
  }
};


  const submitAllAnswersToAPI = async () => {
    setIsSubmitting(true);
    try {
      // Get all answers from Redux state and include current answer
      const allAnswersMap = new Map();
      
      // Add all answers from Redux state
      answers.forEach((ans) => {
        if (ans.question) {
          allAnswersMap.set(ans.question, ans);
        }
      });
      
      // Ensure current answer is included (in case Redux state hasn't updated)
      const currentAnswerData = {
        question: QUESTIONS[currentIndex].question,
        answer: answer || '[No response]',
        level: QUESTIONS[currentIndex].level
      };
      allAnswersMap.set(currentAnswerData.question, currentAnswerData);

      // Prepare data for API - ensure all questions are in order
      const questionsAndAnswers = QUESTIONS.map((q, idx) => {
        const savedAnswer = allAnswersMap.get(q.question);
        return {
          question: q.question,
          answer: savedAnswer?.answer || '[No response]',
          level: q.level
        };
      });

      // Call the API
      const response = await axios.post(
        `${BASE_URL}/api/submit-answer`,
        {
          questionsAndAnswers,
          candidateId: user?.candidateId
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...authHeader()
          }
        }
      );

      if (response.data.success) {
  setAssessmentResult(response.data);
  dispatch(setScore(response.data.finalScore));

  dispatch(addChatMessage({
    from: 'ai',
    text: `Interview Complete! Final Score: ${response.data.finalScore}/50`
  }));

  if (response.data.overallAssessment) {
    dispatch(addChatMessage({
      from: 'ai',
      text: `Overall Feedback: ${response.data.overallAssessment.overallFeedback}`
    }));
  }

  // Move index past last question so "Interview Complete" UI + loader shows
  dispatch(setCurrentQuestionIndex(QUESTIONS.length));
}

    } catch (error) {
      console.error('Error submitting answers:', error);
      dispatch(addChatMessage({ 
        from: 'ai', 
        text: `Error: ${error.response?.data?.error || 'Failed to submit answers'}` 
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (currentIndex >= QUESTIONS.length) {
    return (
      <div className="interview-chat">
        <div className="card q-card" style={{gridColumn:'1/-1', textAlign:'center'}}>
          <div style={{marginBottom:12}}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
              <circle cx="12" cy="12" r="9" strokeOpacity="0.2" />
            </svg>
          </div>
          <h2 style={{margin:'6px 0 8px', fontSize:22}}>Interview Complete!</h2>
          {isSubmitting ? (
            <div style={{textAlign:'center', padding:'20px 0'}}>
              <div style={{marginBottom:16}}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  border: '4px solid rgba(16, 185, 129, 0.2)',
                  borderTopColor: '#10b981',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto'
                }}></div>
              </div>
              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
              <h3 style={{color:'#10b981', marginBottom:8, fontSize:20}}>Generating Report Card</h3>
              <p style={{color:'#94a3b8'}}>Please wait while we assess your answers...</p>
            </div>
          ) : assessmentResult ? (
            <div style={{textAlign:'left', marginTop:20}}>
              <h3 style={{color:'#10b981', marginBottom:10}}>Final Score: {assessmentResult.finalScore}/50</h3>
              
              {assessmentResult.overallAssessment && (
                <div style={{marginTop:20}}>
                  <h4 style={{color:'#fff', marginBottom:8}}>Overall Feedback:</h4>
                  <p style={{color:'#94a3b8', marginBottom:15}}>{assessmentResult.overallAssessment.overallFeedback}</p>
                  
                  <h4 style={{color:'#10b981', marginBottom:8, marginTop:15}}>Strengths:</h4>
                  <ul style={{color:'#94a3b8', marginBottom:15, paddingLeft:20}}>
                    {assessmentResult.overallAssessment.overallStrengths.map((strength, idx) => (
                      <li key={idx}>{strength}</li>
                    ))}
                  </ul>
                  
                  <h4 style={{color:'#ef4444', marginBottom:8, marginTop:15}}>Areas for Improvement:</h4>
                  <ul style={{color:'#94a3b8', marginBottom:15, paddingLeft:20}}>
                    {assessmentResult.overallAssessment.overallWeaknesses.map((weakness, idx) => (
                      <li key={idx}>{weakness}</li>
                    ))}
                  </ul>
                  
                  <h4 style={{color:'#3b82f6', marginBottom:8, marginTop:15}}>Recommendation:</h4>
                  <p style={{color:'#94a3b8'}}>{assessmentResult.overallAssessment.recommendation}</p>
                </div>
              )}
              
              <div style={{marginTop:30, padding:15, background:'rgba(16,185,129,0.1)', borderRadius:8}}>
                <h4 style={{color:'#10b981', marginBottom:10}}>Question-wise Results:</h4>
                {assessmentResult.assessments.map((assessment, idx) => (
                  <div key={idx} style={{marginBottom:15, padding:10, background:'rgba(255,255,255,0.05)', borderRadius:6}}>
                    <p style={{color:'#fff', fontWeight:'bold', marginBottom:5}}>Question {idx + 1}: {assessment.question}</p>
                    <p style={{color:'#94a3b8', fontSize:14, marginBottom:5}}>Score: {assessment.score}/5</p>
                    <p style={{color:'#94a3b8', fontSize:14}}>Feedback: {assessment.feedback}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{color:'#94a3b8'}}>Thank you for completing the interview assessment.</p>
          )}
        </div>
      </div>
    );
  }

  const getDifficultyColor = (level) => {
    switch(level) {
      case 'Easy': return 'from-emerald-500 to-teal-600';
      case 'Medium': return 'from-amber-500 to-orange-600';
      case 'Hard': return 'from-rose-500 to-red-600';
      default: return 'from-blue-500 to-blue-600';
    }
  };

  const getDifficultyBgColor = (level) => {
    switch(level) {
      case 'Easy': return 'bg-emerald-900/30 border-emerald-500/30 text-emerald-300';
      case 'Medium': return 'bg-amber-900/30 border-amber-500/30 text-amber-300';
      case 'Hard': return 'bg-rose-900/30 border-rose-500/30 text-rose-300';
      default: return 'bg-blue-900/30 border-blue-500/30 text-blue-300';
    }
  };

  // Safety check for currentIndex
  if (!QUESTIONS || QUESTIONS.length === 0 || currentIndex < 0 || currentIndex >= QUESTIONS.length) {
    return (
      <div className="interview-chat">
        <div className="card q-card" style={{gridColumn:'1/-1', textAlign:'center'}}>
          <p style={{color:'#94a3b8'}}>Loading questions...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = QUESTIONS[currentIndex];
  const progressPercent = (timeLeft / currentQuestion.time) * 100;

  return (
    <div className="interview-chat">
      {/* Question Progress */}
      <div style={{gridColumn:'1/-1'}}>
        <div className="q-card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div className="q-title">{currentQuestion.question}</div>
              <div className="q-meta">Question {currentIndex + 1} of {QUESTIONS.length}</div>
            </div>
            <div>
              <span className={`pill`} style={{padding:'6px 12px',borderRadius:10,background:'rgba(255,255,255,0.02)',color:'#94a3b8',fontWeight:700}}>{currentQuestion.level}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className={`bg-gradient-to-br ${getDifficultyColor(currentQuestion.level)} p-0.5 rounded-xl`}>
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-white flex-1 pr-4">{currentQuestion.question}</h2>
            <span className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap ${getDifficultyBgColor(currentQuestion.level)} border`}>
              {currentQuestion.level}
            </span>
          </div>
        </div>
      </div>

      {/* Timer */}
      <aside className="timer-box" style={{gridColumn:'2/3'}}>
        <div style={{fontSize:12,color:'#94a3b8',marginBottom:8}}>Time Remaining</div>
        <div className="timer-value">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</div>
        <div className="progress-bar" aria-hidden>
          <div className="progress-fill" style={{width:`${progressPercent}%`}} />
        </div>
        <div style={{marginTop:12}}>
          <button className="btn ghost" onClick={() => { setAnswer(''); }}>Reset</button>
        </div>
      </aside>

      <div style={{gridColumn:'1/2'}}>
        <div className="card">
          <label style={{display:'block',marginBottom:8,color:'#94a3b8'}}>Your Answer</label>
          <textarea className="answer-input" rows={8} value={answer} onChange={(e)=>setAnswer(e.target.value)} placeholder="Type your detailed answer here..." />
          <div className="char-count">{answer.length} characters</div>

          <div style={{marginTop:16,display:'flex',gap:10}}>
            <button className={`btn primary`} onClick={submitAnswer} disabled={!answer.trim()} style={{opacity: answer.trim() ? 1 : 0.6}}>Submit Answer</button>
            <button className={`btn ghost`} onClick={() => setAnswer('')}>Clear</button>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
  onClick={submitAnswer}
  disabled={!answer.trim() || isSubmitting}
  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
    answer.trim() && !isSubmitting
      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/30 cursor-pointer'
      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
  }`}
>
  {isSubmitting && currentIndex === QUESTIONS.length - 1
    ? 'Generating Report...'
    : 'Submit Answer'}
</button>

      

      {chatHistory.length > 0 && (
        <div style={{gridColumn:'2/3'}}>
          <div className="card">
            <h3 style={{marginTop:0}}>Previous Feedback</h3>
            <div className="feedback-list">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`feedback-item ${msg.from==='candidate' ? 'user' : 'ai'}`}>
                  <div className="feedback-meta">{msg.from === 'candidate' ? 'Your Answer' : 'AI Feedback'}</div>
                  <div>{msg.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
