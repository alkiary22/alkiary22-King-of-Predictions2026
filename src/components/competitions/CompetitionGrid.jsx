import { useEffect, useState } from "react";
import api from "@/lib/api";
import CompetitionCard from "./CompetitionCard";

export default function CompetitionGrid() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await api.get("/competitions");

        if (!mounted) return;

        const list = (data || []).map(item => ({
          id: String(item.id),
          title: item.name_ar || item.name_en,
          season:
            Number(item.id) === 2
              ? 2025
              : [1, 39, 140, 135, 78, 61].includes(Number(item.id))
                ? 2026
                : (
                    item.effective_season ||
                    item.current_season
                  ),
          seasonLabel:
            Number(item.id) === 2
              ? "2025/2026"
              : String(
                  [1, 39, 140, 135, 78, 61].includes(Number(item.id))
                    ? 2026
                    : (
                        item.effective_season ||
                        item.current_season ||
                        ""
                      )
                ),
          image: item.logo,
          color: "#D4AF37",
          country: item.country,
          type: item.type,
        }));

        setCompetitions(list);

      } catch (e) {
        if (mounted) {
          setError(
            e?.response?.data?.detail ||
            e?.message ||
            "Unknown Error"
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  if (loading) {
    return <div className="text-center py-10 text-white">جاري تحميل البطولات...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-400">
        خطأ:<br />
        {error}
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 text-center text-[#D4AF37] font-bold">
        عدد البطولات: {competitions.length}
      </div>

      <div className="grid gap-5">
        {competitions.map(c => (
          <CompetitionCard
            key={c.id}
            competition={c}
          />
        ))}
      </div>
    </>
  );
}
