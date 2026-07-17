import { useEffect, useState } from "react";
import api from "@/lib/api";
import { cachedRequest } from "@/lib/queryCache";

function rankStyle(rank) {
  if (rank <= 4) {
    return "bg-blue-500/15 border-r-4 border-blue-500";
  }

  if (rank === 5 || rank === 6) {
    return "bg-orange-500/10 border-r-4 border-orange-500";
  }

  if (rank >= 18) {
    return "bg-red-500/10 border-r-4 border-red-500";
  }

  return "";
}

export default function CompetitionStandings({ competition }) {

  const [rows, setRows] = useState([]);
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

        const data = await cachedRequest(
          `standings:${competitionId}:${competitionSeason}`,
          async () => {
            const res = await api.get(
              `/competitions/${competitionId}/standings?season=${competitionSeason}`
            );
            return Array.isArray(res.data) ? res.data : [];
          }
        );

        if (active) {
          setRows(data);
        }

      } catch (e) {

        console.error("Competition standings error:", e);

        if (active) {
          setError(
            e?.response?.data?.detail ||
            "تعذر تحميل جدول الترتيب"
          );
        }

      } finally {

        if (active) setLoading(false);

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
        جاري تحميل جدول الترتيب...
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

  if (rows.length === 0) {
    return (
      <div className="py-16 text-center text-zinc-500">
        لا يوجد جدول ترتيب متاح
      </div>
    );
  }

  return (
    <div>

      <div className="flex flex-wrap gap-3 mb-4 text-[11px] text-zinc-400">

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-blue-500" />
          مراكز الصدارة
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-orange-500" />
          مراكز أوروبية
        </div>

        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-red-500" />
          مراكز الهبوط
        </div>

      </div>

      <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#151515]">

        <table className="w-full min-w-[650px] text-sm">

          <thead className="bg-[#202020] text-[#D4AF37]">

            <tr>
              <th className="p-3">#</th>
              <th className="p-3 text-right">الفريق</th>
              <th className="p-3">لعب</th>
              <th className="p-3">ف</th>
              <th className="p-3">ت</th>
              <th className="p-3">خ</th>
              <th className="p-3">+/-</th>
              <th className="p-3">ن</th>
            </tr>

          </thead>

          <tbody>

            {rows.map((team) => (

              <tr
                key={`${team?.team?.id}-${team.rank}`}
                className={`border-t border-white/5 transition hover:bg-white/5 ${rankStyle(team.rank)}`}
              >

                <td className="p-3 text-center font-black">
                  {team.rank}
                </td>

                <td className="p-3">

                  <div className="flex items-center gap-3">

                    <img
                      src={team?.team?.logo}
                      alt=""
                      className="w-9 h-9 object-contain"
                    />

                    <span className="font-bold whitespace-nowrap">
                      {team?.team?.name_ar ||
                       team?.team?.name_en}
                    </span>

                  </div>

                </td>

                <td className="text-center">{team.played}</td>
                <td className="text-center">{team.win}</td>
                <td className="text-center">{team.draw}</td>
                <td className="text-center">{team.lose}</td>

                <td className="text-center">
                  {team.gd > 0 ? `+${team.gd}` : team.gd}
                </td>

                <td className="text-center font-black text-[#D4AF37]">
                  {team.points}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}
