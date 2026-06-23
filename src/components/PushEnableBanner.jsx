import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { enablePushNotifications } from "../lib/push";

export default function PushEnableBanner() {
  const [enabled, setEnabled] = useState(() => localStorage.getItem("push_enabled") === "1");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (Notification?.permission === "granted" && localStorage.getItem("push_enabled") === "1") {
      setEnabled(true);
    }
  }, []);

  async function activate() {
    setLoading(true);
    setMessage("");
    try {
      await enablePushNotifications();
      localStorage.setItem("push_enabled", "1");
      setEnabled(true);
      setMessage("تم تفعيل الإشعارات بنجاح ✅");
    } catch (e) {
      setMessage(e?.message || "تعذر تفعيل الإشعارات");
    } finally {
      setLoading(false);
    }
  }

  if (enabled) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 mt-4">
      <div className="rounded-2xl border border-gold/30 bg-gold/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="font-black text-gold flex items-center gap-2">
            <Bell className="w-4 h-4" />
            فعّل الإشعارات حتى لا تفوّت المباريات
          </div>
          <p className="text-sm text-zinc-300 mt-1">
            ستصلك تنبيهات قبل بداية المباراة ونتائج التوقعات مباشرة.
          </p>
          {message && <p className="text-xs text-zinc-400 mt-2">{message}</p>}
        </div>

        <button
          onClick={activate}
          disabled={loading}
          className="px-5 py-3 rounded-xl bg-gold text-black font-black disabled:opacity-60"
        >
          {loading ? "جاري التفعيل..." : "تفعيل الإشعارات 🔔"}
        </button>
      </div>
    </div>
  );
}
