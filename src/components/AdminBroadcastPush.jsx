import { useState } from "react";
import api, { apiErrorMessage } from "../lib/api";
import { BellRing, Send, Eye } from "lucide-react";
import { toast } from "sonner";

const quickLinks = [
  { label: "المباريات", value: "/matches" },
  { label: "المتصدرين", value: "/leaderboard" },
  { label: "لوحة الإدارة", value: "/admin" },
  { label: "السلايدر", value: "/admin/ads" },
];

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
    <div className="grid lg:grid-cols-[1fr_360px] gap-5">
      <div className="glass-card rounded-2xl p-5 sm:p-8">
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
            <label className="block text-sm font-bold mb-2">الصفحة التي تفتح عند الضغط على الإشعار</label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {quickLinks.map((x) => (
                <button
                  key={x.value}
                  type="button"
                  onClick={() => setUrl(x.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                    url === x.value
                      ? "bg-gold text-black border-gold"
                      : "bg-white/5 text-zinc-300 border-white/10 hover:bg-white/10"
                  }`}
                >
                  {x.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/matches"
              className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-gold"
            />

            <p className="text-xs text-zinc-500 mt-2">
              مثال: <span className="text-zinc-300">/matches</span> أو{" "}
              <span className="text-zinc-300">/leaderboard</span>
            </p>
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gold text-black font-black hover:opacity-90 disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
            {sending ? "جاري الإرسال..." : "إرسال لكل المستخدمين"}
          </button>
        </form>

        {result && (
          <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm">
            <div className="font-bold text-emerald-300 mb-2">تم تنفيذ الإرسال</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-zinc-200">
              <div>تم الإرسال: <span className="font-black">{result.sent ?? 0}</span></div>
              <div>فشل: <span className="font-black">{result.failed ?? 0}</span></div>
              <div>التوكنات: <span className="font-black">{result.tokens ?? 0}</span></div>
              <div>المستخدمون: <span className="font-black">{result.users ?? 0}</span></div>
            </div>
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl p-5 sm:p-6 h-fit">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-4 h-4 text-gold" />
          <h3 className="font-black">معاينة الإشعار</h3>
        </div>

        <div className="rounded-2xl bg-zinc-900 border border-white/10 p-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/15 text-gold flex items-center justify-center">
              <BellRing className="w-5 h-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="font-black text-sm truncate">
                {title.trim() || "عنوان الإشعار"}
              </div>
              <div className="text-xs text-zinc-400 mt-1 leading-relaxed">
                {body.trim() || "نص الإشعار سيظهر هنا قبل الإرسال."}
              </div>
              <div className="text-[11px] text-gold mt-3">
                يفتح: {url || "/"}
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-zinc-500 mt-4 leading-relaxed">
          المعاينة تقريبية. شكل الإشعار النهائي يختلف قليلًا حسب نوع الجهاز والمتصفح.
        </p>
      </div>
    </div>
  );
}
