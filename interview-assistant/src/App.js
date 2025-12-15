import React, { useState, useEffect } from 'react';
import InterviewChat from './components/InterviewChat';
import ResumeUpload from './components/ResumeUpload';
import LandingPage from './components/LandingPage';
import CandidateDashboard from './components/CandidateDashboard';
import InterviewerDashboard from './components/InterviewerDashboard';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import StartInterview from './components/StartInterview';
import { useAuth } from './components/AuthContext';
import { BASE_URL } from './config';
export default function App() {
  const { user, token, login, signup, logout, authHeader } = useAuth();
  
  const [interviews, setInterviews] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [authView, setAuthView] = useState(null); // 'login' | 'signup' | null
  

  // Fetch candidate interview history after login
  useEffect(() => {
    if (user?.role === 'candidate') {
      // Fetch candidate's previous interviews
      const headers = {
        'Content-Type': 'application/json',
        ...authHeader()
      };
      
      fetch(`${BASE_URL}/candidates`, { headers })
        .then(res => {
          if (!res.ok) {
            return res.json().then(err => {
              throw new Error(err.error || 'Failed to fetch interviews');
            });
          }
          return res.json();
        })
        .then(data => {
          // Extract previousInterviews from candidate data
          if (data && data.length > 0 && data[0].previousInterviews) {
            setInterviews(data[0].previousInterviews);
          } else {
            setInterviews([]);
          }
        })
        .catch(() => setInterviews([]));
    }
    if (user?.role === 'interviewer') {
      // Fetch all candidates
      const headers = {
        'Content-Type': 'application/json',
        ...authHeader()
      };
      
      fetch(`${BASE_URL}/candidates`, { headers })
        .then(res => {
          if (!res.ok) {
            return res.json().then(err => {
              throw new Error(err.error || 'Failed to fetch candidates');
            });
          }
          return res.json();
        })
        .then(data => setCandidates(data))
        .catch(() => setCandidates([]));
    }
    // close auth view when logged in
    if (user) setAuthView(null);
  }, [user, authHeader]);

  const handleLogin = () => setAuthView('login');
  const handleSignup = () => setAuthView('signup');
  
  return (
    <div>
      <header className="app-header">
        <div className="container">
          <h1>Interview AI</h1>
          <p>Professional Interview Assessment Platform</p>
          {user && <button className="btn ghost" style={{ float: 'right' }} onClick={logout}>Logout</button>}
        </div>
      </header>

      <main className="container">
        {!user && !authView && (
          <LandingPage onLogin={handleLogin} onSignup={handleSignup} />
        )}
        {authView === 'login' && <LoginPage onCancel={() => setAuthView(null)} />}
        {authView === 'signup' && <SignupPage onCancel={() => setAuthView(null)} />}
        {user?.role === 'candidate' && (
          <>
            <CandidateDashboard user={user} interviews={interviews} setAuthView={setAuthView}/>
            
          </>
        )}
        {user?.role === 'interviewer' && (
          <InterviewerDashboard candidates={candidates} />
        )}
      </main>
    </div>
  );
}
