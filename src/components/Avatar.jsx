/**
 * Avatar component: shows user's photo or fallback initial.
 */
export default function Avatar({ src, name, size = 40, className = "", testId }) {
  const initial = (name?.[0] || "?").toUpperCase();
  const pxSize = typeof size === "number" ? size : 40;
  const fontSize = Math.max(10, Math.floor(pxSize * 0.42));

  if (src) {
    return (
      <img
        src={src}
        alt={name || "user"}
        data-testid={testId}
        style={{ width: pxSize, height: pxSize }}
        className={`rounded-full object-cover border border-white/10 ${className}`}
      />
    );
  }

  return (
    <div
      data-testid={testId}
      style={{ width: pxSize, height: pxSize, fontSize }}
      className={`rounded-full bg-gold/15 text-gold flex items-center justify-center font-bold shrink-0 ${className}`}
    >
      {initial}
    </div>
  );
}
