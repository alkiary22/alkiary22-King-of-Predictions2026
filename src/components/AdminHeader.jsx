import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, Images, LogOut } from "lucide-react";

export default function AdminHeader() {
  const location = useLocation();
  const navigate = useNavigate();

  const active = (path) =>
    location.pathname === path
      ? "bg-gold text-black"
      : "bg-white/5 text-white hover:bg-white/10";

  function logout() {
    localStorage.removeItem("mt_token");
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold text-black flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-black text-lg">إدارة ملك التوقعات</div>
            <div className="text-[11px] text-zinc-400">لوحة تحكم مستقلة</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin" className={`px-3 py-2 rounded-xl text-sm font-bold ${active("/admin")}`}>
            الإدارة
          </Link>

          <Link to="/admin/ads" className={`px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-1 ${active("/admin/ads")}`}>
            <Images className="w-4 h-4" />
            السلايدر
          </Link>

          <button
            onClick={logout}
            className="px-3 py-2 rounded-xl text-sm font-bold bg-red-500/10 text-red-400"
          >
            <LogOut className="w-4 h-4 inline-block ml-1" />
            خروج
          </button>
        </div>
      </div>
    </header>
  );
}
