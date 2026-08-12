import { useEffect, useState, useRef, useCallback } from "react";
import { Bell, X, CheckCheck, Trophy, Frown, Clock } from "lucide-react";
import api from "../lib/api";
import Flag from "./Flag";
import TeamLogo from "./TeamLogo";

function timeAgo(iso) {
  try {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return "الآن";
    if (diff < 3600) return `قبل ${Math.floor(diff / 60)} د`;
    if (diff < 86400) return `قبل ${Math.floor(diff / 3600)} س`;
    return `قبل ${Math.floor(diff / 86400)} ي`;
  } catch {
    return "";
  }
}

export default function NotificationBell({ teamsMap }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/notifications/me?limit=20");
      setItems(data.items || []);
      setUnread(data.unread || 0);
    } catch (e) {
      // silent
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60000); // refresh every minute
    return () => clearInterval(id);
  }, [load]);

  // Close on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (open && ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const markAllRead = async () => {
    try {
      await api.post("/notifications/read-all");
      setUnread(0);
      setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    } catch (e) {
      /* silent */
    }
  };

  const handleOpen = () => {
    setOpen(!open);
    if (!open && unread > 0) {
      // mark all on open after small delay (so user can see badge)
      setTimeout(markAllRead, 1200);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        data-testid="notifications-button"
        className="relative p-2 rounded-lg hover:bg-white/5 text-zinc-300 hover:text-white transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span
            data-testid="notifications-unread-badge"
            className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          data-testid="notifications-dropdown"
          className="absolute left-0 top-12 w-80 sm:w-96 max-h-[70vh] glass-card rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden flex flex-col"
        >
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gold" />
              <h3 className="font-bold">الإشعارات</h3>
            </div>
            <div className="flex items-center gap-1">
              {items.some((i) => !i.read) && (
                <button
                  onClick={markAllRead}
                  data-testid="mark-all-read"
                  title="تحديد الكل كمقروء"
                  className="p-1.5 rounded-md hover:bg-white/5 text-zinc-400 hover:text-white"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-md hover:bg-white/5 text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {items.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-500">
                لا توجد إشعارات بعد
              </div>
            ) : (
              items.map((n) => <NotificationItem key={n.id} item={n} teamsMap={teamsMap} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({ item, teamsMap = {} }) {
  const p = item.payload || {};
  const home = teamsMap[p.home_team];
  const away = teamsMap[p.away_team];

  if (item.type === "match_start_reminder") {
    return (
      <div
        data-testid={`notification-item-${item.id}`}
        className={`p-4 border-b border-white/5 last:border-0 ${
          !item.read ? "bg-gold/5" : ""
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-gold/15 text-gold">
            <Clock className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-black mb-1">
              اقتربت المباراة ⏰
            </p>

            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
              {home && <TeamLogo team={home} size="w-7 h-7" />}
              <span>{home?.name_ar || p.home_team}</span>
              <span className="text-gold font-black">ضد</span>
              <span>{away?.name_ar || p.away_team}</span>
              {away && <TeamLogo team={away} size="w-7 h-7" />}
            </div>

            <p className="text-xs text-zinc-500">
              تبقّى {p.minutes_before || 15} دقيقة على بداية المباراة، لا تنسَ توقعك.
              <span className="mx-2">•</span>
              {timeAgo(item.created_at)}
            </p>
          </div>

          {!item.read && <span className="w-2 h-2 rounded-full bg-gold shrink-0 mt-2" />}
        </div>
      </div>
    );
  }

  const points = typeof p.points === "number" ? p.points : 0;
  const isWin = points > 0;

  return (
    <div
      data-testid={`notification-item-${item.id}`}
      className={`p-4 border-b border-white/5 last:border-0 ${
        !item.read ? "bg-gold/5" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
            isWin ? "bg-gold/15 text-gold" : "bg-white/5 text-zinc-400"
          }`}
        >
          {isWin ? <Trophy className="w-4 h-4" /> : <Frown className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold mb-1">
            {points === 3
              ? "🎯 توقع مثالي! +3 نقاط"
              : points === 1
              ? "✓ توقعت الفائز بشكل صحيح +1"
              : "للأسف، توقع غير صحيح"}
          </p>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
            {home && <TeamLogo team={home} size="w-7 h-7" />}
            <span>{home?.name_ar || p.home_team}</span>
            <span className="font-bold text-gold">
              {p.home_score} - {p.away_score}
            </span>
            <span>{away?.name_ar || p.away_team}</span>
            {away && <TeamLogo team={away} size="w-7 h-7" />}
          </div>
          <p className="text-xs text-zinc-500">
            توقعك كان: {p.pred_home}-{p.pred_away}
            <span className="mx-2">•</span>
            {timeAgo(item.created_at)}
            {p.source === "auto" && <span className="mx-1 text-green-400">• تحديث تلقائي</span>}
          </p>
        </div>
        {!item.read && <span className="w-2 h-2 rounded-full bg-gold shrink-0 mt-2" />}
      </div>
    </div>
  );
}
