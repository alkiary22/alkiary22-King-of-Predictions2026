import { Crown, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import NotificationBell from "@/components/NotificationBell";
import { useAuth } from "@/context/AuthContext";
import { useTeams } from "@/context/TeamsContext";

export default function AndroidHeader() {
  const { user } = useAuth();
  const { teamsMap } = useTeams();

  return (
    <header className="sticky top-0 z-50 h-16 bg-[#0B0B0B]/90 backdrop-blur-xl border-b border-yellow-500/20">
      <div className="h-full px-4 flex items-center justify-between">

        <Link
          to="/"
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-yellow-400 flex items-center justify-center shadow-lg">
            <Crown className="w-6 h-6 text-black" />
          </div>

          <div>
            <div className="text-yellow-400 font-black leading-none">
              ملك
            </div>

            <div className="text-white text-xs">
              التوقعات
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-3">

          {user && (
            <NotificationBell teamsMap={teamsMap} />
          )}

          <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
            <Bell className="w-5 h-5 text-yellow-400" />
          </div>

        </div>
      </div>
    </header>
  );
}
