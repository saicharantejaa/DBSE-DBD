export default function Badge({ status }) {
  if (status === 'answered') {
    return (
      <span className="status-indicator status-answered">
        <span className="stamp-mark">✓</span>
        <span>Answered</span>
      </span>
    );
  }

  if (status === 'pending') {
    return (
      <span className="status-indicator status-pending">
        <span className="status-dot" />
        <span>Pending</span>
      </span>
    );
  }

  if (status === 'escalated') {
    return (
      <span className="status-indicator status-escalated">
        <span className="status-dot" />
        <span>Escalated</span>
      </span>
    );
  }

  return (
    <span className="status-indicator status-neutral">
      <span className="status-dot" />
      <span>{status}</span>
    </span>
  );
}
