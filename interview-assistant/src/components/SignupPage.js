import React, { useState } from 'react';
import { useAuth } from './AuthContext';

export default function SignupPage({ onCancel }) {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('candidate');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signup({ name, email, password, role });
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card card">
      <h2>Sign Up</h2>
      <form onSubmit={submit}>
        <label>Name</label>
        <input value={name} onChange={e => setName(e.target.value)} type="text" required />
        <label>Email</label>
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" required />
        <label>Password</label>
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" required />
        <label>Role</label>
        <select value={role} onChange={e => setRole(e.target.value)}>
          <option value="candidate">Candidate</option>
          <option value="interviewer">Interviewer</option>
        </select>
        {error && <div className="error">{error}</div>}
        <div style={{ marginTop: 12 }}>
          <button className="btn primary" type="submit" disabled={loading}>{loading ? 'Signing...' : 'Sign Up'}</button>
          <button type="button" className="btn ghost" onClick={onCancel} style={{ marginLeft: 8 }}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
