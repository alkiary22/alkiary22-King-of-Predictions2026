import { useEffect, useState } from "react";
import api, { apiErrorMessage } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Trophy, Target, BarChart3, Hash, CheckCircle2, Bell } from "lucide-react";
import Flag from "../components/Flag";
import AvatarUploader from "../components/AvatarUploader";
import { enablePushNotifications } from "../lib/push";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [teamsMap, setTeamsMap] = useState({});
  const [matchesMap, setMatchesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushMessage, setPushMessage] = useState("");
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [s, p, t, m, pushInfo] = await Promise.all([
          api.get("/stats/me"),
          api.get("/predictions/me"),
          api.get("/teams"),
          api.get("/matches"),
          api.get("/push/me").catch(() => ({ data: { count: 0 } })),
        ]);
        setStats(s.data);
        setPredictions(p.data);
        const tm = {};
        t.data.forEach((x) => (tm[x.code] = x));
        setTeamsMap(tm);
        const mm = {};
        m.data.forEach((x) => (mm[x.id] = x));
        setMatchesMap(mm);

        if ((pushInfo.data?.count || 0) > 0) {
          setPushEnabled(true);
          setPushMessage("تم تفعيل إشعارات الجوال بنجاح ✅");
          localStorage.setItem("push_enabled", "1");
        } else {
          setPushEnabled(false);
        }
      } catch (e) {
        console.error(apiErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleEnablePush() {
    setPushLoading(true);
    setPushMessage("");
    try {
      await enablePushNotifications();
      localStorage.setItem("push_enabled", "1");
      setPushEnabled(true);
      setPushMessage("تم تفعيل إشعارات الجوال بنجاح ✅");
    } catch (e) {
      setPushMessage(e?.message || "تعذر تفعيل الإشعارات");
    } finally {
      setPushLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="skeleton h-32 rounded-2xl mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))}
        </div>
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10" data-testid="profile-page">
      {/* Header */}
      <div className="glass-card rounded-2xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full bg-gold/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-center gap-5">
          <AvatarUploader user={user} onUpdated={refreshUser} />
          <div>
            <h1 className="font-display text-3xl font-black mb-1">{user?.name}</h1>
            <p className="text-sm text-zinc-400">{user?.email}</p>
            {stats?.rank && (
              <p className="text-xs font-bold text-gold uppercase tracking-widest mt-2">
                المركز #{stats.rank} في التصنيف العام
              </p>
            )}
          </div>
        </div>

        <div className="relative mt-6 rounded-xl border border-gold/20 bg-gold/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-bold text-gold flex items-center gap-2">
              <Bell className="w-4 h-4" />
              إشعارات الجوال
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              فعّل التنبيهات لتصلك نتائج المباريات وتحديث النقاط مباشرة.
            </p>
            {pushEnabled ? (
              <p className="text-xs mt-2 text-green-400 font-bold">
                تم تفعيل إشعارات الجوال بنجاح ✅
              </p>
            ) : pushMessage ? (
              <p className="text-xs mt-2 text-zinc-300">{pushMessage}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleEnablePush}
            disabled={pushLoading || pushEnabled}
            className="px-4 py-2 rounded-lg bg-gold text-black font-black text-sm hover:opacity-90 disabled:opacity-60"
          >
            {pushLoading ? "جاري التفعيل..." : pushEnabled ? "الإشعارات مفعلة ✅" : "تفعيل الإشعارات 🔔"}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatWidget icon={Trophy} label="إجمالي النقاط" value={stats?.total_points ?? 0} accent />
        <StatWidget icon={Hash} label="عدد التوقعات" value={stats?.total_predictions ?? 0} />
        <StatWidget icon={CheckCircle2} label="نتائج دقيقة" value={stats?.correct_exact ?? 0} />
        <StatWidget icon={Target} label="دقة التوقعات" value={`${stats?.accuracy ?? 0}%`} />
      </div>

      {/* Predictions history */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-gold" />
          <h2 className="font-display text-xl font-bold">سجل توقعاتي</h2>
          <span className="text-sm text-zinc-500">({predictions.length})</span>
        </div>

        {predictions.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            لم تقم بأي توقعات بعد. اذهب إلى صفحة المباريات وابدأ المنافسة!
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {predictions.map((p) => {
              const m = matchesMap[p.match_id];
              if (!m) return null;
              const home = teamsMap[m.home_team];
              const away = teamsMap[m.away_team];
              const finished = m.status === "finished";
              return (
                <div
                  key={p.id}
                  data-testid={`prediction-row-${p.id}`}
                  className="p-5 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Flag code={home?.code} size="w-8 h-6" />
                    <span className="text-sm font-medium truncate">{home?.name_ar}</span>
                    <span className="text-xs text-zinc-500">ضد</span>
                    <span className="text-sm font-medium truncate">{away?.name_ar}</span>
                    <Flag code={away?.code} size="w-8 h-6" />
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-center">
                      <p className="text-xs text-zinc-500">توقعك</p>
                      <p className="font-display font-bold">{p.home_score} - {p.away_score}</p>
                    </div>
                    {finished && (
                      <div className="text-center">
                        <p className="text-xs text-zinc-500">النتيجة</p>
                        <p className="font-display font-bold text-gold">{m.home_score} - {m.away_score}</p>
                      </div>
                    )}
                    {finished && typeof p.points === "number" && (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-black ${
                          p.points === 3
                            ? "bg-gold text-black"
                            : p.points === 1
                            ? "bg-green-500/15 text-green-400"
                            : "bg-white/5 text-zinc-500"
                        }`}
                      >
                        +{p.points}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatWidget({ icon: Icon, label, value, accent }) {
  return (
    <div
      className={`glass-card rounded-xl p-5 ${
        accent ? "bg-gradient-to-br from-gold/10 to-transparent border-gold/20" : ""
      }`}
    >
      <Icon className={`w-5 h-5 mb-3 ${accent ? "text-gold" : "text-zinc-400"}`} />
      <p className="text-xs text-zinc-400 mb-1">{label}</p>
      <p className={`font-display text-2xl font-black ${accent ? "text-gold" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}
