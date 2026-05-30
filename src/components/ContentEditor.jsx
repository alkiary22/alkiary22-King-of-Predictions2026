import { useEffect, useState } from "react";
import { useContent } from "../context/ContentContext";
import api, { apiErrorMessage } from "../lib/api";
import { toast } from "sonner";
import { Loader2, Save, RotateCcw, FileText } from "lucide-react";

// Group content keys by section for nicer editing UX
const SECTIONS = [
  {
    title: "العلامة التجارية",
    keys: ["brand_name_prefix", "brand_name_suffix"],
  },
  {
    title: "الصفحة الرئيسية - البطل",
    keys: [
      "landing_badge",
      "landing_hero_line1",
      "landing_hero_line2_strong",
      "landing_hero_line2_rest",
      "landing_hero_line3_prefix",
      "landing_hero_line3_italic",
      "landing_hero_line3_suffix",
      "landing_hero_desc",
      "landing_cta_register",
      "landing_cta_login",
      "landing_cta_authenticated",
    ],
  },
  {
    title: "البطاقات المميزة",
    keys: [
      "feature_1_title",
      "feature_1_desc",
      "feature_2_title",
      "feature_2_desc",
      "feature_3_title",
      "feature_3_desc",
    ],
  },
  {
    title: "آلية النقاط",
    keys: [
      "scoring_pretitle",
      "scoring_title",
      "scoring_3_title",
      "scoring_3_desc",
      "scoring_1_title",
      "scoring_1_desc",
      "scoring_0_title",
      "scoring_0_desc",
    ],
  },
  {
    title: "صفحات التطبيق",
    keys: [
      "matches_pretitle",
      "matches_title",
      "matches_desc",
      "teams_pretitle",
      "teams_title",
      "teams_desc_template",
      "leaderboard_pretitle",
      "leaderboard_title",
      "leaderboard_desc",
    ],
  },
  {
    title: "تذييل الصفحة",
    keys: ["footer_text"],
  },
];

const LABELS = {
  brand_name_prefix: "اسم العلامة (الجزء الأول، ذهبي)",
  brand_name_suffix: "اسم العلامة (الجزء الثاني، أبيض)",
  landing_badge: "شارة الترحيب",
  landing_hero_line1: "العنوان الرئيسي - السطر 1",
  landing_hero_line2_strong: "السطر 2 (مميز ذهبي)",
  landing_hero_line2_rest: "السطر 2 (باقي النص)",
  landing_hero_line3_prefix: "السطر 3 - بداية",
  landing_hero_line3_italic: "السطر 3 (مائل)",
  landing_hero_line3_suffix: "السطر 3 - نهاية",
  landing_hero_desc: "الوصف التعريفي",
  landing_cta_register: "زر التسجيل",
  landing_cta_login: "زر تسجيل الدخول",
  landing_cta_authenticated: "زر للمستخدم المسجل",
  feature_1_title: "بطاقة 1 - عنوان",
  feature_1_desc: "بطاقة 1 - وصف",
  feature_2_title: "بطاقة 2 - عنوان",
  feature_2_desc: "بطاقة 2 - وصف",
  feature_3_title: "بطاقة 3 - عنوان",
  feature_3_desc: "بطاقة 3 - وصف",
  scoring_pretitle: "النقاط - شارة",
  scoring_title: "النقاط - عنوان",
  scoring_3_title: "+3 نقاط - عنوان",
  scoring_3_desc: "+3 نقاط - وصف",
  scoring_1_title: "+1 نقطة - عنوان",
  scoring_1_desc: "+1 نقطة - وصف",
  scoring_0_title: "0 نقطة - عنوان",
  scoring_0_desc: "0 نقطة - وصف",
  matches_pretitle: "المباريات - شارة",
  matches_title: "المباريات - عنوان",
  matches_desc: "المباريات - وصف",
  teams_pretitle: "المنتخبات - شارة",
  teams_title: "المنتخبات - عنوان",
  teams_desc_template: "المنتخبات - وصف",
  leaderboard_pretitle: "المتصدرين - شارة",
  leaderboard_title: "المتصدرين - عنوان",
  leaderboard_desc: "المتصدرين - وصف",
  footer_text: "نص التذييل",
};

export default function ContentEditor() {
  const { values, defaults, refresh } = useContent();
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft({ ...values });
  }, [values]);

  const dirty = Object.keys(defaults).some((k) => (draft[k] ?? "") !== (values[k] ?? ""));

  const onChange = (k, v) => setDraft((prev) => ({ ...prev, [k]: v }));

  const onReset = (k) => setDraft((prev) => ({ ...prev, [k]: defaults[k] || "" }));

  const save = async () => {
    setSaving(true);
    try {
      // Send only overrides that differ from defaults to keep doc lean
      const overrides = {};
      Object.keys(defaults).forEach((k) => {
        if ((draft[k] ?? "") !== (defaults[k] ?? "")) {
          overrides[k] = draft[k] ?? "";
        }
      });
      await api.put("/admin/content", { values: overrides });
      toast.success("تم حفظ النصوص بنجاح");
      await refresh();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const resetAll = async () => {
    if (!window.confirm("هل تريد إعادة جميع النصوص إلى الافتراضي؟ سيتم حذف كل تعديلاتك.")) return;
    setSaving(true);
    try {
      await api.put("/admin/content", { values: {} });
      toast.success("تمت إعادة الضبط");
      await refresh();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-testid="content-editor">
      <div className="flex items-center justify-between flex-col md:flex-row gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-gold" />
            تحرير نصوص التطبيق
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            عدّل أي نص ثم اضغط حفظ — يتم تطبيق التغييرات فوراً على كل المستخدمين.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetAll}
            disabled={saving}
            data-testid="content-reset-all"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/15 text-zinc-300 text-sm font-bold hover:bg-white/10 disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" /> إعادة الضبط للافتراضي
          </button>
          <button
            onClick={save}
            disabled={saving || !dirty}
            data-testid="content-save"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gold text-black text-sm font-bold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ التغييرات
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {SECTIONS.map((sec) => (
          <div key={sec.title} className="glass-card rounded-2xl p-6">
            <h3 className="font-display text-lg font-bold mb-4 text-gold">{sec.title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sec.keys.map((k) => {
                const val = draft[k] ?? "";
                const isLong = (val || defaults[k] || "").length > 60;
                const isDirty = val !== (values[k] ?? "");
                return (
                  <div key={k} className={isLong ? "md:col-span-2" : ""}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-zinc-300">{LABELS[k] || k}</label>
                      {isDirty && (
                        <button
                          onClick={() => onReset(k)}
                          className="text-[10px] text-zinc-500 hover:text-gold flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> إعادة
                        </button>
                      )}
                    </div>
                    {isLong ? (
                      <textarea
                        value={val}
                        onChange={(e) => onChange(k, e.target.value)}
                        data-testid={`content-input-${k}`}
                        rows={3}
                        className={`w-full bg-black/40 border rounded-lg px-3 py-2.5 text-white text-sm focus:border-gold outline-none ${
                          isDirty ? "border-gold/40" : "border-white/10"
                        }`}
                      />
                    ) : (
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => onChange(k, e.target.value)}
                        data-testid={`content-input-${k}`}
                        className={`w-full bg-black/40 border rounded-lg px-3 py-2.5 text-white text-sm focus:border-gold outline-none ${
                          isDirty ? "border-gold/40" : "border-white/10"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
