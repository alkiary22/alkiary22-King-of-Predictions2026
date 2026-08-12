import { useEffect, useMemo, useRef, useState } from "react";
import api, { apiErrorMessage } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  CircleMinus,
  Crown,
  Flame,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

function TeamScore({ team, value, onChange }) {
  function decrease() {
    onChange(Math.max(0, Number(value) - 1));
  }

  function increase() {
    onChange(Math.min(20, Number(value) + 1));
  }

  return (
    <div className="flex flex-col items-center min-w-0">
      <div className="h-[72px] flex items-center justify-center">
        <img
          src={team?.logo}
          alt=""
          className="w-[64px] h-[64px] object-contain"
        />
      </div>

      <div className="mt-3 text-[17px] font-black text-white text-center line-clamp-2 min-h-[48px]">
        {team?.name_ar || team?.name_en || "الفريق"}
      </div>

      <div className="mt-3 h-[62px] w-full max-w-[190px] rounded-[20px] border border-white/10 bg-[#0B1527] flex items-center overflow-hidden">
        <button
          type="button"
          onClick={decrease}
          className="w-[34%] h-full flex items-center justify-center text-zinc-500 text-[30px] active:bg-white/5"
        >
          −
        </button>

        <div className="w-[32%] h-full bg-white/[0.025] flex items-center justify-center text-[28px] font-black text-white">
          {value}
        </div>

        <button
          type="button"
          onClick={increase}
          className="w-[34%] h-full flex items-center justify-center text-zinc-500 text-[30px] active:bg-white/5"
        >
          +
        </button>
      </div>
    </div>
  );
}

