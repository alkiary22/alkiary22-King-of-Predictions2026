import { useEffect, useRef, useState } from "react";
import api, { apiErrorMessage } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";
import { Send, MessageCircle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Chat() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  const isStaff = user?.role === "admin" || user?.role === "supervisor";

  const load = async () => {
    try {
      const { data } = await api.get("/chat/messages");
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [rows.length]);

  const send = async (e) => {
    e.preventDefault();

    const msg = text.trim();
    if (!msg) return;

    setSending(true);
    try {
      await api.post("/chat/messages", { text: msg });
      setText("");
      await load();
    } catch (e2) {
      toast.error(apiErrorMessage(e2));
    } finally {
      setSending(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("حذف هذه الرسالة؟")) return;

    try {
      await api.delete(`/chat/messages/${id}`);
      await load();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <MessageCircle className="w-16 h-16 text-gold mx-auto mb-4" />
        <h1 className="text-3xl font-black mb-3">دردشة ملك التوقعات</h1>
        <p className="text-zinc-400">سجّل الدخول للمشاركة في الدردشة.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="chat-page">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 border border-gold/20 mb-4">
          <MessageCircle className="w-8 h-8 text-gold" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-black mb-2">
          دردشة ملك التوقعات
        </h1>
        <p className="text-zinc-400 text-sm">
          دردشة كتابية عامة بين مستخدمي التطبيق.
        </p>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-white/10">
        <div className="h-[55vh] overflow-y-auto p-4 space-y-3 bg-black/20">
          {loading ? (
            <div className="h-full flex items-center justify-center text-zinc-500">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <div className="h-full flex items-center justify-center text-zinc-500">
              لا توجد رسائل بعد. كن أول من يكتب.
            </div>
          ) : (
            rows.map((m) => {
              const mine = m.user_id === user.id;
              return (
                <div
                  key={m.id}
                  className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}
                >
                  <Avatar src={m.user_avatar} name={m.user_name} size={36} />
                  <div className={`max-w-[80%] ${mine ? "text-right" : "text-right"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gold">{m.user_name}</span>
                      <span className="text-[10px] text-zinc-500">
                        {m.created_at
                          ? new Date(m.created_at).toLocaleTimeString("ar-EG", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                      {isStaff && (
                        <button
                          onClick={() => remove(m.id)}
                          className="text-red-400 hover:text-red-300"
                          title="حذف"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-2 text-sm leading-6 ${
                        mine
                          ? "bg-gold text-black font-semibold"
                          : "bg-white/10 text-white"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={send} className="p-3 border-t border-white/10 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={300}
            placeholder="اكتب رسالة..."
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-gold"
          />
          <button
            disabled={sending || !text.trim()}
            className="px-5 rounded-xl bg-gold text-black font-black disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
