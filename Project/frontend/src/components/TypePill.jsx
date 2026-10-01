const TYPE_MAP = {
  text:  { label: 'TEXT' },
  pdf:   { label: 'PDF' },
  video: { label: 'VIDEO' },
  slide: { label: 'SLIDES' },
  link:  { label: 'LINK' },
};

export default function TypePill({ type }) {
  const cfg = TYPE_MAP[type] || { label: (type || 'DOC').toUpperCase() };
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: '0.6875rem',
        fontFamily: 'var(--font-sans)',
        fontWeight: 600,
        letterSpacing: '0.04em',
        padding: '2px 6px',
        border: '1px solid var(--hairline-strong)',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--sage-mist)',
        backgroundColor: 'var(--paper-white)',
        flexShrink: 0,
      }}
    >
      [{cfg.label}]
    </span>
  );
}

export { TYPE_MAP };
