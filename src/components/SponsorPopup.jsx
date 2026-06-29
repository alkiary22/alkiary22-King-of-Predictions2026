import { useEffect, useState } from "react";
import sponsorImage from "../assets/challenge-sponsor.jpg";

export default function SponsorPopup() {
  const [show, setShow] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const enter = setTimeout(() => {
      setVisible(true);
    }, 80);

    const exit = setTimeout(() => {
      setVisible(false);

      setTimeout(() => {
        setShow(false);
        document.body.style.overflow = "";
      }, 400);

    }, 3000);

    return () => {
      clearTimeout(enter);
      clearTimeout(exit);
      document.body.style.overflow = "";
    };
  }, []);

  if (!show) return null;

  return (
    <div
      onClick={() => {
        setVisible(false);
        setTimeout(() => setShow(false), 350);
      }}
      className={`fixed inset-0 z-[99999] flex items-center justify-center transition-all duration-500 ${
        visible
          ? "bg-black/75 backdrop-blur-md opacity-100"
          : "bg-black/0 opacity-0"
      }`}
    >
      <div
        className={`relative w-[92%] max-w-md transition-all duration-500 ${
          visible
            ? "scale-100 opacity-100"
            : "scale-75 opacity-0"
        }`}
      >
        <div className="absolute -inset-2 rounded-[35px] bg-yellow-400/30 blur-3xl animate-pulse"></div>

        <div className="relative overflow-hidden rounded-[32px] border-4 border-yellow-400 bg-[#081420] shadow-[0_0_70px_rgba(255,215,0,.45)]">

          <div className="bg-gradient-to-r from-yellow-500 via-yellow-300 to-yellow-500 py-4 text-center">

            <div className="text-4xl">
              👑
            </div>

            <div className="mt-1 text-xl font-black text-black">
              التحدي برعاية
            </div>

          </div>

          <img
            src={sponsorImage}
            alt="Sponsor"
            className="w-full object-cover"
          />

          <div className="px-6 py-5 text-center">

            <div className="text-lg font-black text-yellow-300">
              شكراً لراعي التحدي
            </div>

            <div className="mt-2 text-sm text-white/70 leading-6">
              نتمنى لكم منافسة ممتعة وحظاً موفقاً لجميع المشاركين.
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">

              <div
                className="h-full bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400"
                style={{
                  animation:"progress 3s linear forwards"
                }}
              />

            </div>

          </div>

        </div>
      </div>

      <style>{`
      @keyframes progress{
        from{width:100%}
        to{width:0}
      }
      `}</style>

    </div>
  );
}
