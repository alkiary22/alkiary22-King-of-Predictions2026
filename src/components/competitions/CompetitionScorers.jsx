import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function CompetitionScorers({ competition }) {

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const competitionId =
    competition?.id ||
    competition?.apiLeagueId;

  const competitionSeason =
    competition?.effective_season ||
    competition?.current_season ||
    competition?.season ||
    2026;

  useEffect(() => {

    if (!competitionId) return;

    let active = true;

    async function load() {

      setLoading(true);
      setError("");

      try {

        const { data } = await api.get(
          `/competitions/${competitionId}/scorers?season=${competitionSeason}`
        );

        if (active) {
          setPlayers(
            Array.isArray(data) ? data : []
          );
        }

      } catch (e) {

        console.error(
          "Competition scorers error:",
          e
        );

        if (active) {
          setError("تعذر تحميل قائمة الهدافين");
        }

      } finally {

        if (active) {
          setLoading(false);
        }

      }

    }

    load();

    return () => {
      active = false;
    };

  }, [competitionId, competitionSeason]);

  if (loading) {
    return (
      <div className="py-12 text-center text-zinc-400">
        جاري تحميل الهدافين...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-center text-red-300">
        {error}
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="py-12 text-center text-zinc-500">
        لا توجد بيانات للهدافين
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="space-y-3"
    >
      {players.map((item, index) => {

        const player = item?.player || {};
        const statistics =
          item?.statistics?.[0] || {};

        const team =
          statistics?.team || {};

        const goals =
          statistics?.goals?.total ?? 0;

        return (
          <div
            key={player.id || index}
            className="rounded-2xl bg-[#181818] border border-white/10 p-4 flex items-center gap-3"
          >

            <div className="w-8 shrink-0 text-center text-[#D4AF37] font-black text-lg">
              {index + 1}
            </div>

            <img
              src={player.photo}
              alt=""
              className="w-16 h-16 shrink-0 rounded-full object-cover bg-[#252525]"
            />

            <div className="flex-1 min-w-0">

              <div className="font-black text-white truncate">
                {player.name || "لاعب"}
              </div>

              <div className="text-sm text-zinc-400 truncate mt-1">
                {team.name || "-"}
              </div>

            </div>

            <div className="shrink-0 text-center min-w-[48px]">

              <div className="text-2xl font-black text-[#D4AF37]">
                {goals}
              </div>

              <div className="text-xs text-zinc-500">
                هدف
              </div>

            </div>

          </div>
        );

      })}
    </div>
  );
}
