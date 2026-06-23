import { useState } from "react";
import api, { apiErrorMessage } from "../lib/api";
import { BellRing, Send } from "lucide-react";
import { toast } from "sonner";

export default function AdminBroadcastPush() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/matches");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  async function handleSend(e) {
    e.preventDefault();

    if (!title.trim() || !body.trim()) {
      toast.error("اكتب عنوان الإشعار ونصه أولاً");
      return;
    }

    if (!window.confirm("هل تريد إرسال هذا الإشعار لكل المستخدمين الذين فعّلوا الإشعارات؟")) {
      return;
    }

    setSending(true);
    setResult(null);

    try {
      const { data } = await api.post("/admin/push/broadcast", {
        title: title.trim(),
        body: body.trim(),
        url: url.trim() || undefined,
      });

      setResult(data);
      toast.success(`تم إرسال الإشعار بنجاح إلى ${data.sent || 0} جهاز`);

      setTitle("");
      setBody("");
      setUrl("/matches");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="glass-card rounded-2xl p-6 sm:p-8">
      <div className="flex items-center gap-3 mb-5">
        <BellRing className="w-5 h-5 text-gold" />
        <div>
          <h2 className="font-display text-2xl font-black">إرسال إشعار لكل المستخدمين</h2>
          <p className="text-sm text-zinc-400 mt-1">
            سيصل فقط للمستخدمين الذين فعّلوا إشعارات الجوال في التطبيق.
          </p>
        </div>
      </div>

      <form onSubmit={handleSend} className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-2">عنوان الإشعار</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: بدأت مباريات اليوم!"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-gold"
            maxLength={120}
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">نص الإشعار</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="اكتب نص الإشعار هنا..."
            rows={4}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-gold resize-none"
            maxLength={500}
          />
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">رابط داخل التطبيق (اختياري)</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/matches"
            className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-gold"
          />
          <p className="text-xs text-zinc-500 mt-2">
            مثال: <span className="text-zinc-300">/matches</span> أو <span className="text-zinc-300">/leaderboard</span>
          </p>
        </div>

        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gold text-black font-black hover:opacity-90 disabled:opacity-60"
        >
          <Send className="w-4 h-4" />
          {sending ? "جاري الإرسال..." : "إرسال لكل المستخدمين"}
        </button>
      </form>

      {result && (
        <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm">
          <div className="font-bold text-emerald-300 mb-2">تم تنفيذ الإرسال</div>
          <div className="grid sm:grid-cols-4 gap-3 text-zinc-200">
            <div>تم الإرسال: <span className="font-black">{result.sent ?? 0}</span></div>
            <div>فشل: <span className="font-black">{result.failed ?? 0}</span></div>
            <div>التوكنات: <span className="font-black">{result.tokens ?? 0}</span></div>
            <div>المستخدمون: <span className="font-black">{result.users ?? 0}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
