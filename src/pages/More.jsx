import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Radio,
  Flag,
  Bell,
  Settings,
  ShieldCheck,
  LogOut
} from "lucide-react";

export default function More() {
  const { user, logout } = useAuth();

  const items = [
    { to: "/profile", title: "حسابي", icon: User },
    { to: "/user-predictions", title: "توقعات المستخدمين", icon: Radio },
    { to: "/teams", title: "المنتخبات", icon: Flag },
  ];

  return (
    <div className="min-h-screen bg-base text-white px-4 py-6 pb-28">

      <h1 className="text-3xl font-black text-gold mb-6">
        المزيد
      </h1>

      <div className="space-y-3">

        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#151515] p-4"
            >
              <Icon className="text-gold" size={22} />

              <span className="font-bold">
                {item.title}
              </span>
            </Link>
          );
        })}

        {(user?.role === "admin" || user?.role === "supervisor") && (

          <Link
            to="/admin"
            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#151515] p-4"
          >
            <ShieldCheck className="text-gold" size={22} />
            <span className="font-bold">
              لوحة الإدارة
            </span>
          </Link>

        )}

        <button
          onClick={logout}
          className="w-full flex items-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4"
        >
          <LogOut size={22} />

          <span className="font-bold">
            تسجيل الخروج
          </span>
        </button>

      </div>

    </div>
  );
}