function PulseOption({ title, percent, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        min-w-0 rounded-[20px] border px-2 py-4 transition-all duration-300
        ${
          active
            ? `border-[#D4AF37]/70 bg-[#D4AF37]/10 shadow-[0_0_24px_rgba(212,175,55,0.10)]`
            : `border-white/10 bg-[#0B1527]`
        }
      `}
    >
      <div
        className={`
          text-[13px] font-black truncate
          ${active ? "text-white" : "text-zinc-400"}
        `}
      >
        {title}
      </div>

      <div className="mt-2 text-[22px] font-black text-[#F4C62F]">
        {percent}%
      </div>
    </button>
  );
}

function isUuidLike(value) {
  if (!value) return false;
  // UUID v4-ish check (enough for distinguishing from "fd:564628")
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value).trim()
  );
}

export default function CompetitionPrediction() {
  const navigate = useNavigate();
  const location = useLocation();
  const { fixtureId } = useParams();

  const match = location.state?.match || null;
  const competition = location.state?.competition || null;

  // IMPORTANT:
  // sometimes location.state.matchId might be "fd:xxxx" or numeric => ignore unless it's an internal UUID.
  const initialMatchId = isUuidLike(location.state?.matchId)
    ? location.state.matchId
    : null;

  const [matchId, setMatchId] = useState(initialMatchId);

  const { user } = useAuth();

  const storageKey = `competition_prediction_${fixtureId}`;
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [savedPrediction, setSavedPrediction] = useState(null);
  const [savingPrediction, setSavingPrediction] = useState(false);
  const [predictionSavedLocally, setPredictionSavedLocally] = useState(false);
  const [pulseChoice, setPulseChoice] = useState(null);
  const [savedMessage, setSavedMessage] = useState("");

  // يمنع طلب /predictions/me القديم من الكتابة فوق التوقع
  // الذي حفظه المستخدم للتو.
  const predictionSaveVersion = useRef(0);
  const hasSavedInThisPage = useRef(false);

  // 1) Load local saved prediction
  useEffect(() => {
    window.scrollTo(0, 0);

    try {
      const saved =
        localStorage.getItem(storageKey) ||
        sessionStorage.getItem(storageKey);

      if (!saved) return;

      const parsed = JSON.parse(saved);

      if (
        parsed &&
        parsed.match_id &&
        String(parsed.match_id) === String(matchId || parsed.match_id)
      ) {
        setHomeScore(Number(parsed?.home_score) || 0);
        setAwayScore(Number(parsed?.away_score) || 0);
        setSavedPrediction(parsed);
        setPredictionSavedLocally(true);
      }
    } catch (error) {
      console.error("Load competition prediction error:", error);
    }
  }, [storageKey, matchId]);

  // 2) Resolve internal matchId via backend link (best practice)
  useEffect(() => {
    if (!fixtureId) return;

    // If we already have a valid internal uuid, no need to link again
    if (isUuidLike(matchId)) return;

    api
      .get(`/competition/match-link/${fixtureId}`)
      .then(({ data }) => {
        if (data?.found && data?.match_id) {
          setMatchId(data.match_id);
        } else {
          setMatchId(null);
        }
      })
      .catch(() => {
        setMatchId(null);
      });
  }, [fixtureId, matchId]);

  // 3) Load server prediction for this internal matchId.
  // لا نسمح للطلب القديم بإلغاء التوقع الذي حفظه المستخدم للتو.
  useEffect(() => {
    if (!user) return;
    if (!matchId || !isUuidLike(matchId)) return;

    let cancelled = false;
    const requestVersion = predictionSaveVersion.current;

    api.get("/predictions/me", { __skipCache: true })
      .then(({ data }) => {
        if (cancelled) return;
        if (requestVersion !== predictionSaveVersion.current) return;

        const list = Array.isArray(data) ? data : [];

        const mine = list.find(
          (p) => String(p?.match_id) === String(matchId)
        );

        if (!mine) return;

        if (requestVersion !== predictionSaveVersion.current) return;

        setHomeScore(Number(mine.home_score) || 0);
        setAwayScore(Number(mine.away_score) || 0);
        setSavedPrediction(mine);
        setPredictionSavedLocally(true);

        try {
          const json = JSON.stringify(mine);
          localStorage.setItem(storageKey, json);
          sessionStorage.setItem(storageKey, json);
        } catch (_) {}
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [user, matchId, storageKey]);

  const winner = useMemo(() => {
    if (homeScore > awayScore) return "home";
    if (awayScore > homeScore) return "away";
    return "draw";
  }, [homeScore, awayScore]);

  const pulse = useMemo(() => {
    const fixtureNumber =
      Number(String(fixtureId || "").replace(/\D/g, "").slice(-6)) || 1;

    let homePercent = 40 + (fixtureNumber % 19);
    let drawPercent = 15 + (fixtureNumber % 9);
    let awayPercent = 100 - homePercent - drawPercent;

    if (awayPercent < 12) {
      awayPercent = 12;
      homePercent = 100 - drawPercent - awayPercent;
    }

    return { home: homePercent, draw: drawPercent, away: awayPercent };
  }, [fixtureId]);

  const predictionCount = useMemo(() => {
    const value =
      Number(String(fixtureId || "").replace(/\D/g, "").slice(-5)) || 1;
    return 120 + (value % 1880);
  }, [fixtureId]);

  const samePredictionCount = useMemo(() => {
    if (!savedPrediction) return 0;
    const base =
      Number(homeScore) * 31 + Number(awayScore) * 17 + predictionCount;
    return 12 + (base % 240);
  }, [savedPrediction, homeScore, awayScore, predictionCount]);

  if (!match) {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-[#020B1B] text-white px-5 py-8"
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-14 h-14 rounded-[20px] border border-white/10 bg-[#0C1729] flex items-center justify-center"
        >
          <ArrowRight size={30} />
        </button>

        <div className="mt-20 text-center">
          <div className="text-xl font-black">تعذر فتح المباراة</div>
          <div className="mt-3 text-zinc-500">
            ارجع إلى البطولة واختر المباراة من جديد
          </div>
        </div>
      </div>
    );
  }

  const home = match?.teams?.home;
  const away = match?.teams?.away;

  const homeName = home?.name_ar || home?.name_en || "صاحب الأرض";
  const awayName = away?.name_ar || away?.name_en || "الضيف";

  async function savePrediction() {
    if (!user) {
      setSavedMessage("يجب تسجيل الدخول");
      return;
    }

    if (!matchId || !isUuidLike(matchId)) {
      setSavedMessage("هذه المباراة غير متاحة للتوقع");
      return;
    }

    if (savingPrediction) return;

    const predictionPayload = {
      match_id: matchId,
      home_score: Number(homeScore),
      away_score: Number(awayScore),
    };

    const previousPrediction = savedPrediction;

    // إلغاء صلاحية أي GET /predictions/me بدأ قبل هذا الحفظ.
    predictionSaveVersion.current += 1;
    const currentSaveVersion = predictionSaveVersion.current;

    // من هذه اللحظة الواجهة تعتمد على التوقع الذي اختاره المستخدم،
    // ولا نسمح بتحميل بيانات قديمة فوقه.
    hasSavedInThisPage.current = true;

    // =========================================================
    // تحديث الواجهة فورًا قبل أي انتظار للشبكة
    // =========================================================
    const instantPrediction = {
      ...(previousPrediction &&
      typeof previousPrediction === "object"
        ? previousPrediction
        : {}),
      ...predictionPayload,
      _localSaved: true,
      _localSavedAt: Date.now(),
    };

    setSavingPrediction(true);

    // أهم سطرين: إظهار الحفظ فورًا
    setPredictionSavedLocally(true);
    setSavedPrediction(instantPrediction);
    setSavedMessage("جاري حفظ توقعك...");

    // التخزين فورًا في مكانين
    try {
      const json = JSON.stringify(instantPrediction);

      localStorage.setItem(storageKey, json);
      sessionStorage.setItem(storageKey, json);
    } catch (_) {}

    // إجبار المتصفح على إعطاء React فرصة للرسم قبل انتظار الشبكة
    await new Promise((resolve) => {
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(() => resolve());
      } else {
        setTimeout(resolve, 0);
      }
    });

    try {
      // الحفظ الحقيقي في السيرفر
      const { data } = await api.post(
        "/predictions",
        predictionPayload
      );

      // الحفظ نجح.
      // الواجهة المحلية هي المصدر الفوري للحالة.
      if (currentSaveVersion !== predictionSaveVersion.current) {
        return;
      }

      const serverPrediction =
        data?.prediction ||
        data?.data ||
        data ||
        null;

      const confirmedPrediction = {
        ...instantPrediction,
        ...(serverPrediction &&
        typeof serverPrediction === "object" &&
        !Array.isArray(serverPrediction)
          ? serverPrediction
          : {}),
        ...predictionPayload,
      };

      // مهم: تحديث React مباشرة بعد نجاح POST
      setHomeScore(Number(predictionPayload.home_score));
      setAwayScore(Number(predictionPayload.away_score));
      setSavedPrediction(confirmedPrediction);
      setPredictionSavedLocally(true);
      setSavedMessage("تم حفظ توقعك بنجاح");

      // حفظ محلي بدون أي انتظار
      try {
        const json = JSON.stringify(confirmedPrediction);
        localStorage.setItem(storageKey, json);
        sessionStorage.setItem(storageKey, json);
      } catch (_) {}

      // لا نعمل GET /predictions/me هنا.
      // لأن هذا الطلب قد يعيد نسخة قديمة من الكاش.
      setTimeout(() => {
        setSavedMessage("");
      }, 3000);

    } catch (e) {
      console.error("Save prediction error:", e);

      // فشل الحفظ فقط => تراجع
      setSavedPrediction(previousPrediction || null);
      setPredictionSavedLocally(Boolean(previousPrediction));

      try {
        if (previousPrediction) {
          const json = JSON.stringify(previousPrediction);

          localStorage.setItem(storageKey, json);
          sessionStorage.setItem(storageKey, json);
        } else {
          localStorage.removeItem(storageKey);
          sessionStorage.removeItem(storageKey);
        }
      } catch (_) {}

      setSavedMessage(apiErrorMessage(e));

    } finally {
      setSavingPrediction(false);
    }
  }

  const selectedPulse = pulseChoice || winner;
  const selectedPulsePercent = pulse[selectedPulse] || 0;

  return (
    <div dir="rtl" className="min-h-screen bg-[#020B1B] text-white pb-32">
      <div className="px-5 pt-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-[62px] h-[62px] rounded-[22px] border border-white/10 bg-[#0C1729] flex items-center justify-center"
          >
            <ArrowRight size={34} />
          </button>

          <div className="text-[20px] font-black text-zinc-400">
            {competition?.name_ar || competition?.title || "البطولة الكبرى"}
          </div>

          <div className="w-[62px]" />
        </div>

        <div className="mt-10 rounded-[32px] border border-emerald-500/20 bg-gradient-to-b from-emerald-500/[0.06] to-transparent px-4 py-8">
          <div className="flex items-center justify-center gap-5">
            <div className="h-px flex-1 bg-emerald-500/20" />
            <div className="rounded-full border border-emerald-500/40 bg-emerald-500/[0.08] px-7 py-4 flex items-center gap-3">
              <span className="text-[27px] font-black text-emerald-400">
                ابدأ توقعك
              </span>
              <span className="text-[28px]">⚽</span>
            </div>
            <div className="h-px flex-1 bg-emerald-500/20" />
          </div>

          <div className="mt-10 flex items-center justify-end gap-3">
            <div className="w-9 h-9 rounded-full border border-emerald-500/40 bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-black">
              1
            </div>
            <div className="text-[22px] font-black">النتيجة الدقيقة</div>
          </div>

          <div className="mt-8 grid grid-cols-[1fr_30px_1fr] items-center gap-3">
            <TeamScore team={home} value={homeScore} onChange={setHomeScore} />
            <div className="text-center text-zinc-600 text-[28px] font-black">
              -
            </div>
            <TeamScore team={away} value={awayScore} onChange={setAwayScore} />
          </div>

          <div className="mt-7 rounded-[20px] border border-[#D4AF37]/40 bg-[#D4AF37]/[0.08] px-5 py-5 flex items-center justify-between">
            <div className="w-10 h-10 rounded-full bg-[#F4C62F] text-black flex items-center justify-center">
              <Check size={22} strokeWidth={3} />
            </div>

            <div className="text-right">
              <div className="text-zinc-500 text-[14px]">الفائز</div>
              <div className="mt-1 text-[#F4C62F] text-[20px] font-black">
                {winner === "home"
                  ? homeName
                  : winner === "away"
                    ? awayName
                    : "تعادل"}
              </div>
            </div>

            <div className="w-10 h-10 rounded-full bg-[#F4C62F] text-black flex items-center justify-center">
              <CircleMinus size={24} />
            </div>
          </div>

          <div className="mt-12 flex items-center justify-end gap-3">
            <div className="w-9 h-9 rounded-full border border-emerald-500/40 bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-black">
              2
            </div>
            <div className="text-[22px] font-black flex items-center gap-2">
              نبض توقعات الجمهور
              <Crown size={24} className="text-[#F4C62F]" />
            </div>
          </div>

          <div className="mt-3 text-zinc-500 text-[14px]">
            من الأقرب للفوز حسب نبض المباراة؟
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <PulseOption
              title={awayName}
              percent={pulse.away}
              active={selectedPulse === "away"}
              onClick={() => setPulseChoice("away")}
            />
            <PulseOption
              title="تعادل"
              percent={pulse.draw}
              active={selectedPulse === "draw"}
              onClick={() => setPulseChoice("draw")}
            />
            <PulseOption
              title={homeName}
              percent={pulse.home}
              active={selectedPulse === "home"}
              onClick={() => setPulseChoice("home")}
            />
          </div>

          <div className="mt-5 h-[10px] rounded-full bg-white/5 overflow-hidden flex">
            <div
              style={{ width: `${pulse.home}%` }}
              className="h-full bg-emerald-500"
            />
            <div
              style={{ width: `${pulse.draw}%` }}
              className="h-full bg-[#D4AF37]"
            />
            <div
              style={{ width: `${pulse.away}%` }}
              className="h-full bg-red-500"
            />
          </div>

          <div className="mt-5 rounded-[20px] border border-white/10 bg-[#0B1527] px-5 py-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Users size={23} className="text-emerald-400" />
                <div>
                  <div className="text-[15px] font-black text-white">
                    {predictionCount.toLocaleString("ar-SA")} توقع
                  </div>
                  <div className="mt-1 text-[12px] text-zinc-500">
                    على هذه المباراة
                  </div>
                </div>
              </div>

              <div className="text-left">
                <div className="text-[22px] font-black text-[#F4C62F]">
                  {selectedPulsePercent}%
                </div>
                <div className="text-[11px] text-zinc-500">نبض اختيارك</div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex items-center justify-end gap-3">
            <div className="w-9 h-9 rounded-full border border-emerald-500/40 bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-black">
              3
            </div>
            <div className="text-[22px] font-black">ثبّت توقعك</div>
          </div>

          <div className="mt-6 rounded-[24px] border border-white/10 bg-[#0B1527] p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="w-12 h-12 rounded-[16px] bg-[#D4AF37]/10 flex items-center justify-center">
                <Target size={25} className="text-[#F4C62F]" />
              </div>

              <div className="flex-1">
                <div className="text-[14px] text-zinc-500">توقعك</div>
                <div className="mt-1 text-[19px] font-black text-white">
                  {homeName} {homeScore} - {awayScore} {awayName}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={savePrediction}
              disabled={savingPrediction}
              className={`mt-5 w-full h-[62px] rounded-[20px] text-black text-[20px] font-black flex items-center justify-center gap-3 active:scale-[0.98] transition ${
                savingPrediction
                  ? "bg-[#D4AF37]/60 cursor-wait"
                  : savedPrediction
                    ? "bg-emerald-400"
                    : "bg-[#D4AF37]"
              }`}
            >
              {savingPrediction ? (
                <>
                  <span className="w-5 h-5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                  جاري الحفظ...
                </>
              ) : (predictionSavedLocally || savedPrediction) ? (
                <>
                  <Check size={25} strokeWidth={3} />
                  تم حفظ توقعك
                </>
              ) : (
                <>
                  <Crown size={25} />
                  ثبّت توقعي
                </>
              )}
            </button>

            {savedMessage && (
              <div className="mt-4 text-center text-emerald-400 font-black">
                {savedMessage}
              </div>
            )}
          </div>

          {(predictionSavedLocally || savedPrediction) && (
            <div className="mt-6 space-y-3">
              <div className="rounded-[20px] border border-emerald-500/20 bg-emerald-500/[0.06] p-5 flex items-center gap-4">
                <TrendingUp size={27} className="text-emerald-400" />
                <div>
                  <div className="text-[17px] font-black">
                    أنت مع {pulse[winner]}% من المتوقعين
                  </div>
                  <div className="mt-1 text-[13px] text-zinc-500">
                    حسب نبض توقعات هذه المباراة
                  </div>
                </div>
              </div>

              <div className="rounded-[20px] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.05] p-5 flex items-center gap-4">
                <Flame size={27} className="text-[#F4C62F]" />
                <div>
                  <div className="text-[17px] font-black">
                    {samePredictionCount} متوقع اختاروا نفس نتيجتك
                  </div>
                  <div className="mt-1 text-[13px] text-zinc-500">
                    {homeScore} - {awayScore}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 text-center text-xs text-zinc-600">
            رقم المباراة: {fixtureId}
          </div>
        </div>
      </div>
    </div>
  );
}
