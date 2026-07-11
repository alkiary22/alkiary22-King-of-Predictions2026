import { useEffect, useState } from "react";
import api from "../lib/api";
import {
  Trophy,
  Crown,
  Star,
  Goal,
  Gift,
  Phone,
  User,
  LockKeyhole,
  ChevronDown,
  Smartphone,
} from "lucide-react";

const Field = ({ icon: Icon, title, points, value, onChange, placeholder }) => (
  <div className="rounded-2xl border border-[#D4AF37]/25 bg-black/55 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#D4AF37]/35 bg-[#D4AF37]/10">
          <Icon className="h-5 w-5 text-[#FFD85A]" />
        </div>
        <div>
          <div className="font-black text-white">{title}</div>
          <div className="mt-1 text-xs text-zinc-500">اختر توقعك النهائي</div>
        </div>
      </div>

      <span className="whitespace-nowrap rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-xs font-black text-[#FFD85A]">
        {points} نقاط
      </span>
    </div>

    <div className="relative">
      <input
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-[#080808] px-4 py-4 pl-11 text-white outline-none transition focus:border-[#D4AF37]/70 focus:shadow-[0_0_20px_rgba(212,175,55,0.08)]"
      />
      <ChevronDown className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#D4AF37]" />
    </div>
  </div>
);

export default function FinalChallenge() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    champion: "",
    bestPlayer: "",
    topScorer: "",
  });

  // 14 يوليو 2026 - الساعة 22:00 بتوقيت مكة
  const CLOSE_AT = new Date("2026-07-14T22:00:00+03:00");

  const getRemaining = () => {
    const diff = CLOSE_AT.getTime() - Date.now();

    if (diff <= 0) {
      return {
        closed: true,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
      };
    }

    return {
      closed: false,
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  };

  const [remaining, setRemaining] = useState(getRemaining);
  const [showSponsorPopup, setShowSponsorPopup] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [saving, setSaving] = useState(false);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  const loadLeaderboard = async () => {
    try {
      const { data } = await api.get("/final-challenge/leaderboard");
      setLeaderboard(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Final challenge leaderboard error:", error);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(getRemaining());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const sponsorTimer = setTimeout(() => {
      setShowSponsorPopup(false);
    }, 3000);

    return () => clearTimeout(sponsorTimer);
  }, []);

  useEffect(() => {
    loadLeaderboard();

    const leaderboardTimer = setInterval(() => {
      loadLeaderboard();
    }, 30000);

    return () => clearInterval(leaderboardTimer);
  }, []);

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();

    if (remaining.closed) {
      alert("تم إغلاق توقعات تحدي كأس العالم");
      return;
    }

    if (saving) return;

    try {
      setSaving(true);

      const { data } = await api.post("/final-challenge/entry", {
        name: form.name.trim(),
        phone: form.phone.trim(),
        champion: form.champion.trim(),
        best_player: form.bestPlayer.trim(),
        top_scorer: form.topScorer.trim(),
      });

      alert(data?.message || "تم تثبيت توقعاتك بنجاح 👑");

      await loadLeaderboard();
    } catch (error) {
      alert(
        error?.response?.data?.detail ||
        "تعذر حفظ توقعاتك، حاول مرة أخرى"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#050505] text-white"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[460px] w-[900px] -translate-x-1/2 rounded-full bg-[#D4AF37]/10 blur-[130px]" />
        <div className="absolute inset-x-0 top-0 h-[540px] bg-[radial-gradient(circle_at_center_top,rgba(212,175,55,0.13),transparent_62%)]" />
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.04)_1px,transparent_1px)] [background-size:35px_35px]" />
      </div>

      {showSponsorPopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-3 backdrop-blur-sm">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border-2 border-[#D4AF37] bg-black shadow-[0_0_60px_rgba(212,175,55,0.35)]">
            <button
              type="button"
              onClick={() => setShowSponsorPopup(false)}
              className="absolute left-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/80 text-2xl font-black text-white shadow-xl"
              aria-label="إغلاق الإعلان"
            >
              ×
            </button>

            <img
              src="/final-challenge-sponsor.png"
              alt="الراعي الرسمي لتحدي كأس العالم"
              className="block max-h-[88vh] w-full object-contain"
            />

            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
              <div className="h-full animate-[sponsorProgress_3s_linear_forwards] bg-[#FFD85A]" />
            </div>
          </div>

          <style>{`
            @keyframes sponsorProgress {
              from { width: 100%; }
              to { width: 0%; }
            }
          `}</style>
        </div>
      )}

      <div className="relative mx-auto max-w-2xl px-4 pb-16 pt-8">
        <section className="relative overflow-hidden rounded-[30px] border border-[#D4AF37]/25 bg-gradient-to-b from-[#17130a] via-[#0d0c09] to-[#070707] px-5 py-9 text-center shadow-[0_25px_80px_rgba(0,0,0,.6)]">
          <div className="absolute inset-x-0 bottom-0 h-32 bg-[radial-gradient(ellipse_at_bottom,rgba(212,175,55,.18),transparent_70%)]" />

          <div className="relative">
            <div className="mx-auto mb-5 flex h-28 w-28 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-black/50 shadow-[0_0_55px_rgba(212,175,55,.22)]">
              <Trophy
                className="h-16 w-16 text-[#FFD85A] drop-shadow-[0_0_18px_rgba(255,216,90,.5)]"
                strokeWidth={1.5}
              />
            </div>

            <div className="mb-2 text-xs font-black tracking-[0.35em] text-[#D4AF37]">
              WORLD CUP CHALLENGE
            </div>

            <h1 className="text-3xl font-black sm:text-4xl">
              تحدي <span className="text-[#FFD85A]">كأس العالم</span>
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-zinc-400">
              توقع بطل كأس العالم وأفضل لاعب والهداف
              <br />
              واجمع أعلى نقاط التحدي
            </p>

            <div className="mx-auto mt-6 flex max-w-sm items-center justify-center gap-3 rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 p-4">
              <Smartphone className="h-9 w-9 text-[#FFD85A]" />
              <div className="text-right">
                <div className="text-xs text-zinc-400">جائزة التحدي</div>
                <div className="text-xl font-black text-[#FFD85A]">
                  جوال واحد 📱
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative -mt-3 mx-3 rounded-2xl border border-red-500/25 bg-[#160a0a]/95 p-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
              <LockKeyhole className="h-5 w-5 text-red-400" />
            </div>

            <div>
              <div className="font-black text-red-300">
                موعد إغلاق التوقعات
              </div>
              <p className="mt-1 text-sm leading-6 text-zinc-400">
                وقت الإغلاق: 14 يوليو 2026 الساعة 10:00 مساءً بتوقيت مكة.
              </p>

              {remaining.closed ? (
                <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-center font-black text-red-300">
                  🔒 تم إغلاق التوقعات
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-4 gap-2" dir="ltr">
                  {[
                    ["يوم", remaining.days],
                    ["ساعة", remaining.hours],
                    ["دقيقة", remaining.minutes],
                    ["ثانية", remaining.seconds],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-xl border border-[#D4AF37]/25 bg-black/60 p-2 text-center"
                    >
                      <div className="text-xl font-black text-[#FFD85A]">
                        {String(value).padStart(2, "0")}
                      </div>
                      <div className="mt-1 text-[10px] text-zinc-400">
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-7">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-l from-[#D4AF37]/50 to-transparent" />
            <div className="flex items-center gap-2 font-black text-[#FFD85A]">
              <Crown className="h-5 w-5" />
              سجل توقعاتك
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-[#D4AF37]/50 to-transparent" />
          </div>

          <form
            onSubmit={submit}
            className="space-y-4 rounded-[28px] border border-white/10 bg-[#0b0b0b]/95 p-4 shadow-[0_30px_80px_rgba(0,0,0,.5)] sm:p-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-zinc-300">
                  <User className="h-4 w-4 text-[#D4AF37]" />
                  الاسم
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="اكتب اسمك"
                  className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 outline-none transition focus:border-[#D4AF37]/70"
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-zinc-300">
                  <Phone className="h-4 w-4 text-[#D4AF37]" />
                  رقم الجوال
                </label>
                <input
                  required
                  inputMode="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="رقم الجوال"
                  className="w-full rounded-xl border border-white/10 bg-black px-4 py-4 outline-none transition focus:border-[#D4AF37]/70"
                />
              </div>
            </div>

            <Field
              icon={Crown}
              title="توقع بطل كأس العالم"
              points={10}
              value={form.champion}
              onChange={(value) => update("champion", value)}
              placeholder="اكتب اسم المنتخب"
            />

            <Field
              icon={Star}
              title="توقع أفضل لاعب"
              points={5}
              value={form.bestPlayer}
              onChange={(value) => update("bestPlayer", value)}
              placeholder="اكتب اسم اللاعب"
            />

            <Field
              icon={Goal}
              title="توقع هداف كأس العالم"
              points={5}
              value={form.topScorer}
              onChange={(value) => update("topScorer", value)}
              placeholder="اكتب اسم اللاعب"
            />

            <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-zinc-300">
                  مجموع نقاط التحدي الممكنة
                </span>
                <span className="text-2xl font-black text-[#FFD85A]">
                  20 نقطة
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={remaining.closed || saving}
              className="group relative w-full overflow-hidden rounded-2xl disabled:cursor-not-allowed disabled:opacity-40 bg-gradient-to-l from-[#B98A18] via-[#FFD85A] to-[#B98A18] py-4 font-black text-black shadow-[0_12px_35px_rgba(212,175,55,.18)] transition active:scale-[.98]"
            >
              <span className="relative flex items-center justify-center gap-2">
                <Trophy className="h-5 w-5" />
                {remaining.closed ? "تم إغلاق التوقعات 🔒" : saving ? "جاري حفظ توقعاتك..." : "تثبيت توقعاتي"}
              </span>
            </button>
          </form>
        </section>

        <section className="mt-7 overflow-hidden rounded-[28px] border border-[#D4AF37]/25 bg-[#0b0b0b]/95 shadow-[0_30px_80px_rgba(0,0,0,.5)]">
          <div className="border-b border-[#D4AF37]/20 bg-gradient-to-l from-[#D4AF37]/10 to-transparent p-5">
            <div className="flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-[#FFD85A]" />
              <h2 className="text-xl font-black text-[#FFD85A]">
                ترتيب تحدي كأس العالم
              </h2>
            </div>

            <p className="mt-2 text-center text-xs text-zinc-500">
              يتم تحديث الترتيب تلقائيًا
            </p>
          </div>

          <div className="p-4">
            {leaderboardLoading ? (
              <div className="py-10 text-center text-zinc-500">
                جاري تحميل الترتيب...
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="py-10 text-center">
                <Trophy className="mx-auto h-10 w-10 text-[#D4AF37]/40" />
                <div className="mt-3 font-bold text-zinc-400">
                  لا توجد مشاركات حتى الآن
                </div>
                <div className="mt-1 text-xs text-zinc-600">
                  كن أول المشاركين في التحدي 👑
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/60 px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-black ${
                        entry.rank === 1
                          ? "bg-[#FFD85A] text-black"
                          : entry.rank === 2
                          ? "bg-zinc-300 text-black"
                          : entry.rank === 3
                          ? "bg-amber-700 text-white"
                          : "bg-white/5 text-zinc-400"
                      }`}>
                        {entry.rank === 1
                          ? "🥇"
                          : entry.rank === 2
                          ? "🥈"
                          : entry.rank === 3
                          ? "🥉"
                          : entry.rank}
                      </div>

                      <div className="min-w-0 text-right">
                        <div className="truncate font-black text-white">
                          {entry.name}
                        </div>
                        <div className="mt-1 text-[11px] text-zinc-600">
                          المركز {entry.rank}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-left">
                      <span className="text-xl font-black text-[#FFD85A]">
                        {entry.score}
                      </span>
                      <span className="mr-1 text-xs text-zinc-500">
                        نقطة
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-[24px] border border-[#D4AF37]/25 bg-gradient-to-l from-[#151107] via-[#0c0b08] to-[#151107] p-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10">
            <Gift className="h-6 w-6 text-[#FFD85A]" />
          </div>

          <div className="text-xl font-black text-[#FFD85A]">
            محفظة تمكين
          </div>

          <div className="mt-3 rounded-xl border border-[#D4AF37]/30 bg-black/40 p-4">
            <p className="text-sm font-black leading-7 text-[#FFD85A]">
              ⚠️ شرط استلام الجائزة: يجب أن يكون الفائز مسجلًا ولديه حساب فعال في محفظة تمكين.
            </p>
          </div>

          <p className="mt-4 text-sm text-zinc-400">
            ليس لديك حساب؟ للاشتراك بمحفظة تمكين تواصل على الرقم
          </p>

          <a
            href="tel:776761076"
            dir="ltr"
            className="mt-3 inline-block text-2xl font-black tracking-wider text-white"
          >
            776761076
          </a>
        </section>
      </div>
    </main>
  );
}
