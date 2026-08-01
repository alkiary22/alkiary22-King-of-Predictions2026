import { useEffect, useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

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

function TeamScore({
  team,
  value,
  onChange,
}) {
  function decrease() {
    onChange(
      Math.max(0, Number(value) - 1)
    );
  }

  function increase() {
    onChange(
      Math.min(20, Number(value) + 1)
    );
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
        {team?.name_ar ||
          team?.name_en ||
          "الفريق"}
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

function PulseOption({
  title,
  percent,
  active,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        min-w-0
        rounded-[20px]
        border
        px-2
        py-4
        transition-all
        duration-300

        ${
          active
            ? `
              border-[#D4AF37]/70
              bg-[#D4AF37]/10
              shadow-[0_0_24px_rgba(212,175,55,0.10)]
            `
            : `
              border-white/10
              bg-[#0B1527]
            `
        }
      `}
    >
      <div
        className={`
          text-[13px]
          font-black
          truncate

          ${
            active
              ? "text-white"
              : "text-zinc-400"
          }
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

export default function CompetitionPrediction() {
  const navigate = useNavigate();
  const location = useLocation();
  const { fixtureId } = useParams();

  const match =
    location.state?.match || null;

  const competition =
    location.state?.competition || null;

  const storageKey =
    `competition_prediction_${fixtureId}`;

  const [homeScore, setHomeScore] =
    useState(0);

  const [awayScore, setAwayScore] =
    useState(0);

  const [savedPrediction, setSavedPrediction] =
    useState(null);

  const [pulseChoice, setPulseChoice] =
    useState(null);

  const [savedMessage, setSavedMessage] =
    useState("");

  useEffect(() => {
    window.scrollTo(0, 0);

    try {
      const saved =
        localStorage.getItem(storageKey);

      if (!saved) {
        return;
      }

      const parsed = JSON.parse(saved);

      setHomeScore(
        Number(parsed?.home_score) || 0
      );

      setAwayScore(
        Number(parsed?.away_score) || 0
      );

      setSavedPrediction(parsed);
    } catch (error) {
      console.error(
        "Load competition prediction error:",
        error
      );
    }
  }, [storageKey]);

  const winner = useMemo(() => {
    if (homeScore > awayScore) {
      return "home";
    }

    if (awayScore > homeScore) {
      return "away";
    }

    return "draw";
  }, [homeScore, awayScore]);

  const pulse = useMemo(() => {
    const fixtureNumber =
      Number(
        String(fixtureId || "")
          .replace(/\D/g, "")
          .slice(-6)
      ) || 1;

    let homePercent =
      40 + (fixtureNumber % 19);

    let drawPercent =
      15 + (fixtureNumber % 9);

    let awayPercent =
      100 -
      homePercent -
      drawPercent;

    if (awayPercent < 12) {
      awayPercent = 12;
      homePercent =
        100 -
        drawPercent -
        awayPercent;
    }

    return {
      home: homePercent,
      draw: drawPercent,
      away: awayPercent,
    };
  }, [fixtureId]);

  const predictionCount = useMemo(() => {
    const value =
      Number(
        String(fixtureId || "")
          .replace(/\D/g, "")
          .slice(-5)
      ) || 1;

    return 120 + (value % 1880);
  }, [fixtureId]);

  const samePredictionCount = useMemo(() => {
    if (!savedPrediction) {
      return 0;
    }

    const base =
      Number(homeScore) * 31 +
      Number(awayScore) * 17 +
      predictionCount;

    return 12 + (base % 240);
  }, [
    savedPrediction,
    homeScore,
    awayScore,
    predictionCount,
  ]);

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
          <div className="text-xl font-black">
            تعذر فتح المباراة
          </div>

          <div className="mt-3 text-zinc-500">
            ارجع إلى البطولة واختر المباراة من جديد
          </div>
        </div>
      </div>
    );
  }

  const home = match?.teams?.home;
  const away = match?.teams?.away;

  const homeName =
    home?.name_ar ||
    home?.name_en ||
    "صاحب الأرض";

  const awayName =
    away?.name_ar ||
    away?.name_en ||
    "الضيف";

  function savePrediction() {
    const prediction = {
      fixture_id: fixtureId,
      competition_id:
        competition?.id ||
        competition?.apiLeagueId ||
        null,
      home_score: Number(homeScore),
      away_score: Number(awayScore),
      winner,
      saved_at:
        new Date().toISOString(),
    };

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(prediction)
      );

      setSavedPrediction(prediction);

      setSavedMessage(
        "تم تثبيت توقعك بنجاح 👑"
      );

      window.setTimeout(() => {
        setSavedMessage("");
      }, 3000);
    } catch (error) {
      console.error(
        "Save competition prediction error:",
        error
      );

      setSavedMessage(
        "تعذر حفظ التوقع"
      );
    }
  }

  const selectedPulse =
    pulseChoice || winner;

  const selectedPulsePercent =
    pulse[selectedPulse] || 0;

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#020B1B] text-white pb-32"
    >
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
            {competition?.name_ar ||
              competition?.title ||
              "البطولة الكبرى"}
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

              <span className="text-[28px]">
                ⚽
              </span>
            </div>

            <div className="h-px flex-1 bg-emerald-500/20" />
          </div>

          <div className="mt-10 flex items-center justify-end gap-3">
            <div className="w-9 h-9 rounded-full border border-emerald-500/40 bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-black">
              1
            </div>

            <div className="text-[22px] font-black">
              النتيجة الدقيقة
            </div>
          </div>

          <div className="mt-8 grid grid-cols-[1fr_30px_1fr] items-center gap-3">
            <TeamScore
              team={home}
              value={homeScore}
              onChange={setHomeScore}
            />

            <div className="text-center text-zinc-600 text-[28px] font-black">
              -
            </div>

            <TeamScore
              team={away}
              value={awayScore}
              onChange={setAwayScore}
            />
          </div>

          <div className="mt-7 rounded-[20px] border border-[#D4AF37]/40 bg-[#D4AF37]/[0.08] px-5 py-5 flex items-center justify-between">
            <div className="w-10 h-10 rounded-full bg-[#F4C62F] text-black flex items-center justify-center">
              <Check
                size={22}
                strokeWidth={3}
              />
            </div>

            <div className="text-right">
              <div className="text-zinc-500 text-[14px]">
                الفائز
              </div>

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

              <Crown
                size={24}
                className="text-[#F4C62F]"
              />
            </div>
          </div>

          <div className="mt-3 text-zinc-500 text-[14px]">
            من الأقرب للفوز حسب نبض المباراة؟
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <PulseOption
              title={awayName}
              percent={pulse.away}
              active={
                selectedPulse === "away"
              }
              onClick={() =>
                setPulseChoice("away")
              }
            />

            <PulseOption
              title="تعادل"
              percent={pulse.draw}
              active={
                selectedPulse === "draw"
              }
              onClick={() =>
                setPulseChoice("draw")
              }
            />

            <PulseOption
              title={homeName}
              percent={pulse.home}
              active={
                selectedPulse === "home"
              }
              onClick={() =>
                setPulseChoice("home")
              }
            />
          </div>

          <div className="mt-5 h-[10px] rounded-full bg-white/5 overflow-hidden flex">
            <div
              style={{
                width: `${pulse.home}%`,
              }}
              className="h-full bg-emerald-500"
            />

            <div
              style={{
                width: `${pulse.draw}%`,
              }}
              className="h-full bg-[#D4AF37]"
            />

            <div
              style={{
                width: `${pulse.away}%`,
              }}
              className="h-full bg-red-500"
            />
          </div>

          <div className="mt-5 rounded-[20px] border border-white/10 bg-[#0B1527] px-5 py-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Users
                  size={23}
                  className="text-emerald-400"
                />

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

                <div className="text-[11px] text-zinc-500">
                  نبض اختيارك
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex items-center justify-end gap-3">
            <div className="w-9 h-9 rounded-full border border-emerald-500/40 bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-black">
              3
            </div>

            <div className="text-[22px] font-black">
              ثبّت توقعك
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-white/10 bg-[#0B1527] p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="w-12 h-12 rounded-[16px] bg-[#D4AF37]/10 flex items-center justify-center">
                <Target
                  size={25}
                  className="text-[#F4C62F]"
                />
              </div>

              <div className="flex-1">
                <div className="text-[14px] text-zinc-500">
                  توقعك
                </div>

                <div className="mt-1 text-[19px] font-black text-white">
                  {homeName}
                  {" "}
                  {homeScore}
                  {" - "}
                  {awayScore}
                  {" "}
                  {awayName}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={savePrediction}
              className="mt-5 w-full h-[62px] rounded-[20px] bg-[#D4AF37] text-black text-[20px] font-black flex items-center justify-center gap-3 active:scale-[0.98] transition"
            >
              <Crown size={25} />

              {savedPrediction
                ? "تحديث توقعي"
                : "ثبّت توقعي"}
            </button>

            {savedMessage && (
              <div className="mt-4 text-center text-emerald-400 font-black">
                {savedMessage}
              </div>
            )}
          </div>

          {savedPrediction && (
            <div className="mt-6 space-y-3">
              <div className="rounded-[20px] border border-emerald-500/20 bg-emerald-500/[0.06] p-5 flex items-center gap-4">
                <TrendingUp
                  size={27}
                  className="text-emerald-400"
                />

                <div>
                  <div className="text-[17px] font-black">
                    أنت مع {pulse[winner]}% من المتوقعين 👑
                  </div>

                  <div className="mt-1 text-[13px] text-zinc-500">
                    حسب نبض توقعات هذه المباراة
                  </div>
                </div>
              </div>

              <div className="rounded-[20px] border border-[#D4AF37]/20 bg-[#D4AF37]/[0.05] p-5 flex items-center gap-4">
                <Flame
                  size={27}
                  className="text-[#F4C62F]"
                />

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
