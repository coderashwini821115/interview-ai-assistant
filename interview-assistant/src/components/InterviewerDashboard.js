import React, { useState } from "react";
import "../index.scss";

export default function InterviewerDashboard({ candidates }) {
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const handleCandidateClick = (candidate) => {
    setSelectedCandidate(candidate);
  };

  const handleBack = () => {
    setSelectedCandidate(null);
  };

  if (selectedCandidate) {
    return (
      <div className="interviewer-dashboard">
        <div className="card" style={{ marginBottom: 20 }}>
          <button 
            className="btn ghost" 
            onClick={handleBack}
            style={{ marginBottom: 16 }}
          >
            ← Back to Candidates
          </button>
          <h2>{selectedCandidate.name}'s Interview History</h2>
          <p style={{ color: '#94a3b8', marginBottom: 20 }}>
            Email: {selectedCandidate.email}
            {selectedCandidate.phone && ` | Phone: ${selectedCandidate.phone}`}
          </p>

          {selectedCandidate.previousInterviews && selectedCandidate.previousInterviews.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {selectedCandidate.previousInterviews.map((interview, idx) => (
                <div 
                  key={idx} 
                  className="card" 
                  style={{ 
                    background: 'rgba(255,255,255,0.02)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    padding: 20
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
                    <div>
                      <h3 style={{ color: '#10b981', marginBottom: 8 }}>
                        Interview #{idx + 1}
                      </h3>
                      <p style={{ color: '#94a3b8', fontSize: 14 }}>
                        Date: {new Date(interview.interviewDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div style={{
                      background: interview.finalScore >= 40 ? 'rgba(16,185,129,0.2)' : interview.finalScore >= 30 ? 'rgba(251,191,36,0.2)' : 'rgba(239,68,68,0.2)',
                      color: interview.finalScore >= 40 ? '#10b981' : interview.finalScore >= 30 ? '#fbbf24' : '#ef4444',
                      padding: '8px 16px',
                      borderRadius: 8,
                      fontWeight: 'bold',
                      fontSize: 18
                    }}>
                      {interview.finalScore?.toFixed(1) || 'N/A'}/50
                    </div>
                  </div>

                  {interview.overallFeedback && (
                    <div style={{ marginBottom: 16 }}>
                      <h4 style={{ color: '#fff', marginBottom: 8 }}>Overall Feedback:</h4>
                      <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>{interview.overallFeedback}</p>
                    </div>
                  )}

                  {interview.overallStrengths && interview.overallStrengths.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <h4 style={{ color: '#10b981', marginBottom: 8 }}>Strengths:</h4>
                      <ul style={{ color: '#94a3b8', paddingLeft: 20, lineHeight: 1.8 }}>
                        {interview.overallStrengths.map((strength, sIdx) => (
                          <li key={sIdx}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {interview.overallWeaknesses && interview.overallWeaknesses.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <h4 style={{ color: '#ef4444', marginBottom: 8 }}>Areas for Improvement:</h4>
                      <ul style={{ color: '#94a3b8', paddingLeft: 20, lineHeight: 1.8 }}>
                        {interview.overallWeaknesses.map((weakness, wIdx) => (
                          <li key={wIdx}>{weakness}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {interview.recommendation && (
                    <div style={{ 
                      marginTop: 16, 
                      padding: 12, 
                      background: 'rgba(59,130,246,0.1)', 
                      borderRadius: 8,
                      border: '1px solid rgba(59,130,246,0.2)'
                    }}>
                      <h4 style={{ color: '#3b82f6', marginBottom: 8 }}>Recommendation:</h4>
                      <p style={{ color: '#94a3b8' }}>{interview.recommendation}</p>
                    </div>
                  )}

                  <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <h4 style={{ color: '#fff', marginBottom: 12 }}>Question-wise Results:</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {interview.answers && interview.answers.map((answer, aIdx) => (
                        <div 
                          key={aIdx}
                          style={{
                            padding: 12,
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.05)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                            <p style={{ color: '#fff', fontWeight: '500', flex: 1, marginRight: 12 }}>
                              Q{aIdx + 1}: {answer.question}
                            </p>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <span style={{
                                padding: '4px 8px',
                                background: answer.level === 'Easy' ? 'rgba(16,185,129,0.2)' : answer.level === 'Medium' ? 'rgba(251,191,36,0.2)' : 'rgba(239,68,68,0.2)',
                                color: answer.level === 'Easy' ? '#10b981' : answer.level === 'Medium' ? '#fbbf24' : '#ef4444',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 'bold'
                              }}>
                                {answer.level}
                              </span>
                              <span style={{ 
                                color: '#fff', 
                                fontWeight: 'bold',
                                fontSize: 14
                              }}>
                                {answer.score?.toFixed(1) || 0}/5
                              </span>
                            </div>
                          </div>
                          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 8, fontStyle: 'italic' }}>
                            Answer: {answer.answer}
                          </p>
                          {answer.feedback && (
                            <p style={{ color: '#94a3b8', fontSize: 13 }}>
                              <strong>Feedback:</strong> {answer.feedback}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
              <p style={{ color: '#94a3b8', fontSize: 16 }}>
                No previous interviews found for this candidate.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="interviewer-dashboard">
      <div className="card">
        <h2>Candidate Leaderboard</h2>
        {candidates && candidates.length > 0 ? (
          <table className="leaderboard-table" style={{ marginTop: 20 }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Latest Score</th>
                <th>Total Interviews</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((cand) => (
                <tr 
                  key={cand._id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleCandidateClick(cand)}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = ''}
                >
                  <td>{cand.name || 'N/A'}</td>
                  <td>{cand.email || 'N/A'}</td>
                  <td>{cand.phone || '-'}</td>
                  <td>
                    {cand.finalScore !== null && cand.finalScore !== undefined 
                      ? `${cand.finalScore.toFixed(1)}/50` 
                      : '-'}
                  </td>
                  <td>
                    {cand.previousInterviews?.length || 0}
                  </td>
                  <td>
                    <button 
                      className="btn ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCandidateClick(cand);
                      }}
                      style={{ padding: '4px 12px', fontSize: 12 }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
            No candidates found.
          </div>
        )}
      </div>
    </div>
  );
}
