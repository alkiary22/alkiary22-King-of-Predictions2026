import { NavLink } from "react-router-dom";
import { Home, Calendar, Crown, Trophy, User } from "lucide-react";

const tabs = [
  { to: "/", label: "الرئيسية", icon: Home },
  { to: "/matches", label: "المباريات", icon: Calendar },
  { to: "/challenge", label: "التحدي", icon: Crown, center: true },
  { to: "/leaderboard", label: "المتصدرون", icon: Trophy },
  { to: "/profile", label: "حسابي", icon: User },
];

export default function AndroidBottomNav() {
  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999]
      w-[95%] max-w-md rounded-3xl
      bg-black/85 backdrop-blur-xl
      border border-yellow-500/30
      shadow-2xl shadow-yellow-500/10"
    >
      <div className="flex items-center justify-around h-20">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center transition-all duration-300 ${
                  tab.center
                    ? "-mt-8"
                    : ""
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={
                      tab.center
                        ? `w-16 h-16 rounded-full flex items-center justify-center
                           ${
                             isActive
                               ? "bg-yellow-400 text-black scale-110 shadow-xl"
                               : "bg-zinc-800 text-yellow-400"
                           }`
                        : `w-11 h-11 rounded-xl flex items-center justify-center
                           ${
                             isActive
                               ? "bg-yellow-500/20 text-yellow-400"
                               : "text-zinc-400"
                           }`
                    }
                  >
                    <Icon size={22} />
                  </div>

                  <span
                    className={`text-[11px] mt-1 ${
                      isActive ? "text-yellow-400" : "text-zinc-400"
                    }`}
                  >
                    {tab.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
