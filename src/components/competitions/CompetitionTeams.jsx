import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function CompetitionTeams({ competition }) {

  const [teams, setTeams] = useState([]);
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
          `/competitions/${competitionId}/teams?season=${competitionSeason}`
        );

        if (active) {
          setTeams(
            Array.isArray(data) ? data : []
          );
        }

      } catch (e) {

        console.error(
          "Competition teams error:",
          e
        );

        if (active) {
          setError(
            e?.response?.data?.detail ||
            "تعذر تحميل فرق البطولة"
          );
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
        جاري تحميل الفرق...
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

  if (teams.length === 0) {

    return (
      <div className="py-12 text-center text-zinc-500">
        لا توجد فرق
      </div>
    );

  }

  return (

    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">

      {teams.map((team) => (

        <div
          key={team.id}
          className="rounded-3xl bg-[#181818] border border-white/10 hover:border-[#D4AF37]/40 transition p-5"
        >

          <img
            src={team.logo}
            alt={team.name_ar || team.name_en || ""}
            className="w-16 h-16 mx-auto object-contain"
          />

          <h3 className="mt-4 text-center font-black">

            {team.name_ar ||
             team.name_en ||
             "فريق"}

          </h3>

          <p className="text-center text-sm text-zinc-400 mt-1">

            {team.country_ar ||
             team.country ||
             ""}

          </p>

        </div>

      ))}

    </div>

  );

}
