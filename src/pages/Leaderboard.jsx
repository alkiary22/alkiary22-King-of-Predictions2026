import { useEffect, useState } from "react";
import api, { apiErrorMessage } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useContent } from "../context/ContentContext";
import { Trophy, Crown, Medal } from "lucide-react";
import Avatar from "../components/Avatar";

export default function Leaderboard() {
  const { user } = useAuth();
  const { t } = useContent();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/leaderboard");
        setRows(data);
      } catch (e) {
        console.error(apiErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10" data-testid="leaderboard-page">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gold/10 border border-gold/20 mb-5">
          <Trophy className="w-10 h-10 text-gold" />
        </div>
        <p className="text-xs font-bold text-gold uppercase tracking-[0.2em] mb-2">{t("leaderboard_pretitle")}</p>
        <h1 className="font-display text-4xl sm:text-5xl font-black mb-3">
          {t("leaderboard_title")}
        </h1>
        <p className="text-zinc-400 max-w-xl mx-auto">
          {t("leaderboard_desc")}
        </p>
        <p className="text-xs text-zinc-500 max-w-xl mx-auto mt-3">
          الترتيب: النقاط أولاً، ثم عدد النتائج الدقيقة 🎯، ثم الأسبق بالتوقع
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center">
          <p className="text-zinc-400">لا يوجد متسابقون بعد. كن الأول!</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {podium.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-10">
              {[1, 0, 2].map((i) => {
                const r = podium[i];
                if (!r) return <div key={i} />;
                const isFirst = r.rank === 1;
                const isSecond = r.rank === 2;
                return (
                  <div
                    key={r.user_id}
                    data-testid={`podium-${r.rank}`}
                    className={`glass-card rounded-2xl p-5 text-center ${
                      isFirst ? "border-gold/40 sm:scale-105 sm:-translate-y-2" : ""
                    }`}
                  >
                    <div className={`mx-auto mb-3 ${isFirst ? "ring-4 ring-gold rounded-full" : isSecond ? "ring-2 ring-zinc-300 rounded-full" : "ring-2 ring-amber-700 rounded-full"} inline-block`}>
                      <Avatar src={r.avatar} name={r.name} size={56} />
                    </div>
                    <p className="text-xs text-zinc-400 mb-1">المركز {r.rank}</p>
                    <p className="font-bold text-base sm:text-lg leading-tight mb-2 truncate">{r.name}</p>
                    <p className="font-display text-2xl font-black text-gold">{r.total_points}</p>
                    <p className="text-xs text-zinc-500">{r.predictions_count} توقع</p>
                    {r.exact_count > 0 && (
                      <p className="text-[10px] text-gold/80 mt-1 font-bold">🎯 {r.exact_count} نتيجة دقيقة</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Rest */}
          {rest.length > 0 && (
            <div className="glass-card rounded-2xl overflow-hidden">
              {rest.map((r) => {
                const isMe = user && r.user_id === user.id;
                return (
                  <div
                    key={r.user_id}
                    data-testid={`leaderboard-row-${r.rank}`}
                    className={`flex items-center justify-between p-4 border-b border-white/5 last:border-0 ${
                      isMe ? "bg-gold/10 border-r-4 border-r-gold" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-display font-black text-lg text-zinc-400 w-8 text-center">
                        {r.rank}
                      </span>
                      <Avatar src={r.avatar} name={r.name} size={36} />
                      <div>
                        <p className="font-bold">{r.name}{isMe && <span className="text-xs text-gold mr-2">(أنت)</span>}</p>
                        <p className="text-xs text-zinc-500">
                          {r.predictions_count} توقع
                          {r.exact_count > 0 && <span className="mx-2 text-gold/80">• 🎯 {r.exact_count} دقيق</span>}
                        </p>
                      </div>
                    </div>
                    <div className="font-display font-black text-xl text-gold">{r.total_points}</div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
