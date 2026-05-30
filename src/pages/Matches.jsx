import { useEffect, useState, useMemo, useCallback } from "react";
import api, { apiErrorMessage } from "../lib/api";
import { getServerNow } from "../lib/serverTime";
import Flag from "../components/Flag";
import Countdown from "../components/Countdown";
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
  const [matches, setMatches] = useState([]);
  const [teamsMap, setTeamsMap] = useState({});
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("ALL");

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [teamsRes, matchesRes, predsRes] = await Promise.all([
        Object.keys(TEAM_MAP_CACHE).length
          ? Promise.resolve({ data: Object.values(TEAM_MAP_CACHE) })
          : api.get("/teams"),
        api.get("/matches"),
        user ? api.get("/predictions/me") : Promise.resolve({ data: [] }),
      ]);
      const tm = {};
      teamsRes.data.forEach((t) => (tm[t.code] = t));
      Object.assign(TEAM_MAP_CACHE, tm);
      setTeamsMap(tm);
      setMatches(matchesRes.data);
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
    loadAll();
  }, [loadAll]);

  const groupedByDate = useMemo(() => {
    const filtered = selectedDate === "ALL" ? matches : matches.filter((m) => m.match_date === selectedDate);
    const g = {};
    filtered.forEach((m) => {
      g[m.match_date] = g[m.match_date] || [];
      g[m.match_date].push(m);
    });
    return Object.entries(g).sort((a, b) => a[0].localeCompare(b[0]));
  }, [matches, selectedDate]);

  const availableDates = useMemo(() => {
    return Array.from(new Set(matches.map((m) => m.match_date))).sort();
  }, [matches]);

  const handlePredictionSaved = (pred) => {
    setPredictions((prev) => ({ ...prev, [pred.match_id]: pred }));
    refreshUser?.();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" data-testid="matches-page">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
        <div>
          <p className="text-xs font-bold text-gold uppercase tracking-[0.2em] mb-2">{t("matches_pretitle")}</p>
          <h1 className="font-display text-4xl sm:text-5xl font-black mb-3">
            {t("matches_title")}
          </h1>
          <p className="text-zinc-400 text-base">
            {t("matches_desc")}
          </p>
        </div>
        {user && (
          <div className="glass-card rounded-xl px-6 py-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gold/15 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-gold" />
            </div>
            <div>
              <p className="text-xs text-zinc-400">رصيد نقاطك</p>
              <p className="font-display text-3xl font-black text-gold" data-testid="matches-points-balance">
                {user.total_points}
              </p>
            </div>
          </div>
        )}
      </div>

      {availableDates.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8" data-testid="date-filters">
          <FilterBtn current={selectedDate} value="ALL" onClick={setSelectedDate}>
            كل التواريخ
          </FilterBtn>
          {availableDates.map((d) => (
            <FilterBtn key={d} current={selectedDate} value={d} onClick={setSelectedDate}>
              {formatDateAr(d)}
            </FilterBtn>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-56 rounded-xl" />
          ))}
        </div>
      ) : matches.length === 0 ? (
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
        <div className="space-y-12">
          {groupedByDate.map(([date, list]) => (
            <section key={date} data-testid={`date-section-${date}`}>
              <div className="flex items-center gap-3 mb-5">
                <Calendar className="w-5 h-5 text-gold" />
                <h2 className="font-display text-xl font-bold">{formatDateAr(date)}</h2>
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
          ))}
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
      className="glass-card rounded-2xl p-6 flex flex-col gap-5 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(255,215,0,0.06)] transition-all"
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
