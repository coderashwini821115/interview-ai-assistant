import React from "react";
import "../index.scss";

export default function LandingPage({ onLogin, onSignup }) {
  return (
    <div className="landing-page card">
      <h1>Let's take your knowledge to the test!</h1>
      <p className="subtitle">AI-powered interviews to help you get noticed and land your dream job.</p>
      <div className="landing-actions">
        <button className="btn primary" onClick={onSignup}>Sign Up</button>
        <button className="btn ghost" onClick={onLogin}>Login</button>
      </div>
    </div>
  );
}
