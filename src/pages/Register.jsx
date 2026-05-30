import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiErrorMessage } from "../lib/api";
import { Crown, Mail, Lock, User as UserIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success("مرحباً بك في ملك التوقعات!");
      nav("/matches");
    } catch (e) {
      const msg = apiErrorMessage(e);
      setErr(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4 py-12" data-testid="register-page">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gold flex items-center justify-center shadow-[0_0_30px_rgba(255,215,0,0.4)]">
            <Crown className="w-7 h-7 text-black" strokeWidth={2.5} />
          </div>
        </Link>
        <div className="glass-card rounded-2xl p-8 animate-fade-in-up">
          <h1 className="font-display text-3xl font-black text-center mb-2">إنشاء حساب جديد</h1>
          <p className="text-center text-zinc-400 mb-8 text-sm">
            انضم للمنافسة على لقب ملك التوقعات
          </p>
          <form onSubmit={submit} className="space-y-5">
            <Field
              label="الاسم"
              icon={UserIcon}
              testId="register-name-input"
              value={name}
              onChange={setName}
              type="text"
              minLength={2}
              placeholder="اسمك الكامل"
            />
            <Field
              label="البريد الإلكتروني"
              icon={Mail}
              testId="register-email-input"
              value={email}
              onChange={setEmail}
              type="email"
              placeholder="you@example.com"
            />
            <Field
              label="كلمة المرور"
              icon={Lock}
              testId="register-password-input"
              value={password}
              onChange={setPassword}
              type="password"
              minLength={6}
              placeholder="6 أحرف على الأقل"
            />
            {err && (
              <p data-testid="register-error" className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                {err}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              data-testid="register-submit-button"
              className="w-full py-3.5 rounded-lg bg-gold text-black font-bold hover:bg-yellow-400 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              إنشاء حسابي
            </button>
          </form>
          <p className="text-center text-sm text-zinc-400 mt-6">
            لديك حساب بالفعل؟{" "}
            <Link to="/login" data-testid="link-to-login" className="text-gold font-bold hover:underline">
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon: Icon, testId, value, onChange, type, placeholder, minLength }) {
  return (
    <div>
      <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type={type}
          required
          minLength={minLength}
          data-testid={testId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-lg pr-10 pl-4 py-3 text-white focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}
