const TV_URL = "https://tv-king.cyou/player.html";

export default function Live() {
  return (
    <div className="w-full h-screen bg-black">
      <iframe
        src={TV_URL}
        title="البث الحي"
        className="w-full h-screen border-0"
        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
