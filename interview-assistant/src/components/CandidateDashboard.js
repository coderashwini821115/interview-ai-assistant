import React, { useState } from "react";
import "../index.scss";
import StartInterview from "./StartInterview";
import InterviewChat from "./InterviewChat";

export default function CandidateDashboard({ user, interviews, setAuthView }) {
  const [showStart, setShowStart] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState(null);
  const handleStartInterview = () => {
      setGeneratedQuestions(null);
      setAuthView(null);
      setShowStart(true);
    };

  function onQuestionsGenerated(questions) {
    setGeneratedQuestions(questions);
    setShowStart(false);
  }
  const formatDate = (iso) => {
    const date = new Date(iso);

// Example: "15 Dec 2025, 12:17 am"
const readable = date.toLocaleString("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});
return readable;
  }
  return (
    <div className="candidate-dashboard card">
      <h2>Welcome, {user?.name || "Candidate"}!</h2>
      <button className="btn primary" onClick={handleStartInterview}>Start New Interview</button>
      {showStart && <StartInterview onGenerate={onQuestionsGenerated} onCancel={() => setShowStart(false)} />}
        {generatedQuestions && <div style={{ marginTop: 16 }}><InterviewChat questions={generatedQuestions} /></div>}
      <h3>Previous Interviews</h3>
      <ul className="interview-history">
        {interviews && interviews.length > 0 ? (
          interviews.map((iv, idx) => (
            <li key={idx} className="history-item">
              <span>Date: {formatDate(iv.interviewDate)}</span>
              <span>Score: {iv.finalScore}</span>
              <span>Summary: {iv.summary}</span>
            </li>
          ))
        ) : (
          <li>No previous interviews found.</li>
        )}
      </ul>
    </div>
  );
}
