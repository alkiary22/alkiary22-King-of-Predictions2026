import React from "react";
import { Home, Trophy, Target, Menu } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const AndroidBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    {
      to: "/",
      title: "الرئيسية",
      icon: Home,
    },
    {
      to: "/competitions",
      title: "البطولات",
      icon: Trophy,
    },
    {
      to: "/matches",
      title: "توقع الآن",
      icon: Target,
      center: true,
    },
    {
      to: "/leaderboard",
      title: "المتصدرون",
      icon: Trophy,
    },
    {
      to: "/more",
      title: "المزيد",
      icon: Menu,
    },
  ];

  return (
    <nav
      dir="rtl"
      className="
        fixed bottom-5 left-1/2 -translate-x-1/2
        z-[100]
        w-[calc(100%-32px)]
        max-w-[650px]
        rounded-[32px]
        border border-yellow-400/20
        bg-black/90
        backdrop-blur-xl
        shadow-[0_10px_40px_rgba(0,0,0,0.55)]
        px-2 py-3
      "
    >
      <div className="flex items-center justify-between">
        {items.map((item) => {
          const Icon = item.icon;

          const active =
            item.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.to);

          if (item.center) {
            return (
              <button
                key={item.to}
                type="button"
                onClick={() => navigate("/matches")}
                className="
                  relative flex flex-1 min-w-0
                  flex-col items-center justify-center
                  -mt-8 focus:outline-none
                "
              >
                <span
                  className="
                    flex h-[68px] w-[68px]
                    items-center justify-center
                    rounded-full
                    border border-yellow-300/50
                    bg-yellow-400
                    text-black
                    shadow-[0_0_28px_rgba(250,204,21,0.35)]
                  "
                >
                  <Icon size={31} strokeWidth={2.5} />
                </span>

                <span
                  className="
                    mt-1 text-[12px] font-black
                    text-yellow-400 whitespace-nowrap
                  "
                >
                  توقع الآن
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.to}
              type="button"
              onClick={() => navigate(item.to)}
              className="
                flex flex-1 min-w-0
                flex-col items-center justify-center
                gap-1 py-1
                focus:outline-none
              "
            >
              <Icon
                size={25}
                strokeWidth={active ? 2.5 : 2}
                className={
                  active
                    ? "text-yellow-400"
                    : "text-zinc-400"
                }
              />

              <span
                className={
                  active
                    ? "text-[11px] font-black text-yellow-400 whitespace-nowrap"
                    : "text-[11px] font-bold text-zinc-400 whitespace-nowrap"
                }
              >
                {item.title}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default AndroidBottomNav;
