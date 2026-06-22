import { useEffect, useState } from "react";
import api from "../lib/api";
import { Radio, Clock, RefreshCw, Trophy } from "lucide-react";

export default function Live() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");

  const load = async () => {
    try {
      const { data } = await api.get("/external/live-matches");
      setItems(Array.isArray(data) ? data : []);
      setLastUpdate(new Date().toLocaleTimeString("ar-EG"));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 mb-5">
          <Radio className="w-10 h-10 text-red-400" />
        </div>

        <p className="text-xs font-bold text-red-400 uppercase tracking-[0.2em] mb-2">
          بث حي عالمي
        </p>

        <h1 className="font-display text-4xl sm:text-5xl font-black mb-3">
          البث الحي للمباريات
        </h1>

        <p className="text-zinc-400">
          نتائج مباشرة لجميع مباريات العالم بدون التأثير على توقعات كأس العالم.
        </p>

        {lastUpdate && (
          <p className="text-xs text-zinc-500 mt-3">
            آخر تحديث: {lastUpdate}
          </p>
        )}
      </div>

      <div className="flex justify-center mb-8">
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white hover:bg-white/10"
        >
          <RefreshCw className="w-4 h-4" />
          تحديث الآن
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card rounded-2xl p-14 text-center">
          <Trophy className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-300 text-xl font-black">
            لا توجد مباريات مباشرة الآن
          </p>
          <p className="text-zinc-500 text-sm mt-2">
            عند بدء أي مباراة مباشرة ستظهر هنا تلقائيًا.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {groupByLeague(items).map(([league, matches]) => (
            <section key={league} className="glass-card rounded-2xl p-5">
              <h2 className="font-display text-xl font-black text-gold mb-4">
                {league}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matches.map((m) => (
                  <LiveCard key={m.id} match={m} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function groupByLeague(items) {
  const map = {};
  items.forEach((m) => {
    const key = `${m.country || ""} ${m.league || "مباريات مباشرة"}`.trim();
    if (!map[key]) map[key] = [];
    map[key].push(m);
  });
  return Object.entries(map);
}

function LiveCard({ match }) {
  return (
    <div className="rounded-2xl bg-black/35 border border-white/10 p-5">
      <div className="flex items-center justify-between mb-5">
        <span className="text-xs text-zinc-400 font-bold">
          {match.status_long || "Live"}
        </span>

        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/15 text-red-400 text-xs font-black">
          <span className="relative flex w-2 h-2">
            <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex w-2 h-2 rounded-full bg-red-500"></span>
          </span>
          مباشر {match.elapsed ? `د ${match.elapsed}` : ""}
        </span>
      </div>

      <TeamRow
        name={match.home_team}
        logo={match.home_logo}
        score={match.home_score}
      />

      <div className="h-px bg-white/10 my-3" />

      <TeamRow
        name={match.away_team}
        logo={match.away_logo}
        score={match.away_score}
      />

      <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
        <Clock className="w-3 h-3" />
        {match.status || "LIVE"}
      </div>
    </div>
  );
}

function TeamRow({ name, logo, score }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {logo ? (
          <img
            src={logo}
            alt={name}
            className="w-9 h-9 rounded-full object-contain bg-white/5 p-1"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-white/5" />
        )}

        <span className="font-bold text-white truncate">
          {name || "فريق"}
        </span>
      </div>

      <span className="font-display text-2xl font-black text-gold">
        {score ?? 0}
      </span>
    </div>
  );
}
