import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import api from "@/lib/api";
import { cachedRequest, setCached } from "@/lib/queryCache";

import {
  CalendarDays,
  Radio,
  Clock3,
  CheckCircle2,
} from "lucide-react";

const LIVE_STATUS = new Set([
  "1H",
  "2H",
  "HT",
  "ET",
  "P",
  "LIVE",
  "BT",
]);

const FINISHED_STATUS = new Set([
  "FT",
  "AET",
  "PEN",
]);

function statusText(match) {
  const short = match?.status?.short;

  if (LIVE_STATUS.has(short)) {
    const elapsed =
      match?.status?.elapsed;

    return elapsed
      ? `مباشر ${elapsed}'`
      : "مباشر";
  }

  if (FINISHED_STATUS.has(short)) {
    return "انتهت";
  }

  if (short === "PST") {
    return "مؤجلة";
  }

  if (short === "CANC") {
    return "ملغاة";
  }

  if (short === "SUSP") {
    return "متوقفة";
  }

  return "لم تبدأ";
}

function matchType(match) {
  const short = match?.status?.short;

  if (LIVE_STATUS.has(short)) {
    return "live";
  }

  if (FINISHED_STATUS.has(short)) {
    return "finished";
  }

  return "upcoming";
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "ar-SA",
    {
      timeZone: "Asia/Riyadh",
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "numeric",
      minute: "2-digit",
    }
  ).format(new Date(value));
}

