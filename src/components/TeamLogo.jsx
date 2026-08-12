import React, { useEffect, useMemo, useState } from "react";

function buildLogoSources(team) {
  if (!team) return [];

  const code = String(
    team?.code ||
    team?.team_code ||
    ""
  ).trim();

  const storedLogo =
    team?.logo ||
    team?.team_logo ||
    "";

  const sources = [];

  // الشعار المحفوظ في بيانات الفريق
  if (storedLogo) {
    sources.push(storedLogo);
  }

  // Football-Data
  const fd = code.match(/^fd:(\d+)$/i);
  if (fd) {
    sources.push(
      `https://crests.football-data.org/${fd[1]}.png`
    );

    // fallback API-Football
    sources.push(
      `https://media.api-sports.io/football/teams/${fd[1]}.png`
    );
  }

  // API-Football
  const af = code.match(/^af:(\d+)$/i);
  if (af) {
    sources.push(
      `https://media.api-sports.io/football/teams/${af[1]}.png`
    );

    // fallback Football-Data
    sources.push(
      `https://crests.football-data.org/${af[1]}.png`
    );
  }

  // Highlightly / generic numeric provider
  const hl = code.match(/^hl:(\d+)$/i);
  if (hl) {
    sources.push(
      `https://media.api-sports.io/football/teams/${hl[1]}.png`
    );
  }

  // كود رقمي مباشر
  if (/^\d+$/.test(code)) {
    sources.push(
      `https://media.api-sports.io/football/teams/${code}.png`
    );

    sources.push(
      `https://crests.football-data.org/${code}.png`
    );
  }

  return [...new Set(sources.filter(Boolean))];
}

export default function TeamLogo({
  team,
  size = "w-8 h-8",
  className = "",
  alt = "",
}) {
  const sources = useMemo(
    () => buildLogoSources(team),
    [
      team?.code,
      team?.team_code,
      team?.logo,
      team?.team_logo,
    ]
  );

  const [sourceIndex, setSourceIndex] = useState(0);

  useEffect(() => {
    setSourceIndex(0);
  }, [sources.join("|")]);

  const name =
    alt ||
    team?.name_ar ||
    team?.name_en ||
    team?.name ||
    team?.code ||
    "الفريق";

  const logo = sources[sourceIndex];

  if (!logo) {
    return (
      <div
        aria-label={name}
        title={name}
        className={`${size} rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-gold font-black text-xs shrink-0 ${className}`}
      >
        {String(name).trim().charAt(0) || "؟"}
      </div>
    );
  }

  return (
    <img
      src={logo}
      alt={name}
      title={name}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => {
        setSourceIndex((current) => {
          if (current + 1 < sources.length) {
            return current + 1;
          }

          return current;
        });
      }}
      className={`${size} object-contain shrink-0 ${className}`}
    />
  );
}
