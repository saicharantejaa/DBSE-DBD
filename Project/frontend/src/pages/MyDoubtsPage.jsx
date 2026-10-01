import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDoubts } from '../api/client';
import Badge from '../components/Badge';
import { SkeletonCard } from '../components/Loaders';

const STATUSES = ['all', 'answered', 'pending', 'escalated'];

export default function MyDoubtsPage() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [doubts,   setDoubts]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');

  useEffect(() => {
    if (!user) return;
    getDoubts(user.id)
      .then(setDoubts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = filter === 'all'
    ? doubts
    : doubts.filter(d => d.status === filter);

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = s === 'all' ? doubts.length : doubts.filter(d => d.status === s).length;
    return acc;
  }, {});

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-24">
        <div>
          <h1 className="page-title">My Doubts</h1>
          <p className="page-subtitle">Historical ledger of submitted inquiries and resolutions.</p>
        </div>
        <button
          id="btn-new-doubt"
          className="btn btn-brass"
          onClick={() => navigate('/doubt-solver')}
        >
          Ask doubt
        </button>
      </div>

      {/* Filter Tabs (Sharp Archival Tabs) */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {STATUSES.map(s => {
          const isActive = filter === s;
          return (
            <button
              key={s}
              id={`filter-${s}`}
              onClick={() => setFilter(s)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius)',
                border: '1px solid',
                borderColor: isActive ? 'var(--brass)' : 'var(--hairline-strong)',
                backgroundColor: isActive ? 'var(--brass)' : 'var(--paper-white)',
                color: isActive ? 'var(--paper-white)' : 'var(--ink-slate)',
                fontSize: '0.8125rem',
                fontWeight: isActive ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s]})
            </button>
          );
        })}
      </div>

      {/* Ledger List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} height={80} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">
            {filter === 'all' ? 'No inquiries recorded' : `No ${filter} entries`}
          </div>
          <div className="empty-state-desc">
            {filter === 'all' ? 'Use the Doubt Solver to register your first inquiry.' : 'Adjust filter selection to view other records.'}
          </div>
        </div>
      ) : (
        <div className="ledger-list">
          {filtered.map(d => (
            <div key={d.id} id={`doubt-item-${d.id}`} className="ledger-row">
              <div className="ledger-row-main">
                <div className="ledger-row-title">
                  {d.questionText}
                </div>
                <div className="ledger-row-meta">
                  <span>{d.courseTitle}</span>
                  {d.moduleTitle && <span> / {d.moduleTitle}</span>}
                  <span> / Logged: {formatDate(d.createdAt)}</span>
                </div>
              </div>

              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <Badge status={d.status} />
                {d.hasResponse && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--brass)', fontWeight: 500 }}>
                    Answer on file
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
