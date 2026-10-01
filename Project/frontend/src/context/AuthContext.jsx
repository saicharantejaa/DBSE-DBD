import { createContext, useContext, useState, useEffect } from 'react';
import { authLogin, authRegister } from '../api/client';

const AuthContext = createContext(null);

// Demo users for Quick Login (bypasses real auth — for demo/offline mode)
const DEMO_USERS = [
  { id: 2, name: 'Ravi Kumar',        email: 'ravi@student.edu',    role: 'student',    avatar: 'RK', password: 'password123' },
  { id: 3, name: 'Priya Mehta',       email: 'priya@student.edu',   role: 'student',    avatar: 'PM', password: 'password123' },
  { id: 4, name: 'Arjun Nair',        email: 'arjun@student.edu',   role: 'student',    avatar: 'AN', password: 'password123' },
  { id: 1, name: 'Dr. Ananya Sharma', email: 'ananya@platform.edu', role: 'instructor', avatar: 'AS', password: 'password123' },
];

// Compute avatar initials from a name string
function makeAvatar(name) {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('lp_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  // Persist user + token to localStorage
  const _persist = (userData, token) => {
    localStorage.setItem('lp_user', JSON.stringify(userData));
    if (token) localStorage.setItem('lp_token', token);
    setUser(userData);
  };

  // Real login — calls POST /auth/login
  const login = async (email, password) => {
    try {
      const data = await authLogin(email, password);
      const userData = { ...data.user, avatar: data.user.avatar || makeAvatar(data.user.name) };
      _persist(userData, data.access_token);
      return userData;
    } catch (err) {
      // Fallback to demo mode if backend not reachable
      const demo = DEMO_USERS.find(u => u.email === email);
      if (demo) {
        const { password: _, ...safeUser } = demo;
        _persist(safeUser, null);
        return safeUser;
      }
      throw err;
    }
  };

  // Real register — calls POST /auth/register
  const register = async (name, email, password, role = 'student') => {
    const data = await authRegister(name, email, password, role);
    const userData = { ...data.user, avatar: data.user.avatar || makeAvatar(data.user.name) };
    _persist(userData, data.access_token);
    return userData;
  };

  // Quick demo login — looks up user by role and calls the real /auth/login
  const loginAs = async (roleOrId) => {
    let demo;
    if (typeof roleOrId === 'number') {
      demo = DEMO_USERS.find(u => u.id === roleOrId);
    } else {
      demo = DEMO_USERS.find(u => u.role === roleOrId);
    }
    if (!demo) return;
    try {
      return await login(demo.email, demo.password);
    } catch {
      // Offline fallback
      const { password: _, ...safeUser } = demo;
      _persist(safeUser, null);
      return safeUser;
    }
  };

  const logout = () => {
    localStorage.removeItem('lp_user');
    localStorage.removeItem('lp_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, loginAs, logout, DEMO_USERS }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
