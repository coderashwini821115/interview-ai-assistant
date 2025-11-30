import React from "react";
import "../index.scss";

export default function CandidateDashboard({ user, onStartInterview, interviews }) {
  return (
    <div className="candidate-dashboard card">
      <h2>Welcome, {user?.name || "Candidate"}!</h2>
      <button className="btn primary" onClick={onStartInterview}>Start New Interview</button>
      <h3>Previous Interviews</h3>
      <ul className="interview-history">
        {interviews && interviews.length > 0 ? (
          interviews.map((iv, idx) => (
            <li key={idx} className="history-item">
              <span>Date: {iv.date}</span>
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
