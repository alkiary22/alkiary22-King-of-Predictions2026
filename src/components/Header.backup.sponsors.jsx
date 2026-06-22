import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTeams } from "../context/TeamsContext";
import { useContent } from "../context/ContentContext";
import { Crown, Trophy, Calendar, Flag, User, LogOut, ShieldCheck, Menu, X, Radio } from "lucide-react";
import { useState } from "react";
import NotificationBell from "./NotificationBell";
import Avatar from "./Avatar";

export default function Header() {
  const { user, logout } = useAuth();
  const { teamsMap } = useTeams();
  const { t } = useContent();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const links = [
    { to: "/matches", label: "المباريات", icon: Calendar },
    { to: "/live", label: "البث الحي", icon: Radio },
    { to: "/teams", label: "المنتخبات", icon: Flag },
    { to: "/leaderboard", label: "المتصدرين", icon: Trophy },
  ];
  if (user) links.push({ to: "/profile", label: "حسابي", icon: User });
  if (user?.role === "admin" || user?.role === "supervisor") links.push({ to: "/admin", label: "لوحة الإدارة", icon: ShieldCheck });

  return (
    <header
      data-testid="app-header"
      className="sticky top-0 z-50 backdrop-blur-xl bg-[#0A0A0A]/80 border-b border-white/10"
    >
      <nav className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link to="/" data-testid="logo-link" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-gold flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.35)] group-hover:scale-105 transition-transform">
            <Crown className="w-5 h-5 text-black" strokeWidth={2.5} />
          </div>
          <div className="font-display font-black text-lg leading-none">
            <span className="text-gold">{t("brand_name_prefix")}</span>
            <span className="text-white"> {t("brand_name_suffix")}</span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-testid={`nav-${l.to.replace("/", "")}`}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-white/5 text-gold" : "text-zinc-300 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <l.icon className="w-4 h-4" />
              <span>{l.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <NotificationBell teamsMap={teamsMap} />
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <Avatar src={user.avatar} name={user.name} size={28} />
                <span className="text-sm font-semibold">{user.name}</span>
                <span className="text-xs text-gold font-bold" data-testid="header-points">
                  {user.total_points} نقطة
                </span>
              </div>
              <button
                data-testid="logout-button"
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
                خروج
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                data-testid="header-login-link"
                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white transition-colors"
              >
                تسجيل الدخول
              </Link>
              <Link
                to="/register"
                data-testid="header-register-link"
                className="px-5 py-2 rounded-lg text-sm font-bold bg-gold text-black hover:bg-yellow-400 active:scale-95 transition-all"
              >
                إنشاء حساب
              </Link>
            </>
          )}
        </div>

        <div className="md:hidden flex items-center gap-1">
          {user && <NotificationBell teamsMap={teamsMap} />}
          <button
            data-testid="mobile-menu-toggle"
            className="p-2 rounded-lg hover:bg-white/5"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="md:hidden border-t border-white/10 bg-[#0A0A0A] px-4 py-4 flex flex-col gap-2">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              data-testid={`mobile-nav-${l.to.replace("/", "")}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                  isActive ? "bg-white/5 text-gold" : "text-zinc-300"
                }`
              }
            >
              <l.icon className="w-4 h-4" />
              {l.label}
            </NavLink>
          ))}
          {user ? (
            <button
              onClick={handleLogout}
              data-testid="mobile-logout"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-zinc-300"
            >
              <LogOut className="w-4 h-4" /> تسجيل الخروج
            </button>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link to="/login" onClick={() => setOpen(false)} className="flex-1 text-center px-4 py-3 rounded-lg border border-white/10">
                دخول
              </Link>
              <Link to="/register" onClick={() => setOpen(false)} className="flex-1 text-center px-4 py-3 rounded-lg bg-gold text-black font-bold">
                إنشاء حساب
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
