import { useState } from "react";

import worldcupLogo from "../../assets/competitions/worldcup.png";
import saudiLogo from "../../assets/competitions/saudi.png";
import eplLogo from "../../assets/competitions/epl.png";
import serieaLogo from "../../assets/competitions/seriea.png";
import bundesligaLogo from "../../assets/competitions/bundesliga.png";
import ligue1Logo from "../../assets/competitions/ligue1.png";
import uclLogo from "../../assets/competitions/ucl.png";


const competitions = [

  { id: "all", name: "جميع المباريات", matches: 104, matches: 104, icon: "🌍" },
  { id: "worldcup", name: "كأس العالم 2026", matches: 104, matches: 104, logo: worldcupLogo },
  { id: "saudi", name: "الدوري السعودي", matches: 306, matches: 306, logo: saudiLogo },
  { id: "epl", name: "الدوري الإنجليزي", matches: 380, matches: 380, logo: eplLogo },
  { id: "laliga", name: "الدوري الإسباني", matches: 380, matches: 380, icon: "🇪🇸" },
  { id: "seriea", name: "الدوري الإيطالي", matches: 380, matches: 380, logo: serieaLogo },
  { id: "bundesliga", name: "الدوري الألماني", matches: 306, matches: 306, logo: bundesligaLogo },
  { id: "ligue1", name: "الدوري الفرنسي", matches: 306, matches: 306, logo: ligue1Logo },
  { id: "ucl", name: "دوري أبطال أوروبا", matches: 189, matches: 189, logo: uclLogo },
  { id: "uel", name: "الدوري الأوروبي", matches: 189, matches: 189, icon: "🥈" },
];

export default function CompetitionTabs({ onChange }) {
  const [selected, setSelected] = useState("all");

  return (
    <div className="overflow-x-auto no-scrollbar py-2">
      <div className="flex gap-3 px-1 min-w-max">
        {competitions.map((item) => {
          const active = selected === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                setSelected(item.id);
                onChange?.(item.id);
              }}
              className={`flex items-center justify-between w-[230px] h-[80px] rounded-[22px] border transition-all duration-300 shrink-0
              ${
                active
                  ? "bg-gradient-to-b from-yellow-400 to-yellow-600 border-yellow-300 text-black shadow-[0_0_25px_rgba(255,215,0,.45)] scale-105"
                  : "bg-zinc-900 border-zinc-700 text-white hover:border-yellow-500"
              }`}
            >
              <div className="w-14 h-14 flex items-center justify-center overflow-hidden rounded-xl bg-white p-1 shrink-0">
                {item.logo ? (
                  <img
                    src={item.logo}
                    alt={item.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-4xl">{item.icon}</span>
                )}
              </div>

              <div className="flex-1 text-right px-4 text-[17px] font-extrabold leading-tight">
                {item.name}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
