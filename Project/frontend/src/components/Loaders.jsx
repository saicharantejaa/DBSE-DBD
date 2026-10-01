export function Spinner({ size = 20 }) {
  return (
    <div
      className="spinner"
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  );
}

export function TypingDots() {
  return (
    <div className="bubble-ai" style={{ display: 'inline-block' }}>
      <div className="typing-dots">
        <div className="typing-dot" />
        <div className="typing-dot" />
        <div className="typing-dot" />
      </div>
    </div>
  );
}

export function SkeletonCard({ height = 80 }) {
  return (
    <div className="skeleton" style={{ height, borderRadius: 'var(--radius)' }} />
  );
}
