import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEnrollments, getDoubts } from '../api/client';
import Badge from '../components/Badge';
import { SkeletonCard } from '../components/Loaders';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [courses,  setCourses]  = useState([]);
  const [doubts,   setDoubts]   = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getEnrollments(user.id),
      getDoubts(user.id),
    ]).then(([c, d]) => {
      setCourses(c);
      setDoubts(d);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const stats = [
    { label: 'Enrolled Courses', value: courses.length, sub: 'Active curriculum' },
    { label: 'Total Doubts',      value: doubts.length,  sub: 'Questions logged' },
    { label: 'Answered',          value: doubts.filter(d => d.status === 'answered').length, sub: 'Resolved by system' },
    { label: 'Pending',           value: doubts.filter(d => d.status === 'pending').length,  sub: 'Awaiting resolution' },
  ];

  return (
    <div>
      {/* Top Header Strip */}
      <div className="flex items-center justify-between mb-24">
        <div>
          <h1 className="page-title">
            Welcome back, {user?.name?.split(' ')[0] || 'Scholar'}
          </h1>
          <p className="page-subtitle">
            Current status of course enrollments and academic inquiry ledger.
          </p>
        </div>
        <button
          id="btn-ask-doubt"
          className="btn btn-brass"
          onClick={() => navigate('/doubt-solver')}
        >
          Ask doubt
        </button>
      </div>

      {/* Stats Strip (Numeric Ledger Format) */}
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

      {/* Two Column Section */}
      <div className="grid-2">
        {/* Enrolled Courses */}
        <div>
          <div className="flex items-center justify-between mb-16">
            <h2 className="section-title" style={{ marginBottom: 0 }}>Enrolled Courses</h2>
            <button className="btn btn-outline-slate btn-sm" onClick={() => navigate('/catalog')}>
              View catalog
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1, 2].map(i => <SkeletonCard key={i} height={70} />)}
            </div>
          ) : courses.length === 0 ? (
            <div className="card card-pad" style={{ textAlign: 'center', color: 'var(--sage-mist)', fontSize: '0.875rem' }}>
              No active enrollments recorded.
            </div>
          ) : (
            <div className="catalog-list">
              {courses.map(c => (
                <div
                  key={c.id}
                  id={`course-card-${c.id}`}
                  className="catalog-entry"
                  style={{ padding: '14px 16px' }}
                  onClick={() => navigate(`/courses/${c.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && navigate(`/courses/${c.id}`)}
                >
                  <div className="catalog-entry-left">
                    <div className="catalog-entry-title" style={{ fontSize: '1rem', marginBottom: 2 }}>
                      {c.title}
                    </div>
                    <div className="catalog-entry-meta">
                      Instructor: {c.instructor} — {c.moduleCount} modules
                    </div>
                  </div>
                  <div className="catalog-entry-right">
                    <span style={{ fontSize: '0.75rem', color: 'var(--sage-mist)', fontWeight: 600 }}>
                      {c.tag ? `[${c.tag}]` : 'OPEN'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Doubts Ledger */}
        <div>
          <div className="flex items-center justify-between mb-16">
            <h2 className="section-title" style={{ marginBottom: 0 }}>Recent Inquiries</h2>
            <button className="btn btn-outline-slate btn-sm" onClick={() => navigate('/my-doubts')}>
              View ledger
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[1, 2, 3].map(i => <SkeletonCard key={i} height={60} />)}
            </div>
          ) : doubts.length === 0 ? (
            <div className="card card-pad" style={{ textAlign: 'center', color: 'var(--sage-mist)', fontSize: '0.875rem' }}>
              No inquiries recorded in ledger yet.
            </div>
          ) : (
            <div className="ledger-list">
              {doubts.slice(0, 4).map(d => (
                <div key={d.id} className="ledger-row">
                  <div className="ledger-row-main">
                    <div className="ledger-row-title">
                      {d.questionText}
                    </div>
                    <div className="ledger-row-meta">
                      {d.courseTitle}{d.moduleTitle ? ` / ${d.moduleTitle}` : ''}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, paddingTop: 2 }}>
                    <Badge status={d.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Archival Reference Note */}
      <div className="archival-box" style={{ marginTop: 36, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.125rem', fontWeight: 600, color: 'var(--ink-slate)', marginBottom: 4 }}>
            Academic Doubt Resolution Desk
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--sage-mist)', maxWidth: 640 }}>
            Submit questions regarding any enrolled module. The system references textbook materials and course documents to provide verified citations.
          </div>
        </div>
        <button
          id="btn-cta-doubt"
          className="btn btn-brass"
          onClick={() => navigate('/doubt-solver')}
        >
          Ask doubt
        </button>
      </div>
    </div>
  );
}
