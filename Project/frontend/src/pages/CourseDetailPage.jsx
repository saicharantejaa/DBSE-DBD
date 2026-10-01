import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourse } from '../api/client';
import TypePill from '../components/TypePill';
import { Spinner } from '../components/Loaders';

export default function CourseDetailPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [course,  setCourse]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [open,    setOpen]    = useState({});

  useEffect(() => {
    getCourse(Number(id))
      .then(c => {
        setCourse(c);
        if (c.modules?.[0]) setOpen({ [c.modules[0].id]: true });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const toggleModule = (mId) =>
    setOpen(prev => ({ ...prev, [mId]: !prev[mId] }));

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <Spinner size={32} />
    </div>
  );

  if (!course) return (
    <div className="empty-state">
      <div className="empty-state-title">Course entry not found</div>
      <div className="empty-state-desc">The requested syllabus could not be located in the catalog.</div>
    </div>
  );

  const totalContent = course.modules?.reduce((acc, m) => acc + (m.content?.length || 0), 0) || 0;

  return (
    <div>
      {/* Breadcrumb Path */}
      <div style={{ fontSize: '0.8125rem', color: 'var(--sage-mist)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          style={{ cursor: 'pointer', color: 'var(--ink-slate)', textDecoration: 'underline', padding: 0 }}
          onClick={() => navigate('/catalog')}
        >
          Catalog
        </button>
        <span>/</span>
        <span>{course.title}</span>
      </div>

      {/* Course Header Sheet */}
      <div className="archival-box mb-32">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--sage-mist)', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
              {course.course_code ? `[COURSE CODE: ${course.course_code}]` : (course.tag ? `[CATALOG ID: ${course.tag}]` : `[COURSE ID: #${course.id}]`)}
            </span>
            <h1 style={{ fontSize: '1.75rem', marginBottom: 12, color: 'var(--ink-slate)' }}>
              {course.title}
            </h1>
            <p style={{ fontSize: '0.9375rem', color: 'var(--ink-slate)', opacity: 0.85, lineHeight: 1.6, maxWidth: 640, marginBottom: 20 }}>
              {course.description}
            </p>
            {course.prerequisite && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--sage-mist)', marginBottom: 16 }}>
                Prerequisite: <strong style={{ color: 'var(--ink-slate)' }}>{course.prerequisite}</strong>
              </p>
            )}
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: '0.8125rem', color: 'var(--sage-mist)' }}>
              <div>{course.coordinator ? 'Coordinator' : 'Instructor'}: <strong style={{ color: 'var(--ink-slate)' }}>{course.coordinator || course.instructor}</strong></div>
              {course.credits && <div>Credits: <strong style={{ color: 'var(--ink-slate)' }}>{course.credits}</strong></div>}
              <div>Modules: <strong style={{ color: 'var(--ink-slate)' }}>{course.modules?.length || 0}</strong></div>
              <div>Archived Units: <strong style={{ color: 'var(--ink-slate)' }}>{totalContent}</strong></div>
            </div>
          </div>

          <button
            id="btn-ask-about-course"
            className="btn btn-brass"
            style={{ flexShrink: 0 }}
            onClick={() => navigate(`/doubt-solver?courseId=${course.id}`)}
          >
            Ask doubt
          </button>
        </div>
      </div>

      {/* Modules List */}
      <h2 className="section-title">Curriculum Modules</h2>
      {course.modules?.map((mod, idx) => (
        <div key={mod.id} className="module-accordion">
          <div
            id={`module-header-${mod.id}`}
            className="module-accordion-header"
            onClick={() => toggleModule(mod.id)}
            role="button"
            aria-expanded={!!open[mod.id]}
          >
            <div className="module-accordion-title">
              <span className="module-num">{String(idx + 1).padStart(2, '0')}</span>
              <span>{mod.title}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--sage-mist)' }}>
                {mod.content?.length || 0} items
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--sage-mist)' }}>
                {open[mod.id] ? '▲' : '▼'}
              </span>
            </div>
          </div>

          {open[mod.id] && (
            <div className="module-accordion-body">
              {mod.content?.map(item => (
                <div key={item.id} className="content-item">
                  <TypePill type={item.type} />
                  <div style={{ fontWeight: 500, color: 'var(--ink-slate)', minWidth: 160 }}>
                    {item.title}
                  </div>
                  {item.snippet && (
                    <div style={{
                      fontSize: '0.8125rem', color: 'var(--sage-mist)',
                      flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {item.snippet}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
