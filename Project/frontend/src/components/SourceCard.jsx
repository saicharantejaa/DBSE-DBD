import TypePill from './TypePill';

export default function SourceCard({ source }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        backgroundColor: 'var(--paper-white)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--radius)',
      }}
    >
      <TypePill type={source.type} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--ink-slate)', lineHeight: 1.3 }}>
          {source.title}
        </div>
        {source.moduleTitle && (
          <div style={{ fontSize: '0.75rem', color: 'var(--sage-mist)', marginTop: 2 }}>
            Section: {source.moduleTitle}
          </div>
        )}
      </div>
      <span style={{ fontSize: '0.75rem', color: 'var(--brass)', fontWeight: 600, flexShrink: 0 }}>
        Retrieved
      </span>
    </div>
  );
}
