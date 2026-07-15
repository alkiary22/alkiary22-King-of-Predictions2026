import { ChevronLeft, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CompetitionCard({ competition }) {

  const navigate = useNavigate();

  return (

    <button
      onClick={() => navigate(`/competition/${competition.id}`)}
      className="group relative overflow-hidden w-full rounded-3xl border border-[#D4AF37]/20 bg-[#121212] hover:border-[#D4AF37]/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(212,175,55,.25)]"
    >

      <div
        className="absolute inset-0 opacity-10"
        style={{
          background:"linear-gradient(135deg,#D4AF37,transparent)"
        }}
      />

      <div className="relative p-5">

        <div className="flex items-center gap-4">

          <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center p-3">

            <img
              src={competition.image}
              alt={competition.title}
              className="w-full h-full object-contain"
            />

          </div>

          <div className="flex-1 text-right">

            <h2 className="text-white text-xl font-black">

              {competition.title}

            </h2>

            <p className="text-zinc-400 mt-2">

              {competition.country}

            </p>

            <div className="flex justify-end mt-4 text-sm text-zinc-300">

              <div className="flex items-center gap-2">

                <CalendarDays size={16}/>

                موسم {competition.seasonLabel || competition.season}

              </div>

            </div>

          </div>

        </div>

        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">

          <ChevronLeft className="text-[#D4AF37] group-hover:-translate-x-1 transition"/>

          <span className="text-[#D4AF37] font-bold">

            دخول البطولة

          </span>

        </div>

      </div>

    </button>

  );

}
