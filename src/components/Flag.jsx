export default function Flag({
  code,
  logo = "",
  size = "w-10 h-7",
  className = "",
}) {
  const logoSrc = String(logo || "").trim();

  const flagSrc = code
    ? `https://flagcdn.com/w160/${code}.png`
    : "";

  const src = logoSrc || flagSrc;

  if (!src) return null;

  return (
    <img
      src={src}
      alt={code || "team"}
      loading="lazy"
      onError={(e) => {
        // إذا فشل شعار النادي، نجرب علم الدولة كبديل
        if (logoSrc && flagSrc && e.currentTarget.src !== flagSrc) {
          e.currentTarget.src = flagSrc;
          return;
        }

        e.currentTarget.style.visibility = "hidden";
      }}
      className={`${size} ${
        logoSrc
          ? "object-contain rounded-md bg-white/5"
          : "object-cover rounded-sm"
      } border border-white/10 shadow-sm ${className}`}
    />
  );
}
