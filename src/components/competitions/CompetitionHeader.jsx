import { Globe, CalendarDays } from "lucide-react";

export default function CompetitionHeader({ competition }) {

  if (!competition) return null;

  return (
    <div
      dir="rtl"
      className="relative overflow-hidden rounded-b-[40px]"
      style={{
        background:
          "linear-gradient(135deg,#D4AF37,#8B6B16,#111827)"
      }}
    >

      <div className="absolute inset-0 bg-black/35" />

      <div className="relative px-6 pt-24 pb-10">

        <div className="flex flex-col items-center">

          <div className="w-28 h-28 rounded-[28px] bg-white p-4 shadow-[0_0_40px_rgba(255,255,255,.15)]">

            <img
              src={competition.logo}
              alt={competition.name_ar || competition.name_en}
              className="w-full h-full object-contain"
            />

          </div>

          <h1 className="mt-5 text-4xl font-black text-white text-center leading-tight">

            {competition.name_ar}

          </h1>

          <p
            dir="ltr"
            className="text-white/75 mt-3 text-lg text-center"
          >

            {competition.name_en}

          </p>

          <div className="flex gap-3 mt-6 flex-wrap justify-center">

            <div className="px-4 py-2 rounded-full bg-white/10 border border-white/10 flex items-center gap-2">

              <Globe size={16} />

              <span>
                {competition.country}
              </span>

            </div>

            <div className="px-4 py-2 rounded-full bg-white/10 border border-white/10 flex items-center gap-2">

              <CalendarDays size={16} />

              <span>
                موسم {competition.season_label || competition.current_season}
              </span>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
