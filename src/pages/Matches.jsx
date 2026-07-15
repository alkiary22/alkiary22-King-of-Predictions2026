import { useEffect, useState, useMemo, useCallback } from "react";
import api, { apiErrorMessage } from "../lib/api";
import { getServerNow } from "../lib/serverTime";
import Flag from "../components/Flag";
import Countdown from "../components/Countdown";
import AdSlider from "../components/AdSlider";
import { useAuth } from "../context/AuthContext";
import { useContent } from "../context/ContentContext";
import { Link } from "react-router-dom";
import { Calendar, Lock, Trophy, Loader2, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";


const TEAM_MAP_CACHE = {};


// All match times displayed in Mecca/Riyadh time (Asia/Riyadh, UTC+3)
const MECCA_TZ = "Asia/Riyadh";

function formatDateAr(iso) {
  try {
    // iso is "YYYY-MM-DD" — render as Arabic date label (no TZ shift needed for date-only)
    return new Date(iso + "T12:00:00Z").toLocaleDateString("ar-EG-u-nu-latn", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: MECCA_TZ,
    });
  } catch {
    return iso;
  }
}

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString("ar-EG-u-nu-latn", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: MECCA_TZ,
    }) + " (مكة)";
  } catch {
    return "";
  }
}

export default function Matches() {
  const { user, refreshUser } = useAuth();
  const { t } = useContent();
  const [marquee,setMarquee]=useState("🏆 الرعاة الرسميون لجائزة ملك التوقعات");
  const [matches, setMatches] = useState([]);
  const [teamsMap, setTeamsMap] = useState({});
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [competition, setCompetition] = useState("all");
  const [competitions, setCompetitions] = useState([]);
  const [selectedDate, setSelectedDate] = useState("ALL");

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [teamsRes, matchesRes, predsRes, competitionsRes] = await Promise.all([
        Object.keys(TEAM_MAP_CACHE).length
          ? Promise.resolve({ data: Object.values(TEAM_MAP_CACHE) })
          : api.get("/teams"),
        api.get("/matches"),
        user ? api.get("/predictions/me") : Promise.resolve({ data: [] }),
        api.get("/competitions").catch(() => ({ data: [] })),
      ]);
      const tm = {};
      teamsRes.data.forEach((t) => (tm[t.code] = t));
      Object.assign(TEAM_MAP_CACHE, tm);
      setTeamsMap(tm);
      setCompetitions(
        Array.isArray(competitionsRes.data)
          ? competitionsRes.data
          : []
      );
      setMatches(matchesRes.data.sort((a,b)=>{
        const order={
          "دور الـ32":0,
          "مرحلة المجموعات":1,
          "دور الـ16":2,
          "ربع النهائي":3,
          "نصف النهائي":4,
          "النهائي":5
        };
        const oa=order[a.stage]??99;
        const ob=order[b.stage]??99;
        if(oa!==ob)return oa-ob;
        return new Date(a.kickoff)-new Date(b.kickoff);
      }));
      const pm = {};
      predsRes.data.forEach((p) => (pm[p.match_id] = p));
      setPredictions(pm);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [user]);

  
useEffect(() => {
  api.get("/marquee")
    .then(r=>setMarquee(r.data?.text || ""))
    .catch(()=>{});
}, []);

useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filteredMatches = useMemo(() => {
    let list = matches;

    if (competition !== "all") {
      if (competition === "worldcup") {
        list = list.filter((m) =>
          (m.competition || "worldcup") === "worldcup" ||
          Number(m.league_id) === 1
        );
      } else {
        list = list.filter(
          (m) => Number(m.league_id) === Number(competition)
        );
      }
    }

    if (selectedDate !== "ALL") {
      list = list.filter(
        (m) => m.match_date === selectedDate
      );
    }

    return list;
  }, [matches, competition, selectedDate]);

  const groupedStages = useMemo(() => {
    const groups = new Map();

    filteredMatches.forEach((match) => {
      const stage =
        match.round_ar ||
        match.stage ||
        match.round_en ||
        "المباريات";

      if (!groups.has(stage)) {
        groups.set(stage, []);
      }

      groups.get(stage).push(match);
    });

    return Array.from(groups.entries());
  }, [filteredMatches]);

  const availableDates = useMemo(() => {
    let list = matches;

    if (competition !== "all") {
      if (competition === "worldcup") {
        list = list.filter((m) =>
          (m.competition || "worldcup") === "worldcup" ||
          Number(m.league_id) === 1
        );
      } else {
        list = list.filter(
          (m) => Number(m.league_id) === Number(competition)
        );
      }
    }

    return Array.from(
      new Set(list.map((m) => m.match_date).filter(Boolean))
    ).sort();
  }, [matches, competition]);

  const handlePredictionSaved = (pred) => {
    setPredictions((prev) => ({ ...prev, [pred.match_id]: pred }));
    refreshUser?.();
  };

  return (
    <div className="matches-apk-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" data-testid="matches-page">
      <div className="king-matches-adslider">
        <div className="matches-ad-slider-position">
        <AdSlider />
      </div>
      </div>

      <div className="king-matches-competitions mb-6">
        <div
          dir="rtl"
          className="flex gap-2 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          <button
            type="button"
            onClick={() => {
              setCompetition("all");
              setSelectedDate("ALL");
            }}
            className={`shrink-0 px-5 py-3 rounded-2xl font-black text-sm border transition-all ${
              competition === "all"
                ? "bg-gold text-black border-gold"
                : "bg-[#191919] text-white border-white/10"
            }`}
          >
            الكل
          </button>

          {competitions.map((item) => {
            const value =
              Number(item.id) === 1
                ? "worldcup"
                : String(item.id);

            const active =
              String(competition) === String(value);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setCompetition(value);
                  setSelectedDate("ALL");
                }}
                className={`shrink-0 min-w-[120px] px-4 py-3 rounded-2xl border transition-all ${
                  active
                    ? "bg-gold text-black border-gold"
                    : "bg-[#191919] text-white border-white/10"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {item.logo && (
                    <img
                      src={item.logo}
                      alt=""
                      className="w-7 h-7 object-contain"
                    />
                  )}

                  <span className="font-black text-xs whitespace-nowrap">
                    {item.name_ar || item.name_en}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="matches-apk-marquee">
        <div className="matches-apk-marquee-inner">
          <div
            className="matches-apk-marquee-track"
            style={{ animation: "matchesMarquee 18s linear infinite" }}
          >
            {marquee}
          </div>
        </div>

        <style>
          {"@keyframes matchesMarquee { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }"}
        </style>
      </div>

      <section className="king-matches-hero">
        <div className="king-matches-copy">
          <p className="king-matches-kicker">
            {t("matches_pretitle")}
          </p>

          <h1 className="king-matches-title">
            {t("matches_title")}
          </h1>

          <p className="king-matches-description">
            {t("matches_desc")}
          </p>
        </div>

        {user && (
          <div className="king-matches-points">
            <Trophy className="king-matches-points-icon" />

            <div className="king-matches-points-data">
              <span className="king-matches-points-label">
                رصيد نقاطك
              </span>

              <strong
                className="king-matches-points-value"
                data-testid="matches-points-balance"
              >
                {user.total_points}
              </strong>
            </div>
          </div>
        )}
      </section>

      {availableDates.length > 0 && (
        <div className="matches-apk-date-filter" data-testid="date-filters">
          <label className="matches-apk-date-label">
            اختر تاريخ المباريات
          </label>

          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="matches-apk-date-select"
          >
            <option value="ALL">كل التواريخ</option>
            {availableDates.map((d) => (
              <option key={d} value={d}>
                {formatDateAr(d)}
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="matches-apk-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-56 rounded-xl" />
          ))}
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <Calendar className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h3 className="font-display text-2xl font-bold mb-2">لا توجد مباريات بعد</h3>
          <p className="text-zinc-400">
            ترقب إضافة المباريات قريباً من قبل لجنة المسابقة.
          </p>
          {user?.role === "admin" && (
            <Link
              to="/admin"
              className="inline-block mt-6 px-6 py-3 rounded-lg bg-gold text-black font-bold hover:bg-yellow-400 transition-colors"
            >
              أضف أول مباراة
            </Link>
          )}
        </div>
      ) : (
        <div className="matches-apk-stages space-y-12">
          {groupedStages.map(([stage, list]) => {
            if (!list.length) return null;

            return (
              <section key={stage} className="matches-apk-stage">
                <div className="matches-apk-stage-title">
                  <Trophy className="w-5 h-5 text-gold" />
                  <h2 className="font-display text-xl font-bold">{stage}</h2>
                  <span className="text-sm text-zinc-500 font-medium">({list.length} مباراة)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {list.map((m) => (
                    <MatchCard
                      key={m.id}
                      match={m}
                      teamsMap={teamsMap}
                      prediction={predictions[m.id]}
                      canPredict={!!user}
                      onSaved={handlePredictionSaved}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterBtn({ current, value, onClick, children }) {
  const active = current === value;
  return (
    <button
      data-testid={`date-filter-${value}`}
      onClick={() => onClick(value)}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? "bg-gold text-black" : "bg-surface border border-white/10 text-zinc-300 hover:bg-white/5"
      }`}
    >
      {children}
    </button>
  );
}

