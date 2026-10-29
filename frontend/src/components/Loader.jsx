// Reusable loading spinner.
export default function Loader({ size = 'md', text, inline = false }) {
  const sizeClass = size === 'sm' ? ' loader-sm' : size === 'lg' ? ' loader-lg' : '';

  if (inline) {
    return <span className={`loader${sizeClass}`} role="status" aria-label="Loading" />;
  }

  return (
    <div className="loader-wrap" role="status" aria-live="polite">
      <span className={`loader${sizeClass}`} />
      {text && <span className="loader-text">{text}</span>}
    </div>
  );
}
