import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { id: 'student',    label: 'Student',    desc: 'Browse catalog & submit inquiries' },
  { id: 'instructor', label: 'Faculty',    desc: 'Curriculum oversight & doubt review' },
];

const DEMO_USERS = {
  student:    { email: 'ravi@student.edu',    name: 'Ravi Kumar' },
  instructor: { email: 'ananya@platform.edu', name: 'Dr. Ananya Sharma' },
};

export default function LoginPage() {
  const { login, register, loginAs } = useAuth();
  const navigate   = useNavigate();
  const [tab,  setTab]  = useState('login');
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [name,  setName]  = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const resolvedEmail = email || DEMO_USERS[role].email;
      const resolvedPass  = password || 'password123';
      if (tab === 'login') {
        await login(resolvedEmail, resolvedPass);
      } else {
        const resolvedName = name || DEMO_USERS[role].name;
        await register(resolvedName, resolvedEmail, resolvedPass, role);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (r) => {
    setLoading(true);
    try {
      await loginAs(r);
      navigate('/dashboard');
    } catch {
      setError('Could not reach backend — proceeding in demo session.');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-title">LearnAI</div>
          <div className="login-subtitle">Course Catalog & Academic Doubt Ledger</div>
        </div>

        <div className="login-tabs" role="tablist">
          <button
            id="tab-login"
            role="tab"
            aria-selected={tab === 'login'}
            className={`login-tab${tab === 'login' ? ' active' : ''}`}
            onClick={() => setTab('login')}
          >
            Sign In
          </button>
          <button
            id="tab-signup"
            role="tab"
            aria-selected={tab === 'signup'}
            className={`login-tab${tab === 'signup' ? ' active' : ''}`}
            onClick={() => setTab('signup')}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {tab === 'signup' && (
            <div style={{ marginBottom: 12 }}>
              <input
                id="input-name"
                className="login-input"
                type="text"
                placeholder="Full scholar name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          )}
          <div style={{ marginBottom: 12 }}>
            <input
              id="input-email"
              className="login-input"
              type="email"
              placeholder="Institutional email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <input
              id="input-password"
              className="login-input"
              type="password"
              placeholder="Password (default: password123)"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div style={{ color: 'var(--burgundy)', fontSize: '0.8125rem', marginBottom: 12, textAlign: 'center' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--sage-mist)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Role Designation
            </div>
            <div className="role-grid">
              {ROLES.map(r => (
                <div
                  key={r.id}
                  id={`role-${r.id}`}
                  className={`role-option${role === r.id ? ' selected' : ''}`}
                  onClick={() => setRole(r.id)}
                  role="radio"
                  aria-checked={role === r.id}
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setRole(r.id)}
                >
                  <div className="role-option-label">{r.label}</div>
                  <div className="role-option-desc">{r.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <button id="btn-submit" type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Processing…' : tab === 'login' ? 'Sign in' : 'Register account'}
          </button>
        </form>

        {/* Demo Fast Access */}
        <div style={{ marginTop: 24, borderTop: '1px solid var(--hairline)', paddingTop: 16 }}>
          <div style={{ fontSize: '0.6875rem', color: 'var(--sage-mist)', textAlign: 'center', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Direct Demonstration Access
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              id="btn-demo-student"
              className="btn btn-outline-slate btn-sm"
              style={{ flex: 1 }}
              onClick={() => handleQuickLogin('student')}
            >
              Student demo
            </button>
            <button
              id="btn-demo-instructor"
              className="btn btn-outline-slate btn-sm"
              style={{ flex: 1 }}
              onClick={() => handleQuickLogin('instructor')}
            >
              Faculty demo
            </button>
          </div>
        </div>

        <div style={{ marginTop: 20, fontSize: '0.6875rem', color: 'var(--sage-mist)', textAlign: 'center', lineHeight: 1.5 }}>
          Database Systems & Engineering Project<br />
          PostgreSQL · pgvector RAG · FastAPI Architecture
        </div>
      </div>
    </div>
  );
}
