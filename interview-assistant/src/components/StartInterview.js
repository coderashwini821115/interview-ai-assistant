import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { BASE_URL } from '../config';

export default function StartInterview({ onGenerate, onCancel }) {
  const [file, setFile] = useState(null);
  const [skills, setSkills] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { authHeader } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const form = new FormData();
      if (file) form.append('resume', file);
      if (skills && skills.trim()) form.append('skills', skills.trim());

      const res = await fetch(`${BASE_URL}/api/generate-questions`, {
        method: 'POST',
        headers: {
          // include auth header if present
          ...authHeader(),
        },
        body: form,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate questions');

      // expected: { success, questions }
      if (!data.questions) throw new Error('No questions returned');
      onGenerate(data.questions);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="start-interview card">
      <h3>Start New Interview</h3>
      <form onSubmit={handleSubmit} className="start-form">
        <label>Upload Resume (optional)</label>
        <input type="file" accept=".pdf,.docx,.txt" onChange={e => setFile(e.target.files[0])} />

        <label>Skills (optional)</label>
        <input type="text" value={skills} onChange={e => setSkills(e.target.value)} placeholder="e.g. JavaScript, React, Node.js" />

        {error && <div className="error">{error}</div>}

        <div style={{ marginTop: 12 }}>
          <button className="btn primary" type="submit" disabled={loading}>{loading ? 'Generating...' : 'Generate Questions'}</button>
          <button type="button" className="btn ghost" onClick={onCancel} style={{ marginLeft: 8 }} disabled={loading}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
