import { NavLink } from "react-router-dom";
import { Home, CalendarDays, Trophy, User, Crown } from "lucide-react";
import { prefetchData } from "../hooks/usePrefetch";

const items = [
  {
    to: "/",
    title: "الرئيسية",
    icon: Home,
  },
  {
    to: "/matches",
    title: "المباريات",
    icon: CalendarDays,
  },
  {
    to: "/challenge",
    title: "التحدي",
    icon: Crown,
    center: true,
  },
  {
    to: "/leaderboard",
    title: "المتصدرون",
    icon: Trophy,
  },
  {
    to: "/profile",
    title: "حسابي",
    icon: User,
  },
];


// 🚀 Prefetch عند لمس/تمرير على الرابط
const __prefetchOnHover = (path) => {
  const map = {
    "/": "/matches",
    "/matches": "/matches",
    "/leaderboard": "/leaderboard?period=weekly",
    "/leaders": "/leaderboard?period=weekly",
    "/competitions": "/competitions",
    "/tournaments": "/competitions",
  };
  const endpoint = map[path];
  if (endpoint) prefetchData(endpoint);
};

export default function AndroidBottomNav() {
  return (
    <div
      className="
      fixed
      bottom-4
      left-1/2
      -translate-x-1/2
      w-[95%]
      max-w-md
      h-20
      rounded-3xl
      bg-black/90
      backdrop-blur-xl
      border
      border-yellow-500/20
      shadow-2xl
      shadow-yellow-500/20
      z-[9999]
      flex
      items-center
      justify-around
    "
    >
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center transition-all ${
                item.center ? "-mt-8" : ""
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={
                    item.center
                      ? `
                        w-16
                        h-16
                        rounded-full
                        flex
                        items-center
                        justify-center
                        bg-yellow-400
                        text-black
                        shadow-xl
                        border-4
                        border-[#111]
                        ${isActive ? "scale-110" : ""}
                      `
                      : `
                        w-11
                        h-11
                        rounded-xl
                        flex
                        items-center
                        justify-center
                        ${
                          isActive
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "text-zinc-400"
                        }
                      `
                  }
                >
                  <Icon size={22} />
                </div>

                <span
                  className={`text-[11px] mt-1 ${
                    isActive
                      ? "text-yellow-400 font-bold"
                      : "text-zinc-400"
                  }`}
                >
                  {item.title}
                </span>
              </>
            )}
          </NavLink>
        );
      })}
    </div>
  );
}
