import { NavLink } from "react-router-dom";
import {
  House,
  CalendarDays,
  Crown,
  Trophy,
  Menu
} from "lucide-react";

const items = [
  {
    to: "/",
    title: "الرئيسية",
    icon: House,
  },
  {
    to: "/competitions",
    title: "البطولات",
    icon: Trophy,
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
    to: "/more",
    title: "المزيد",
    icon: Menu,
  },
];

export default function AndroidBottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">

      <div className="mx-3 mb-3 rounded-3xl border border-[#D4AF37]/15 bg-[#101010]/95 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,.45)]">

        <div className="grid grid-cols-5 items-center h-20">

          {items.map((item) => {

            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center transition-all ${
                    isActive
                      ? "text-[#D4AF37]"
                      : "text-zinc-500"
                  }`
                }
              >

                <div
                  className={
                    item.center
                      ? "w-14 h-14 rounded-full bg-[#D4AF37] flex items-center justify-center -mt-8 shadow-[0_10px_30px_rgba(212,175,55,.45)]"
                      : ""
                  }
                >
                  <Icon
                    size={item.center ? 28 : 23}
                    className={item.center ? "text-black" : ""}
                  />
                </div>

                <span className="text-[11px] mt-1 font-bold">
                  {item.title}
                </span>

              </NavLink>
            );

          })}

        </div>

      </div>

    </div>
  );
}
