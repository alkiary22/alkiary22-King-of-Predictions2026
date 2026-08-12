import { useEffect, useState } from "react";
import api, { apiErrorMessage } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useContent } from "../context/ContentContext";
import {
  Trophy,
  Crown,
  Medal,
  Star,
  RefreshCw,
} from "lucide-react";
import Avatar from "../components/Avatar";
import KingCelebration from "../components/KingCelebration";

const PERIODS = [
  {
    key: "weekly",
    label: "أسبوعي",
    icon: "⚡",
  },
  {
    key: "monthly",
    label: "شهري",
    icon: "📅",
  },
  {
    key: "all",
    label: "كل الوقت",
    icon: "👑",
  },
];

export default function Leaderboard() {
  const { user } = useAuth();
  const { t } = useContent();

  const [period, setPeriod] = useState("weekly");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [marquee, setMarquee] = useState(
    "🏆 الرعاة الرسميون لجائزة ملك التوقعات"
  );

  useEffect(() => {
    api
      .get("/marquee")
      .then((r) => {
        setMarquee(
          r.data?.text || "🏆 الرعاة الرسميون لجائزة ملك التوقعات"
        );
      })
      .catch(() => {});
  }, []);

  const loadLeaderboard = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      const { data } = await api.get("/leaderboard", {
        params: { period },
      });

      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(apiErrorMessage(e));
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [period]);

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  const currentPeriodLabel =
    PERIODS.find((p) => p.key === period)?.label || "أسبوعي";

  return (
    <div
      className="w-full max-w-5xl mx-auto px-3 sm:px-6 pt-4 pb-32"
      data-testid="leaderboard-page"
    >
      <KingCelebration leader={rows[0]} />

      {/* =========================
          Sponsor marquee
      ========================== */}
      <div className="relative mb-5 overflow-hidden rounded-2xl border border-gold/25 bg-black/80 shadow-[0_0_25px_rgba(255,215,0,0.08)]">
        <div className="h-11 flex items-center overflow-hidden">
          <div
            className="whitespace-nowrap text-gold font-black text-xs sm:text-sm"
            style={{
              animation:
                "leaderboardMarquee 18s linear infinite",
            }}
          >
            {marquee}
          </div>
        </div>
      </div>

      {/* =========================
          Header
      ========================== */}
      <div className="text-center mb-6 sm:mb-10">
        <div
          className="
            mx-auto mb-3
            w-16 h-16 sm:w-20 sm:h-20
            rounded-full
            flex items-center justify-center
            bg-black
            border border-white/10
            shadow-[0_0_35px_rgba(255,215,0,0.16)]
          "
        >
          <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-gold" />
        </div>

        <p className="text-gold text-xs sm:text-sm font-black mb-1">
          قاعة الملوك
        </p>

        <h1
          className="
            font-display
            text-3xl sm:text-5xl
            font-black
            leading-tight
            text-white
          "
        >
          {t("leaderboard_title") || "لوحة المتصدرين"}
        </h1>

        <p className="text-zinc-400 text-sm sm:text-base mt-2">
          أفضل اللاعبين في مسابقة ملك التوقعات
        </p>

        <p className="text-zinc-600 text-[11px] sm:text-xs mt-2">
          الترتيب حسب النقاط ثم النتائج الدقيقة 🎯 ثم الأسبق بالتوقع
        </p>
      </div>

      {/* =========================
          Period tabs
      ========================== */}
      <div
        className="
          mb-6
          p-1
          rounded-2xl
          border border-white/10
          bg-[#0b0b0d]
          grid grid-cols-3
          gap-1
        "
      >
        {PERIODS.map((item) => {
          const active = period === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setPeriod(item.key)}
              className={`
                h-14 sm:h-16
                rounded-xl
                flex flex-col
                items-center
                justify-center
                gap-0.5
                transition-all
                duration-300
                font-black
                ${
                  active
                    ? "bg-gradient-to-b from-gold to-[#c99d20] text-black shadow-[0_0_25px_rgba(255,215,0,0.25)]"
                    : "text-zinc-400 hover:text-white bg-transparent"
                }
              `}
            >
              <span className="text-base leading-none">
                {item.icon}
              </span>

              <span className="text-sm sm:text-base">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* =========================
          Current period + refresh
      ========================== */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <p className="text-[11px] text-zinc-500">
            الترتيب الحالي
          </p>

          <p className="text-lg font-black text-white">
            {currentPeriodLabel}
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadLeaderboard(true)}
          disabled={refreshing}
          className="
            w-11 h-11
            rounded-xl
            border border-white/10
            bg-white/[0.03]
            flex items-center justify-center
            text-zinc-400
            hover:text-gold
            transition
          "
        >
          <RefreshCw
            className={`w-5 h-5 ${
              refreshing ? "animate-spin" : ""
            }`}
          />
        </button>
      </div>

      {/* =========================
          Loading
      ========================== */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-2xl bg-white/[0.04] animate-pulse"
            />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div
          className="
            rounded-3xl
            border border-white/10
            bg-white/[0.02]
            p-10
            text-center
          "
        >
          <Trophy className="w-12 h-12 text-zinc-700 mx-auto mb-3" />

          <p className="text-zinc-400 font-bold">
            لا يوجد متصدرون بعد
          </p>

          <p className="text-zinc-600 text-xs mt-2">
            ستظهر النتائج هنا عند احتساب النقاط
          </p>
        </div>
      ) : (
        <>
          {/* =========================
              TOP 3 PODIUM
              مهم للجوال:
              الثلاثة دائمًا في صف واحد
          ========================== */}
          {podium.length > 0 && (
            <div
              className="
                grid
                grid-cols-3
                gap-2
                sm:gap-4
                items-end
                mb-7
                px-0
              "
            >
              {[1, 0, 2].map((index) => {
                const r = podium[index];

                if (!r) {
                  return <div key={`empty-${index}`} />;
                }

                const isFirst = r.rank === 1;
                const isSecond = r.rank === 2;
                const isThird = r.rank === 3;

                return (
                  <div
                    key={r.user_id}
                    data-testid={`podium-${r.rank}`}
                    className={`
                      relative
                      rounded-2xl sm:rounded-3xl
                      text-center
                      overflow-visible
                      border
                      min-w-0
                      ${
                        isFirst
                          ? `
                            bg-gradient-to-b
                            from-gold/20
                            via-gold/[0.06]
                            to-white/[0.02]
                            border-gold/60
                            shadow-[0_0_30px_rgba(255,215,0,0.20)]
                            py-4 sm:py-6
                            scale-[1.02]
                          `
                          : isSecond
                          ? `
                            bg-gradient-to-b
                            from-zinc-300/[0.10]
                            to-white/[0.02]
                            border-zinc-300/25
                            py-3 sm:py-5
                          `
                          : `
                            bg-gradient-to-b
                            from-amber-700/[0.12]
                            to-white/[0.02]
                            border-amber-600/25
                            py-3 sm:py-5
                          `
                      }
                    `}
                  >
                    {/* Medal */}
                    <div
                      className="
                        absolute
                        -top-5 sm:-top-6
                        left-1/2
                        -translate-x-1/2
                        z-10
                      "
                    >
                      <div
                        className={`
                          w-10 h-10 sm:w-12 sm:h-12
                          rounded-full
                          flex items-center justify-center
                          border-2
                          shadow-xl
                          ${
                            isFirst
                              ? "bg-gold text-black border-yellow-100 shadow-[0_0_25px_rgba(255,215,0,0.55)]"
                              : isSecond
                              ? "bg-zinc-200 text-black border-white"
                              : "bg-amber-700 text-white border-amber-400"
                          }
                        `}
                      >
                        {isFirst ? (
                          <Crown className="w-6 h-6 sm:w-7 sm:h-7" />
                        ) : isSecond ? (
                          <Medal className="w-6 h-6 sm:w-7 sm:h-7" />
                        ) : (
                          <Star className="w-6 h-6 sm:w-7 sm:h-7" />
                        )}
                      </div>
                    </div>

                    {/* Avatar */}
                    <div className="pt-5 sm:pt-6">
                      <div
                        className={`
                          mx-auto mb-2
                          rounded-full
                          inline-block
                          ${
                            isFirst
                              ? "ring-2 sm:ring-4 ring-gold shadow-[0_0_20px_rgba(255,215,0,0.35)]"
                              : isSecond
                              ? "ring-2 ring-zinc-300"
                              : "ring-2 ring-amber-700"
                          }
                        `}
                      >
                        <Avatar
                          src={r.avatar}
                          name={r.name}
                          size={isFirst ? 64 : 52}
                        />
                      </div>

                      {/* Rank */}
                      <p className="text-[10px] sm:text-xs text-zinc-500">
                        المركز {r.rank}
                      </p>

                      {/* Name */}
                      <p
                        className="
                          font-black
                          text-[11px] sm:text-sm
                          leading-5
                          mt-1
                          min-h-[40px]
                          px-1
                          flex items-center justify-center
                          break-words
                          overflow-hidden
                        "
                      >
                        {r.name}
                      </p>

                      {/* Points */}
                      <p
                        className={`
                          font-display
                          font-black
                          leading-none
                          mt-1
                          ${
                            isFirst
                              ? "text-2xl sm:text-3xl text-gold"
                              : "text-xl sm:text-2xl text-gold"
                          }
                        `}
                      >
                        {Number(r.total_points || 0).toLocaleString("ar-SA")}
                      </p>

                      <p className="text-[9px] sm:text-xs text-zinc-500 mt-1">
                        نقطة
                      </p>

                      {/* Exact */}
                      {Number(r.exact_count || 0) > 0 && (
                        <div
                          className="
                            mt-2
                            mx-1
                            rounded-lg
                            border border-gold/20
                            bg-gold/[0.05]
                            py-1
                            text-[9px] sm:text-[11px]
                            text-gold
                            font-bold
                          "
                        >
                          🎯 {r.exact_count} دقيقة
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* =========================
              Remaining players
          ========================== */}
          {rest.length > 0 && (
            <div className="space-y-2">
              {rest.map((r) => {
                const isMe =
                  user && r.user_id === user.id;

                return (
                  <div
                    key={r.user_id}
                    data-testid={`leaderboard-row-${r.rank}`}
                    className={`
                      flex
                      items-center
                      gap-3
                      min-h-[72px]
                      px-3 sm:px-4
                      py-2
                      rounded-2xl
                      border
                      transition
                      ${
                        isMe
                          ? `
                            border-gold/50
                            bg-gold/[0.08]
                            shadow-[0_0_20px_rgba(255,215,0,0.08)]
                          `
                          : `
                            border-white/[0.07]
                            bg-white/[0.025]
                          `
                      }
                    `}
                  >
                    {/* Rank */}
                    <div
                      className={`
                        w-8 h-8
                        rounded-full
                        flex items-center justify-center
                        shrink-0
                        font-black
                        text-sm
                        ${
                          isMe
                            ? "bg-gold text-black"
                            : "bg-black text-zinc-500 border border-white/10"
                        }
                      `}
                    >
                      {r.rank}
                    </div>

                    {/* Avatar */}
                    <Avatar
                      src={r.avatar}
                      name={r.name}
                      size={42}
                    />

                    {/* User */}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm sm:text-base truncate">
                        {r.name}
                        {isMe && (
                          <span className="text-[10px] text-gold mr-2">
                            (أنت)
                          </span>
                        )}
                      </p>

                      <p className="text-[10px] sm:text-xs text-zinc-500 mt-1">
                        {r.predictions_count || 0} توقع
                        {Number(r.exact_count || 0) > 0 && (
                          <span className="mr-2 text-gold/80">
                            • 🎯 {r.exact_count} دقيق
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Points */}
                    <div className="text-left shrink-0">
                      <p className="font-display font-black text-xl text-gold">
                        {Number(
                          r.total_points || 0
                        ).toLocaleString("ar-SA")}
                      </p>

                      <p className="text-[9px] text-zinc-600">
                        نقطة
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <style>
        {`
          @keyframes leaderboardMarquee {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
        `}
      </style>
    </div>
  );
}
