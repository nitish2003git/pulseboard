export default function Spinner({ size = 20, className = '' }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  );
}

export function FullPageLoader({ label = 'Loading…' }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-bg text-muted">
      <Spinner size={28} className="text-accent" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
