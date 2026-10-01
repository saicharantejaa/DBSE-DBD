import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCourses, submitDoubt } from '../api/client';
import SourceCard from '../components/SourceCard';
import { TypingDots } from '../components/Loaders';

function formatTimestamp(d) {
  const date = d ? new Date(d) : new Date();
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function LedgerEntry({ msg }) {
  if (msg.type === 'user') {
    return (
      <div className="ledger-entry">
        <div className="ledger-entry-header">
          <div className="ledger-entry-stamp">
            <span>INQUIRY ENTRY</span>
            <span style={{ color: 'var(--sage-mist)', fontWeight: 400 }}>|</span>
            <span style={{ color: 'var(--sage-mist)', fontWeight: 400 }}>{msg.time || formatTimestamp(msg.id)}</span>
          </div>
          <div>Student Log</div>
        </div>
        <div className="ledger-entry-body">
          <div className="ledger-user-question">{msg.text}</div>
        </div>
      </div>
    );
  }

  if (msg.type === 'typing') {
    return (
      <div className="ledger-entry" style={{ borderStyle: 'dashed' }}>
        <div className="ledger-entry-header">
          <div className="ledger-entry-stamp">
            <span>REFERENCE SEARCH</span>
            <span style={{ color: 'var(--sage-mist)', fontWeight: 400 }}>|</span>
            <span style={{ color: 'var(--sage-mist)', fontWeight: 400 }}>Processing</span>
          </div>
          <div>pgvector retrieval</div>
        </div>
        <div className="ledger-entry-body" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <TypingDots />
          <span style={{ fontSize: '0.8125rem', color: 'var(--sage-mist)' }}>
            Retrieving relevant syllabus & textbook chunks...
          </span>
        </div>
      </div>
    );
  }

  // AI response
  const pct = Math.round((msg.response.confidenceScore || 0) * 100);

  return (
    <div className="ledger-entry">
      <div className="ledger-entry-header">
        <div className="ledger-entry-stamp">
          <span>RESOLUTION ENTRY</span>
          <span style={{ color: 'var(--sage-mist)', fontWeight: 400 }}>|</span>
          <span style={{ color: 'var(--sage-mist)', fontWeight: 400 }}>{msg.time || formatTimestamp(msg.id)}</span>
          <span className="stamp-mark" title="Status: Answered">✓ Answered</span>
        </div>
        <div>Academic Reference Model</div>
      </div>

      <div className="ledger-entry-body">
        <div className="ledger-ai-answer">{msg.response.answerText}</div>

        {msg.response.sources?.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--sage-mist)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
              Citations from Course Repository
            </div>
            <div className="source-cards-ledger">
              {msg.response.sources.map((src, i) => (
                <SourceCard key={i} source={src} />
              ))}
            </div>
          </div>
        )}

        <div className="ledger-confidence-strip">
          <span>Confidence score: {pct}%</span>
          <div className="ledger-confidence-bar">
            <div className="ledger-confidence-fill" style={{ width: `${pct}%` }} />
          </div>
          <span style={{ marginLeft: 'auto', color: 'var(--sage-mist)' }}>
            Database Systems & Engineering Knowledge Base
          </span>
        </div>
      </div>
    </div>
  );
}

export default function DoubtSolverPage() {
  const { user }        = useAuth();
  const [searchParams]  = useSearchParams();
  const [courses,       setCourses]  = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [question,      setQuestion] = useState('');
  const [messages,      setMessages] = useState([]);
  const [submitting,    setSubmitting] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    getCourses().then(setCourses).catch(console.error);
  }, []);

  // Pre-fill course from URL param
  useEffect(() => {
    const cid = searchParams.get('courseId');
    if (cid) setSelectedCourse(cid);
  }, [searchParams, courses]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const currentCourse = courses.find(c => c.id === Number(selectedCourse));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || !selectedCourse || submitting) return;

    const nowStr = formatTimestamp(Date.now());
    const userMsg = { type: 'user', text: question, id: Date.now(), time: nowStr };
    const typingMsg = { type: 'typing', id: Date.now() + 1 };

    setMessages(prev => [...prev, userMsg, typingMsg]);
    setQuestion('');
    setSubmitting(true);

    try {
      const result = await submitDoubt({
        studentId:    user.id,
        courseId:     Number(selectedCourse),
        moduleId:     selectedModule ? Number(selectedModule) : null,
        questionText: question.trim(),
      });

      setMessages(prev => [
        ...prev.filter(m => m.type !== 'typing'),
        { type: 'ai', id: Date.now() + 2, time: formatTimestamp(Date.now()), response: result.response },
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev.filter(m => m.type !== 'typing'),
        {
          type: 'ai',
          id: Date.now() + 2,
          time: formatTimestamp(Date.now()),
          response: {
            answerText: 'Could not connect to mock or backend service. Ensure API server is active.',
            confidenceScore: 0,
            sources: [],
          },
        },
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
      {/* Header */}
      <div className="mb-24">
        <h1 className="page-title">Doubt Solver</h1>
        <p className="page-subtitle">Academic inquiry desk referencing course syllabus documents and textbook excerpts.</p>
      </div>

      {/* Context selectors */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <select
            id="select-course"
            className="input"
            value={selectedCourse}
            onChange={e => { setSelectedCourse(e.target.value); setSelectedModule(''); }}
          >
            <option value="">Select course catalog entry...</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
        {currentCourse?.modules && (
          <div style={{ flex: 1 }}>
            <select
              id="select-module"
              className="input"
              value={selectedModule}
              onChange={e => setSelectedModule(e.target.value)}
            >
              <option value="">All course modules (general scope)</option>
              {currentCourse.modules?.map(m => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Ledger Thread Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          border: '1px solid var(--hairline)',
          backgroundColor: 'var(--paper-white)',
          padding: '24px',
          marginBottom: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {messages.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--sage-mist)', maxWidth: 440 }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: 'var(--ink-slate)', marginBottom: 6 }}>
              Inquiry Ledger Ready
            </div>
            <div style={{ fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 20 }}>
              Select a course catalog entry above and record your question. The system will retrieve matching syllabus records and provide verified answers.
            </div>
            {selectedCourse && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--sage-mist)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Standard Inquiries
                </div>
                {[
                  'What is the difference between 2NF and BCNF?',
                  'When should I use a Hash index over a B-Tree?',
                  'How does pgvector handle semantic search?',
                ].map((q, i) => (
                  <button
                    key={i}
                    id={`suggested-q-${i}`}
                    onClick={() => setQuestion(q)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: 'var(--parchment-fog)',
                      border: '1px solid var(--hairline)',
                      borderRadius: 'var(--radius)',
                      fontSize: '0.8125rem',
                      color: 'var(--ink-slate)',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          messages.map(msg => <LedgerEntry key={msg.id} msg={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Row */}
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <textarea
            id="doubt-input"
            className="input"
            placeholder={selectedCourse ? 'Enter your question for the academic ledger... (Enter to submit, Shift+Enter for newline)' : 'Select a course above to begin...'}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!selectedCourse || submitting}
            rows={2}
            style={{ resize: 'none' }}
          />
          <button
            id="btn-submit-doubt"
            type="submit"
            className="btn btn-brass"
            disabled={!question.trim() || !selectedCourse || submitting}
            style={{ padding: '12px 20px', whiteSpace: 'nowrap' }}
          >
            {submitting ? 'Searching…' : 'Submit doubt'}
          </button>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--sage-mist)', marginTop: 8 }}>
          Vector retrieval engine references PostgreSQL pgvector embeddings and course text chunks.
        </div>
      </form>
    </div>
  );
}
