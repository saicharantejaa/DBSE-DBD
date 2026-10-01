import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getInstructorDoubts } from '../api/client';
import Badge from '../components/Badge';
import { SkeletonCard } from '../components/Loaders';

export default function InstructorPage() {
  const { user }    = useAuth();
  const [doubts,    setDoubts]   = useState([]);
  const [loading,   setLoading]  = useState(true);

  useEffect(() => {
    if (!user) return;
    getInstructorDoubts(user.id)
      .then(setDoubts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const stats = [
    { label: 'Total Inquiries', value: doubts.length, sub: 'Logged across courses' },
    { label: 'Answered',        value: doubts.filter(d => d.status === 'answered').length, sub: 'Resolved by system' },
    { label: 'Pending',         value: doubts.filter(d => d.status === 'pending').length, sub: 'In review queue' },
    { label: 'Escalated',       value: doubts.filter(d => d.status === 'escalated').length, sub: 'Requires faculty input' },
  ];

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  // Group by course
  const byCourse = doubts.reduce((acc, d) => {
    if (!acc[d.courseTitle]) acc[d.courseTitle] = [];
    acc[d.courseTitle].push(d);
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-24">
        <h1 className="page-title">Doubt Inbox</h1>
        <p className="page-subtitle">Academic inquiry ledger for faculty review and response oversight.</p>
      </div>

      {/* Numeric Stats Strip */}
      <div className="stats-strip">
        {stats.map((s, i) => (
          <div key={i} className="stats-strip-item">
            {loading ? (
              <div className="skeleton" style={{ height: 38, width: 60, marginBottom: 4 }} />
            ) : (
              <div className="stats-strip-value">{s.value}</div>
            )}
            <div className="stats-strip-label">{s.label}</div>
            <div className="stats-strip-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Escalated Alert Box */}
      {!loading && doubts.some(d => d.status === 'escalated') && (
        <div
          style={{
            marginBottom: 28,
            backgroundColor: 'var(--burgundy-tint)',
            border: '1px solid var(--burgundy)',
            borderRadius: 'var(--radius)',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            color: 'var(--burgundy)',
            fontSize: '0.875rem',
          }}
        >
          <span style={{ fontWeight: 700 }}>[ATTENTION REQUIRED]</span>
          <div>
            One or more inquiries have been marked as escalated. The retrieval confidence fell below threshold and requires manual faculty resolution.
          </div>
        </div>
      )}

      {/* Doubts Grouped by Course */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} height={80} />)}
        </div>
      ) : doubts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No pending inquiries</div>
          <div className="empty-state-desc">All student questions have been addressed or no inquiries have been logged.</div>
        </div>
      ) : (
        Object.entries(byCourse).map(([courseTitle, courseDoubts]) => (
          <div key={courseTitle} style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 className="section-title" style={{ marginBottom: 0 }}>
                {courseTitle}
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--sage-mist)', fontWeight: 600 }}>
                {courseDoubts.length} {courseDoubts.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>

            <div className="ledger-list">
              {courseDoubts.map(d => (
                <div key={d.id} id={`instructor-doubt-${d.id}`} className="ledger-row">
                  <div className="ledger-row-main">
                    <div className="ledger-row-title">
                      {d.questionText}
                    </div>
                    <div className="ledger-row-meta">
                      <span>Student: {d.studentName}</span>
                      <span> / Logged: {formatDate(d.createdAt)}</span>
                    </div>
                  </div>

                  <div style={{ flexShrink: 0 }}>
                    <Badge status={d.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
