import React, { createContext, useContext, useState, useEffect } from "react";
import { BASE_URL } from '../config';
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  });
  const [token, setToken] = useState(() => {
    const storedToken = localStorage.getItem('token');
    // Remove any quotes that might be stored
    return storedToken ? storedToken.replace(/^["']|["']$/g, '') : null;
  });

  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user)); else localStorage.removeItem('user');
  }, [user]);
  useEffect(() => {
    if (token) localStorage.setItem('token', token); else localStorage.removeItem('token');
  }, [token]);

  async function login({ email, password }) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    // backend returns { success, token, user }
    setToken(data.token);
    setUser(data.user);
    return data;
  }

  async function signup({ name, email, password, role }) {
    const res = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Signup failed');
    setToken(data.token);
    setUser(data.user);
    return data;
  }

  function logout() {
    setUser(null);
    setToken(null);
  }

  function authHeader() {
    // Remove any quotes that might be in localStorage
    const cleanToken = token ? token.replace(/^["']|["']$/g, '') : null;
    return cleanToken ? { Authorization: `Bearer ${cleanToken}` } : {};
  }

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, authHeader }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() { return useContext(AuthContext); }
