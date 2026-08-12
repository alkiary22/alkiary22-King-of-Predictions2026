import { useEffect, useRef, useState, useMemo } from "react";
import { prefetch } from "@/lib/queryCache";
import api from "@/lib/api";

import CompetitionMatches from "./CompetitionMatches";
import CompetitionStandings from "./CompetitionStandings";
import CompetitionTeams from "./CompetitionTeams";
import CompetitionScorers from "./CompetitionScorers";

import {
  CalendarDays,
  BarChart3,
  Shield,
  Goal,
} from "lucide-react";

const FIXED_2026_LEAGUES = [1, 39, 140, 135, 78, 61];

const COMP_CACHE_KEY="competitions-cache-v1";


function getSeason(item) {
  const id = Number(item?.id);

  if (id === 2) {
    return 2025;
  }

  if (FIXED_2026_LEAGUES.includes(id)) {
    return 2026;
  }

  return (
    item?.effective_season ||
    item?.current_season ||
    item?.season ||
    2026
  );
}

function getSeasonLabel(item) {
  if (Number(item?.id) === 2) {
    return "2025/2026";
  }

  return String(getSeason(item));
}

const TABS = [
  {
    id: "matches",
    label: "الجدول",
    Icon: CalendarDays,
  },
  {
    id: "standings",
    label: "ترتيب الدوري",
    Icon: BarChart3,
  },
  {
    id: "teams",
    label: "الفرق",
    Icon: Shield,
  },
  {
    id: "scorers",
    label: "هدافون",
    Icon: Goal,
  },
];