export default function CompetitionMatches({
  competition,
}) {
  const navigate = useNavigate();
  const [matches, setMatches] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [filter, setFilter] =
    useState("all");

  // الدوري السعودي: ابدأ تلقائيًا من الجولة الأولى
  const isSaudiLeague =
    String(competition?.id || competition?.apiLeagueId) === "307" ||
    String(competition?.title || competition?.name || "")
      .includes("السعودي");

  const [selectedRound, setSelectedRound] =
    useState("1");

  const competitionId =
    competition?.id ||
    competition?.apiLeagueId;

  const competitionSeason =
    competition?.effective_season ||
    competition?.current_season ||
    competition?.season ||
    2026;

  useEffect(() => {
    if (!competitionId) {
      return;
    }

    let active = true;

    setFilter("all");

    // عند فتح الدوري السعودي نبدأ دائمًا من الجولة الأولى
    if (String(competitionId) === "307") {
      setSelectedRound("1");
    }

    async function load(silent = false) {
      if (!silent) {
        setLoading(true);
        setError("");
      }

      const cacheKey = `matches:${competitionId}:${competitionSeason}`;

      try {

        let data;

        if (silent) {
          const res = await api.get(
            `/competitions/${competitionId}/matches?season=${competitionSeason}`,
            { params: { _live: Date.now() } }
          );

          data = Array.isArray(res.data) ? res.data : [];
          setCached(cacheKey, data);

        } else {

          data = await cachedRequest(
            cacheKey,
            async () => {
              const res = await api.get(
                `/competitions/${competitionId}/matches?season=${competitionSeason}`
              );

              return Array.isArray(res.data)
                ? res.data
                : [];
            }
          );

        }

        if (active) {
          setMatches(data);
          setError("");
        }
      } catch (e) {
        console.error(
          "Competition matches error:",
          e
        );

        if (active && !silent) {
          setError(
            e?.response?.data?.detail ||
            "تعذر تحميل مباريات البطولة"
          );
        }
      } finally {
        if (active && !silent) {
          setLoading(false);
        }
      }
    }

    load();

    const liveRefreshTimer = setInterval(() => {
      load(true);
    }, 15000);

    return () => {
      active = false;
      clearInterval(liveRefreshTimer);
    };
  }, [
    competitionId,
    competitionSeason,
  ]);

  const counts = useMemo(() => {
    const result = {
      all: matches.length,
      live: 0,
      upcoming: 0,
      finished: 0,
    };

    matches.forEach((match) => {
      const type = matchType(match);

      result[type] += 1;
    });

    return result;
  }, [matches]);

  // استخراج رقم الجولة من بيانات API-Football
  const getRoundNumber = (match) => {
    const value =
      match?.league?.round ||
      match?.league?.round_en ||
      match?.league?.round_ar ||
      "";

    const text = String(value);

    // أمثلة:
    // Regular Season - 1
    // Regular Season - 16
    // الجولة 1
    const matchNumber = text.match(/(\d+)/);

    return matchNumber ? String(Number(matchNumber[1])) : "";
  };

  // جميع الجولات الموجودة فعليًا في البيانات
  const rounds = useMemo(() => {
    if (!isSaudiLeague) return [];

    const nums = matches
      .map(getRoundNumber)
      .filter(Boolean)
      .map(Number);

    return [...new Set(nums)].sort((a, b) => a - b);
  }, [matches, isSaudiLeague]);

  const filteredMatches = useMemo(() => {
    let list = matches;

    // الدوري السعودي يبدأ من الجولة المحددة
    if (isSaudiLeague && selectedRound !== "all") {
      list = list.filter(
        (match) =>
          getRoundNumber(match) === String(selectedRound)
      );
    }

    if (filter === "all") {
      return list;
    }

    return list.filter(
      (match) =>
        matchType(match) === filter
    );
  }, [
    matches,
    filter,
    isSaudiLeague,
    selectedRound,
  ]);

  const filters = [
    {
      id: "all",
      title: "الكل",
      Icon: CalendarDays,
    },
    {
      id: "live",
      title: "مباشر",
      Icon: Radio,
    },
    {
      id: "upcoming",
      title: "القادمة",
      Icon: Clock3,
    },
    {
      id: "finished",
      title: "المنتهية",
      Icon: CheckCircle2,
    },
  ];

  if (loading) {
    return (
      <div className="py-12 text-center text-zinc-400">
        جاري تحميل المباريات...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-center text-red-300">
        {error}
      </div>
    );
  }

  return (
    <div>
      {isSaudiLeague && rounds.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-white font-black text-lg">
              جولات الدوري السعودي
            </h3>

            <span className="text-xs text-zinc-500">
              الجولة الحالية: {selectedRound === "all" ? "الكل" : selectedRound}
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {rounds.map((round) => {
              const active =
                String(selectedRound) === String(round);

              return (
                <button
                  key={round}
                  type="button"
                  onClick={() => {
                    setSelectedRound(String(round));
                    setFilter("all");
                  }}
                  className={`
                    shrink-0
                    px-4
                    py-3
                    rounded-xl
                    border
                    font-black
                    text-sm
                    transition-all
                    ${
                      active
                        ? "bg-[#DDBA35] text-black border-[#D4AF37] shadow-[0_6px_20px_rgba(212,175,55,.18)]"
                        : "bg-[#151515] text-zinc-300 border-white/10"
                    }
                  `}
                >
                  الجولة {round}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div
        className="
          grid
          grid-cols-4
          gap-2.5
          mb-6
        "
      >
        {filters.map((item) => {
          const Icon = item.Icon;

          const active =
            filter === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                setFilter(item.id)
              }
              className={`
                min-w-0
                h-[92px]
                rounded-[22px]
                border
                flex
                flex-col
                items-center
                justify-center
                transition-all
                duration-300

                ${
                  active
                    ? `
                      border-[#D4AF37]
                      bg-[#DDBA35]
                      text-black
                      shadow-[0_8px_24px_rgba(212,175,55,0.16)]
                    `
                    : `
                      border-white/10
                      bg-[#151515]
                      text-zinc-200
                    `
                }
              `}
            >
              <Icon
                size={22}
                strokeWidth={2.4}
              />

              <div
                className="
                  text-[13px]
                  sm:text-[15px]
                  font-black
                  mt-2
                  whitespace-nowrap
                "
              >
                {item.title}
              </div>

              <div
                className="
                  text-[11px]
                  mt-1
                  opacity-60
                "
              >
                {counts[item.id]}
              </div>
            </button>
          );
        })}
      </div>

      {filteredMatches.length === 0 ? (
        <div className="py-16 text-center text-zinc-500">
          لا توجد مباريات في هذا القسم
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMatches.map((match) => {
            const type =
              matchType(match);

            const isLive =
              type === "live";

            const isFinished =
              type === "finished";

            return (
              <div
                key={match.fixture_id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  navigate(
                    `/competition-match/${match.fixture_id}`,
                    {
                      state: {
                        match,
                        competition,
                        match_id: match.match_id || match.id || null,
                      },
                    }
                  );
                }}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" ||
                    event.key === " "
                  ) {
                    event.preventDefault();

                    navigate(
                      `/competition-match/${match.fixture_id}`,
                      {
                        state: {
                          match,
                          competition,
                        },
                      }
                    );
                  }
                }}
                className={`
                  rounded-[28px]
                  border
                  bg-[#151515]
                  px-5
                  py-5
                  transition-all
                  cursor-pointer
                  active:scale-[0.98]

                  ${
                    isLive
                      ? "border-red-500/50"
                      : "border-white/10"
                  }
                `}
              >
                <div
                  className="
                    flex
                    items-center
                    justify-between
                    gap-3
                    mb-7
                  "
                >
                  <span
                    className="
                      text-[#D4AF37]
                      text-[13px]
                      font-black
                    "
                  >
                    {match?.league?.round_ar ||
                      match?.league?.round_en ||
                      ""}
                  </span>

                  <div
                    className="
                      flex
                      items-center
                      gap-2
                      text-zinc-400
                      text-[12px]
                    "
                  >
                    <CalendarDays
                      size={17}
                    />

                    <span>
                      {formatDate(
                        match.kickoff_utc
                      )}
                    </span>
                  </div>
                </div>

                <div
                  className="
                    grid
                    grid-cols-[1fr_82px_1fr]
                    items-center
                    gap-2
                  "
                >
                  <div
                    className="
                      text-center
                      min-w-0
                    "
                  >
                    <img
                      src={
                        match?.teams?.home
                          ?.logo
                      }
                      alt=""
                      className="
                        w-[62px]
                        h-[62px]
                        mx-auto
                        object-contain
                      "
                    />

                    <div
                      className="
                        mt-3
                        font-black
                        text-[14px]
                        leading-5
                      "
                    >
                      {match?.teams?.home
                        ?.name_ar ||
                        match?.teams?.home
                          ?.name_en}
                    </div>
                  </div>

                  <div className="text-center">
                    {isLive ||
                    isFinished ? (
                      <div
                        className="
                          text-[34px]
                          leading-none
                          font-black
                          text-[#D4AF37]
                          whitespace-nowrap
                        "
                      >
                        {match?.goals?.home ??
                          0}

                        <span
                          className="
                            mx-2
                            text-zinc-600
                          "
                        >
                          :
                        </span>

                        {match?.goals?.away ??
                          0}
                      </div>
                    ) : (
                      <div
                        className="
                          text-[20px]
                          font-black
                          text-[#D4AF37]
                        "
                      >
                        VS
                      </div>
                    )}

                    <div
                      className={`
                        text-[13px]
                        mt-3
                        font-bold

                        ${
                          isLive
                            ? "text-red-400"
                            : "text-zinc-500"
                        }
                      `}
                    >
                      {statusText(match)}
                    </div>
                  </div>

                  <div
                    className="
                      text-center
                      min-w-0
                    "
                  >
                    <img
                      src={
                        match?.teams?.away
                          ?.logo
                      }
                      alt=""
                      className="
                        w-[62px]
                        h-[62px]
                        mx-auto
                        object-contain
                      "
                    />

                    <div
                      className="
                        mt-3
                        font-black
                        text-[14px]
                        leading-5
                      "
                    >
                      {match?.teams?.away
                        ?.name_ar ||
                        match?.teams?.away
                          ?.name_en}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
