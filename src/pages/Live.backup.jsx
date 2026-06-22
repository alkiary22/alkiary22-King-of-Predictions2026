const LOCAL_TV_URL = "http://s.com/player.html";
const AWS_TV_URL = "https://tv-king.cyou/player.html?v=pro";

export default function Live() {
  const openLocal = () => {
    window.location.href = LOCAL_TV_URL;
  };

  const openAws = () => {
    window.location.href = AWS_TV_URL;
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-gold/30 bg-zinc-950 p-6 text-center shadow-[0_0_35px_rgba(255,215,0,0.18)]">
        <h1 className="text-3xl font-black text-gold mb-3">
          👑 البث الحي
        </h1>

        <p className="text-zinc-300 mb-6">
          اختر طريقة تشغيل البث حسب مكان اتصالك
        </p>

        <button
          onClick={openLocal}
          className="w-full mb-4 rounded-2xl bg-gold text-black font-black py-4 text-lg"
        >
          📡 مشاهدة داخل شبكة سمكة نت
        </button>

        <button
          onClick={openAws}
          className="w-full rounded-2xl bg-white/10 border border-white/15 text-white font-black py-4 text-lg"
        >
          🌍 مشاهدة خارج الشبكة
        </button>

        <p className="text-xs text-zinc-500 mt-6 leading-6">
          إذا كنت متصلًا بشبكة سمكة نت اختر الزر الأول.
          <br />
          إذا كنت خارج الشبكة اختر الزر الثاني.
        </p>
      </div>
    </div>
  );
}