function MatchCard({ match, teamsMap, prediction, canPredict, onSaved }) {
  const home = teamsMap[match.home_team];
  const away = teamsMap[match.away_team];
  const isFinished = match.status === "finished";
  const kickoffPast = useMemo(() => {
    try {
      // Use server time (not device time) to prevent clock tampering
      return new Date(match.kickoff).getTime() <= getServerNow();
    } catch {
      return false;
    }
  }, [match.kickoff]);
  const locked = isFinished || kickoffPast;

  const [home_score, setHome] = useState(prediction?.home_score ?? "");
  const [away_score, setAway] = useState(prediction?.away_score ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setHome(prediction?.home_score ?? "");
    setAway(prediction?.away_score ?? "");
  }, [prediction]);

  const submit = async (e) => {
    e.preventDefault();
    if (home_score === "" || away_score === "") {
      toast.error("أدخل توقع الفريقين");
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post("/predictions", {
        match_id: match.id,
        home_score: Number(home_score),
        away_score: Number(away_score),
      });
      toast.success("تم حفظ التوقع");
      onSaved(data);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      data-testid={`match-card-${match.id}`}
      className="matches-apk-card glass-card rounded-2xl p-6 flex flex-col gap-5 transition-all"
    >
      <div className="flex items-center justify-between text-xs">
        <span className="px-2 py-1 rounded-md bg-white/5 text-zinc-400 font-medium">
          {match.stage}{match.group_name ? ` · ${match.group_name}` : ""}
        </span>
        <span className="flex items-center gap-1 text-zinc-400">
          <Clock className="w-3 h-3" />
          {formatTime(match.kickoff)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <TeamSide team={home} />
        <div className="flex items-center gap-2 text-2xl font-display font-black">
          {isFinished ? (
            <span className="text-gold" data-testid={`match-result-${match.id}`}>
              {match.home_score} - {match.away_score}
            </span>
          ) : (
            <span className="text-zinc-600">VS</span>
          )}
        </div>
        <TeamSide team={away} />
      </div>

      {/* Countdown */}
      {!isFinished && (
        <div className="py-2">
          <Countdown kickoff={match.kickoff} />
        </div>
      )}

      {/* Prediction form */}
      {!canPredict ? (
        <Link
          to="/login"
          className="text-center py-3 rounded-lg bg-white/5 border border-white/10 text-sm text-zinc-300 hover:bg-white/10 transition-colors"
        >
          سجّل دخول للتوقع
        </Link>
      ) : locked ? (
        <div className="border-t border-white/5 pt-4">
          {prediction ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-gold" />
                <span className="text-sm text-zinc-300">توقعك:</span>
                <span className="font-display font-bold text-lg">
                  {prediction.home_score} - {prediction.away_score}
                </span>
              </div>
              {isFinished && typeof prediction.points === "number" && (
                <span
                  data-testid={`prediction-points-${match.id}`}
                  className={`px-3 py-1 rounded-full text-xs font-black ${
                    prediction.points === 3
                      ? "bg-gold text-black"
                      : prediction.points === 1
                      ? "bg-green-500/15 text-green-400"
                      : "bg-white/5 text-zinc-400"
                  }`}
                >
                  +{prediction.points} نقطة
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Lock className="w-4 h-4" />
              فاتك التوقع لهذه المباراة
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="border-t border-white/5 pt-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <input
              type="number"
              min="0"
              max="30"
              value={home_score}
              onChange={(e) => setHome(e.target.value)}
              data-testid={`home-score-input-${match.id}`}
              placeholder="0"
              className="w-20 bg-black/40 border border-white/10 rounded-lg py-3 text-center font-display font-black text-2xl text-white focus:border-gold focus:ring-1 focus:ring-gold outline-none"
            />
            <span className="text-zinc-600 font-bold">-</span>
            <input
              type="number"
              min="0"
              max="30"
              value={away_score}
              onChange={(e) => setAway(e.target.value)}
              data-testid={`away-score-input-${match.id}`}
              placeholder="0"
              className="w-20 bg-black/40 border border-white/10 rounded-lg py-3 text-center font-display font-black text-2xl text-white focus:border-gold focus:ring-1 focus:ring-gold outline-none"
            />
            <button
              type="submit"
              disabled={saving}
              data-testid={`submit-prediction-${match.id}`}
              className="flex-1 py-3 rounded-lg bg-gold text-black font-bold text-sm hover:bg-yellow-400 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {prediction ? "تحديث" : "احفظ التوقع"}
            </button>
          </div>
          {prediction && (
            <p className="text-xs text-zinc-500">
              التوقع الحالي: {prediction.home_score} - {prediction.away_score}
            </p>
          )}
        </form>
      )}
    </div>
  );
}

function TeamSide({ team }) {
  if (!team) return <div className="flex-1 h-12" />;
  return (
    <div className="flex-1 flex flex-col items-center gap-2 text-center">
      <Flag code={team.code} size="w-12 h-9" />
      <span className="text-sm font-bold leading-tight">{team.name_ar}</span>
    </div>
  );
}
