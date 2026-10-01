import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCourses } from '../api/client';
import { SkeletonCard } from '../components/Loaders';

export default function CatalogPage() {
  const navigate = useNavigate();
  const [courses,  setCourses]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [query,    setQuery]    = useState('');

  useEffect(() => {
    getCourses()
      .then(setCourses)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.description.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div>
      <div className="mb-32">
        <h1 className="page-title">Course Catalog</h1>
        <p className="page-subtitle">Academic curriculum directory and syllabus index.</p>
      </div>

      {/* Search Input */}
      <div style={{ maxWidth: 440, marginBottom: 28 }}>
        <input
          id="catalog-search"
          type="text"
          className="input"
          placeholder="Filter courses by title or subject..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {/* Vertical Catalog List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} height={88} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No catalog entries found</div>
          <div className="empty-state-desc">Try adjusting your search criteria.</div>
        </div>
      ) : (
        <div className="catalog-list">
          {filtered.map(c => (
            <div
              key={c.id}
              id={`catalog-course-${c.id}`}
              className="catalog-entry"
              onClick={() => navigate(`/courses/${c.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && navigate(`/courses/${c.id}`)}
            >
              <div className="catalog-entry-left">
                <span className="catalog-entry-code-tag">
                  {c.course_code ? `[${c.course_code}]` : (c.tag ? `[${c.tag}]` : `[COURSE-${c.id}]`)}
                </span>
                <div className="catalog-entry-title">{c.title}</div>
                <div className="catalog-entry-desc">{c.description}</div>
                <div className="catalog-entry-meta">
                  {c.coordinator ? `Coordinator: ${c.coordinator}` : (c.instructor ? `Instructor: ${c.instructor}` : null)}
                  {c.credits ? ` • ${c.credits} Credits` : ''}
                  {c.prerequisite ? ` • Prereq: ${c.prerequisite}` : ''}
                </div>
              </div>

              <div className="catalog-entry-right">
                <div className="catalog-entry-count">
                  {c.moduleCount ?? c.modules?.length ?? 4} modules
                </div>
                <span className="catalog-entry-action">
                  View course
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
