import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Radio,
  Trophy,
  Clock,
  ChevronLeft,
  Flame,
  CheckCircle2
} from "lucide-react";

import api from "../../lib/api";
import Countdown from "../Countdown";

const COMPETITION_NAMES = {
  worldcup: "كأس العالم 2026",
  world_cup: "كأس العالم 2026",
  laliga: "الدوري الإسباني",
  epl: "الدوري الإنجليزي",
  saudi: "الدوري السعودي",
  seriea: "الدوري الإيطالي",
  bundesliga: "الدوري الألماني",
  ligue1: "الدوري الفرنسي",
  ucl: "دوري أبطال أوروبا",
  uel: "الدوري الأوروبي",
};

function getTeamLogo(team) {
  const code = String(team?.code || "").trim();

  // API-Football: af:529 => API-Sports official team logo.
  const apiFootball = code.match(/^af:(\d+)$/i);
  if (apiFootball) {
    return `https://media.api-sports.io/football/teams/${apiFootball[1]}.png`;
  }

  // Use stored logo first for other sources.
  if (team?.logo) {
    return team.logo;
  }

  // Football-Data fallback: fd:57 => crest.
  const footballData = code.match(/^fd:(\d+)$/i);
  if (footballData) {
    return `https://crests.football-data.org/${footballData[1]}.png`;
  }

  return "";
}

function formatKickoff(iso) {
  try {
    const date = new Date(iso);

    const day = date.toLocaleDateString("ar-EG-u-nu-latn", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "Asia/Riyadh",
    });

    const time = date.toLocaleTimeString("ar-EG-u-nu-latn", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Riyadh",
    });

    return `${day} · ${time} مكة`;
  } catch {
    return "";
  }
}

function competitionLabel(match) {
  return (
    match?.competition_name ||
    match?.league_name_ar ||
    match?.league_name ||
    COMPETITION_NAMES[match?.competition] ||
    match?.competition ||
    "مباراة قادمة"
  );
}

function TeamSide({ team }) {
  const logo = getTeamLogo(team);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [logo]);

  const teamName =
    team?.name_ar ||
    team?.name_en ||
    team?.name ||
    team?.code ||
    "بانتظار الفريق";

  return (
    <div className="home-team-side">
      <div className="home-team-logo-wrap">
        {logo && !imageError ? (
          <img
            src={logo}
            alt={teamName}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="home-team-logo"
          />
        ) : (
          <div className="home-team-logo-fallback">
            {String(teamName).trim().charAt(0) || "؟"}
          </div>
        )}
      </div>

      <div className="home-team-name">{teamName}</div>
    </div>
  );
}

export default function HomeDashboard() {
  const [matches, setMatches] = useState([]);
  const [teamsMap, setTeamsMap] = useState({});

  useEffect(() => {
    let mounted = true;

    Promise.all([api.get("/teams"), api.get("/matches")])
      .then(([teamsRes, matchesRes]) => {
        if (!mounted) return;

        const map = {};
        const teams = Array.isArray(teamsRes.data) ? teamsRes.data : [];

        teams.forEach((team) => {
          if (team?.code) map[team.code] = team;
        });

        const matchList = Array.isArray(matchesRes.data) ? matchesRes.data : [];

        setTeamsMap(map);
        setMatches(
          [...matchList].sort(
            (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
          )
        );
      })
      .catch((error) => {
        console.warn("Failed to load home dashboard:", error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const nextMatch = useMemo(() => {
    const now = Date.now();

    return matches.find((match) => {
      const kickoff = new Date(match.kickoff).getTime();
      return Number.isFinite(kickoff) && kickoff > now && match.status !== "finished";
    });
  }, [matches]);

  const home = nextMatch
    ? teamsMap[nextMatch.home_team] || {
        code: nextMatch.home_team,
        name_ar: nextMatch.home_team_name,
      }
    : null;

  const away = nextMatch
    ? teamsMap[nextMatch.away_team] || {
        code: nextMatch.away_team,
        name_ar: nextMatch.away_team_name,
      }
    : null;

  const isLive = nextMatch?.status === "live";
  const isFinished = nextMatch?.status === "finished";

  return (
    <section className="home-dashboard" aria-label="لوحة المباراة القادمة">
      <article className="home-next-match">
        <div className="home-match-topline">
          <div className="home-match-title">
            <span className="home-match-title-icon">⚽</span>
            <div>
              <p>استعد للتوقع</p>
              <h2>المباراة القادمة</h2>
            </div>
          </div>

          {nextMatch ? (
            isFinished ? (
              <span className="home-match-state is-finished">
                <CheckCircle2 className="w-4 h-4" />
                انتهت
              </span>
            ) : isLive ? (
              <span className="home-match-state is-live">
                <span className="home-live-dot" />
                مباشر
              </span>
            ) : (
              <div className="home-match-countdown">
                <Countdown kickoff={nextMatch.kickoff} />
              </div>
            )
          ) : null}
        </div>

        {nextMatch ? (
          <>
            <div className="home-match-teams">
              <TeamSide team={home} />

              <div className="home-match-center">
                {isFinished || isLive ? (
                  <div className="home-match-score">
                    {nextMatch.home_score} - {nextMatch.away_score}
                  </div>
                ) : (
                  <div className="home-versus">VS</div>
                )}

                <div className="home-competition-pill">
                  {competitionLabel(nextMatch)}
                </div>
              </div>

              <TeamSide team={away} />
            </div>

            <div className="home-match-details">
              <Clock className="w-4 h-4" />
              <span>{formatKickoff(nextMatch.kickoff)}</span>
            </div>

            <Link
              to={`/matches#match-${nextMatch.id}`}
              className="home-predict-button"
            >
              <Flame className="w-5 h-5" />
              <span>{isFinished ? "عرض تفاصيل المباراة" : "توقع الآن"}</span>
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </>
        ) : (
          <div className="home-no-match">
            <CalendarDays className="w-8 h-8 text-gold" />
            <strong>لا توجد مباريات قادمة حاليًا</strong>
            <span>تابع صفحة المباريات لمعرفة الجدول الجديد.</span>
          </div>
        )}
      </article>

      <div className="home-quick-grid">
        <Link to="/matches" className="home-quick-action">
          <span className="home-quick-icon">
            <CalendarDays className="w-5 h-5" />
          </span>
          <span>
            <strong>المباريات</strong>
            <small>توقعاتك القادمة</small>
          </span>
        </Link>

        <Link to="/user-predictions" className="home-quick-action">
          <span className="home-quick-icon">
            <Radio className="w-5 h-5" />
          </span>
          <span>
            <strong>توقعاتي</strong>
            <small>نتائجك ونقاطك</small>
          </span>
        </Link>
      </div>

      <Link to="/leaderboard" className="home-leaderboard-link">
        <span className="home-leaderboard-icon">
          <Trophy className="w-5 h-5" />
        </span>
        <span>
          <strong>لوحة المتصدرين</strong>
          <small>اكتشف ترتيبك بين المنافسين</small>
        </span>
        <ChevronLeft className="w-5 h-5" />
      </Link>
    </section>
  );
}
