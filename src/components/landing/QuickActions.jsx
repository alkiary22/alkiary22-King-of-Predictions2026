import { Link } from "react-router-dom";
import { FEATURES } from "../../config/flags";
import {
  CalendarDays,
  Crown,
  Trophy,
  Radio
} from "lucide-react";

const actions = [
  {
    title: "المباريات",
    to: "/matches",
    icon: CalendarDays,
    color: "bg-blue-500/15 text-blue-400",
  },
  {
    title: "التحدي",
    to: "/challenge",
    icon: Crown,
    color: "bg-yellow-500/15 text-yellow-400",
  },
  {
    title: "المتصدرون",
    to: "/leaderboard",
    icon: Trophy,
    color: "bg-green-500/15 text-green-400",
  },
  {
    title: "التوقعات",
    to: "/user-predictions",
    icon: Radio,
    color: "bg-purple-500/15 text-purple-400",
  },
];


// 🔒 التحدي مغلق مؤقتاً
const __handleChallengeClick = (e) => {
  if (!FEATURES.challengeEnabled) {
    e.preventDefault();
    e.stopPropagation();
    alert("🔒 التحدي مغلق مؤقتاً");
    return false;
  }
  return true;
};

export default function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-4">

      {actions.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            key={item.to}
            to={item.to}
            className="rounded-3xl bg-[#161616] border border-white/5 p-5 active:scale-95 transition-all"
          >

            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.color}`}
            >
              <Icon size={28} />
            </div>

            <h3 className="mt-4 text-lg font-bold">
              {item.title}
            </h3>

          </Link>
        );
      })}

    </div>
  );
}
