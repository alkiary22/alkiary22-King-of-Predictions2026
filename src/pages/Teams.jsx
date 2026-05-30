import { useEffect, useState, useMemo } from "react";
import api, { apiErrorMessage } from "../lib/api";
import Flag from "../components/Flag";
import { useContent } from "../context/ContentContext";
import { Search } from "lucide-react";

const CONFEDERATIONS = {
  UEFA: "الاتحاد الأوروبي",
  CONMEBOL: "اتحاد أمريكا الجنوبية",
  AFC: "الاتحاد الآسيوي",
  CAF: "الاتحاد الإفريقي",
  CONCACAF: "اتحاد الكونكاكاف",
  OFC: "اتحاد أوقيانوسيا",
};

export default function Teams() {
  const { t } = useContent();
  const [teams, setTeams] = useState([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/teams");
        setTeams(data);
      } catch (e) {
        console.error(apiErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return teams.filter((t) => {
      const matchFilter = filter === "ALL" || t.confederation === filter;
      const matchQ = q.trim().length === 0 || t.name_ar.includes(q.trim()) || t.name_en.toLowerCase().includes(q.toLowerCase());
      return matchFilter && matchQ;
    });
  }, [teams, q, filter]);

  const grouped = useMemo(() => {
    const g = {};
    filtered.forEach((t) => {
      g[t.confederation] = g[t.confederation] || [];
      g[t.confederation].push(t);
    });
    return g;
  }, [filtered]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" data-testid="teams-page">
      <div className="mb-10">
        <p className="text-xs font-bold text-gold uppercase tracking-[0.2em] mb-2">{t("teams_pretitle")}</p>
        <h1 className="font-display text-4xl sm:text-5xl font-black mb-3">
          {t("teams_title")}
        </h1>
        <p className="text-zinc-400 text-base max-w-2xl">
          {t("teams_desc_template")}
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            data-testid="teams-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث عن منتخب…"
            className="w-full bg-surface border border-white/10 rounded-lg pr-10 pl-4 py-3 text-white focus:border-gold outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterBtn current={filter} value="ALL" onClick={setFilter}>الكل</FilterBtn>
          {Object.entries(CONFEDERATIONS).map(([k, v]) => (
            <FilterBtn key={k} current={filter} value={k} onClick={setFilter}>{v}</FilterBtn>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(grouped).map(([conf, list]) => (
            <section key={conf} data-testid={`confederation-${conf}`}>
              <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-3">
                <span className="text-gold">{CONFEDERATIONS[conf] || conf}</span>
                <span className="text-sm text-zinc-500 font-medium">({list.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {list.map((t) => (
                  <div
                    key={t.code}
                    data-testid={`team-card-${t.code}`}
                    className="flex items-center gap-3 glass-card rounded-xl p-4 hover:border-gold/40 hover:-translate-y-0.5 transition-all"
                  >
                    <Flag code={t.code} size="w-12 h-9" />
                    <div>
                      <p className="font-bold leading-tight">{t.name_ar}</p>
                      <p className="text-xs text-zinc-500">{t.name_en}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-zinc-500 py-12">لا توجد نتائج مطابقة</p>
          )}
        </div>
      )}
    </div>
  );
}

function FilterBtn({ current, value, onClick, children }) {
  const active = current === value;
  return (
    <button
      data-testid={`filter-${value}`}
      onClick={() => onClick(value)}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? "bg-gold text-black" : "bg-surface border border-white/10 text-zinc-300 hover:bg-white/5"
      }`}
    >
      {children}
    </button>
  );
}