export default function CompetitionGrid() {
  const scrollRef = useRef(null);

  const [competitions, setCompetitions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState("matches");

  const [mountedTabs, setMountedTabs] = useState({
    matches: true,
    standings: false,
    teams: false,
    scorers: false,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadCompetitions() {

      try {

        const cached=sessionStorage.getItem(COMP_CACHE_KEY);

        if(cached){

          try{

            const list=JSON.parse(cached);

            if(Array.isArray(list)&&list.length){

              setCompetitions(list);

              if(!selectedId){
                setSelectedId(list[0].id);
              }

              setLoading(false);

            }

          }catch{}

        }

        setError("");

        const { data } = await api.get("/competitions");

        if (!mounted) return;

        const list = (Array.isArray(data) ? data : []).map(
          (item) => ({
            ...item,
            id: String(item.id),
            apiLeagueId: Number(item.id),

            title:
              item.name_ar ||
              item.name_en,

            name_ar:
              item.name_ar ||
              item.name_en,

            name_en: item.name_en,

            season: getSeason(item),
            current_season: getSeason(item),
            effective_season: getSeason(item),

            seasonLabel: getSeasonLabel(item),

            image: item.logo,
            logo: item.logo,

            country:
              item.country_ar ||
              item.country ||
              "",
          })
        );

        sessionStorage.setItem(
          COMP_CACHE_KEY,
          JSON.stringify(list)
        );

        setCompetitions(list);

        if (list.length > 0 && !selectedId) {
          setSelectedId(list[0].id);
        }
      } catch (e) {
        if (!mounted) return;

        setError(
          e?.response?.data?.detail ||
          e?.message ||
          "تعذر تحميل البطولات"
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadCompetitions();

    return () => {
      mounted = false;
    };
  }, []);


  useEffect(() => {
    if (!selectedId) return;

    const competition = competitions.find(c => c.id === selectedId);
    if (!competition) return;

    const season =
      competition.effective_season ||
      competition.current_season ||
      competition.season ||
      2026;

    const id = competition.apiLeagueId || competition.id;

    // 🚀 تحميل مباريات الدوري مسبقًا
    prefetch(
      `matches:${id}:${season}`,
      async () => (
        await api.get(`/competitions/${id}/matches?season=${season}`)
      ).data
    );

    // 🚀 Prefetch للمباريات (أهم شيء)
    prefetch(
      `matches:${id}:${season}`,
      async () => (
        await api.get(`/competitions/${id}/matches?season=${season}`)
      ).data
    );

    prefetch(
      `standings:${id}:${season}`,
      async () => (
        await api.get(`/competitions/${id}/standings?season=${season}`)
      ).data
    );

    prefetch(
      `teams:${id}:${season}`,
      async () => (
        await api.get(`/competitions/${id}/teams?season=${season}`)
      ).data
    );

    prefetch(
      `scorers:${id}:${season}`,
      async () => (
        await api.get(`/competitions/${id}/scorers?season=${season}`)
      ).data
    );

  }, [selectedId, competitions]);


  useEffect(() => {
    if (!competitions.length) return;

    // 🚀 Prefetch مباريات كل الدوريات في الخلفية (تدريجياً)
    competitions.forEach((c, index) => {
      const season = c.effective_season || c.current_season || c.season || 2026;
      const id = c.apiLeagueId || c.id;

      // تأخير بسيط بين كل طلب لعدم إغراق السيرفر
      setTimeout(() => {
        prefetch(
          `matches:${id}:${season}`,
          async () => (await api.get(`/competitions/${id}/matches?season=${season}`)).data
        );
      }, index * 200);
    });

    // للدوري الأول فقط: حمّل كل التبويبات
    const c = competitions[0];
    const season = c.effective_season || c.current_season || c.season || 2026;
    const id = c.apiLeagueId || c.id;

    prefetch(`standings:${id}:${season}`, async () => (await api.get(`/competitions/${id}/standings?season=${season}`)).data);
    prefetch(`teams:${id}:${season}`, async () => (await api.get(`/competitions/${id}/teams?season=${season}`)).data);
    prefetch(`scorers:${id}:${season}`, async () => (await api.get(`/competitions/${id}/scorers?season=${season}`)).data);

  }, [competitions]);
  const selectedCompetition =
    competitions.find(
      (competition) =>
        competition.id === selectedId
    ) || competitions[0];

  function selectCompetition(competition, event) {
    setSelectedId(competition.id);
    setActiveTab("matches");

    event?.currentTarget?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }

  function renderContent() {
    if (!selectedCompetition) {
      return null;
    }

    return (
      <>
        {mountedTabs.matches && (
          <div style={{ display: activeTab === "matches" ? "block" : "none" }}>
            <CompetitionMatches competition={selectedCompetition} />
          </div>
        )}

        {mountedTabs.standings && (
          <div style={{ display: activeTab === "standings" ? "block" : "none" }}>
            <CompetitionStandings competition={selectedCompetition} />
          </div>
        )}

        {mountedTabs.teams && (
          <div style={{ display: activeTab === "teams" ? "block" : "none" }}>
            <CompetitionTeams competition={selectedCompetition} />
          </div>
        )}

        {mountedTabs.scorers && (
          <div style={{ display: activeTab === "scorers" ? "block" : "none" }}>
            <CompetitionScorers competition={selectedCompetition} />
          </div>
        )}
      </>
    );
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-zinc-400">
        جاري تحميل البطولات...
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

  if (competitions.length === 0) {
    return (
      <div className="py-16 text-center text-zinc-500">
        لا توجد بطولات متاحة
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="w-full"
    >
      <div
        ref={scrollRef}
        className="
          flex
          items-center
          gap-2.5
          overflow-x-auto
          overscroll-x-contain
          py-2
          scrollbar-hide
          [-webkit-overflow-scrolling:touch]
        "
      >
        {competitions.map((competition) => {
          const active =
            competition.id ===
            selectedCompetition?.id;

          return (
            <button
              key={competition.id}
              type="button"
              onClick={(event) =>
                selectCompetition(
                  competition,
                  event
                )
              }
              onMouseEnter={() => {
                const season =
                  competition.effective_season ||
                  competition.current_season ||
                  competition.season ||
                  2026;

                const id =
                  competition.apiLeagueId ||
                  competition.id;

                prefetch(
                  `matches:${id}:${season}`,
                  async () => (
                    await api.get(
                      `/competitions/${id}/matches?season=${season}`
                    )
                  ).data
                );
              }}
              onTouchStart={() => {
                const season =
                  competition.effective_season ||
                  competition.current_season ||
                  competition.season ||
                  2026;

                const id =
                  competition.apiLeagueId ||
                  competition.id;

                prefetch(
                  `matches:${id}:${season}`,
                  async () => (
                    await api.get(
                      `/competitions/${id}/matches?season=${season}`
                    )
                  ).data
                );
              }}
              className={`
                shrink-0
                h-[62px]
                min-w-[190px]
                max-w-[235px]
                rounded-[21px]
                border
                px-3
                flex
                items-center
                justify-center
                gap-3
                transition-all
                duration-300

                ${
                  active
                    ? `
                      border-[#E46C1A]
                      bg-gradient-to-l
                      from-[#57210D]
                      via-[#3B180D]
                      to-[#24120D]
                      shadow-[0_0_0_1px_rgba(228,108,26,0.18),0_0_25px_rgba(228,108,26,0.12)]
                    `
                    : `
                      border-[#263041]
                      bg-[#111824]
                    `
                }
              `}
            >
              <div
                className="
                  w-[46px]
                  h-[46px]
                  shrink-0
                  rounded-[14px]
                  bg-white
                  flex
                  items-center
                  justify-center
                  overflow-hidden
                "
              >
                <img
                  src={competition.image}
                  alt=""
                  className="
                    w-[36px]
                    h-[36px]
                    object-contain
                  "
                />
              </div>

              <span
                className={`
                  text-[16px]
                  sm:text-[17px]
                  font-black
                  whitespace-nowrap

                  ${
                    active
                      ? "text-white"
                      : "text-[#9AA4B8]"
                  }
                `}
              >
                {competition.title}
              </span>
            </button>
          );
        })}
      </div>

      {selectedCompetition && (
        <>
          <div className="mt-7">
            <div
              className="
                grid
                grid-cols-4
                gap-1.5
              "
            >
              {TABS.map((tab) => {
                const active =
                  activeTab === tab.id;

                const Icon = tab.Icon;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setMountedTabs((prev) => ({
                        ...prev,
                        [tab.id]: true,
                      }));
                      setActiveTab(tab.id);
                    }}
                    className={`
                      min-w-0
                      h-[58px]
                      rounded-full
                      border
                      flex
                      items-center
                      justify-center
                      gap-1
                      px-1
                      transition-all
                      duration-300

                      ${
                        active
                          ? `
                            border-[#3B8B70]
                            bg-gradient-to-b
                            from-[#28694F]
                            to-[#20553F]
                            text-white
                            shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_8px_22px_rgba(32,85,63,0.18)]
                          `
                          : `
                            border-[#153127]
                            bg-[#07100D]
                            text-[#69758B]
                          `
                      }
                    `}
                  >
                    <Icon
                      size={18}
                      strokeWidth={2.5}
                      className="shrink-0"
                    />

                    <span
                      className="
                        text-[10px]
                        min-[390px]:text-[11px]
                        sm:text-[13px]
                        font-black
                        whitespace-nowrap
                        leading-none
                      "
                    >
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5">
            {renderContent()}
          </div>
        </>
      )}
    </div>
  );
}
