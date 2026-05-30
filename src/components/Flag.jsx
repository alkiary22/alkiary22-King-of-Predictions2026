export default function Flag({ code, size = "w-10 h-7", className = "" }) {
  if (!code) return null;
  const src = `https://flagcdn.com/w160/${code}.png`;
  return (
    <img
      src={src}
      alt={code}
      loading="lazy"
      className={`${size} object-cover rounded-sm border border-white/10 shadow-sm ${className}`}
    />
  );
}
