import { useEffect, useMemo, useState } from "react";
import { useContent } from "../context/ContentContext";
import api, { apiErrorMessage } from "../lib/api";
import { toast } from "sonner";
import { Loader2, Save, RotateCcw, FileText, Search } from "lucide-react";

const SECTIONS = [
  { title: "العلامة التجارية", keys: ["brand_name_prefix", "brand_name_suffix"] },
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
  { title: "تذييل الصفحة", keys: ["footer_text"] },
];

const LABELS = {
  brand_name_prefix: "اسم العلامة - الجزء الذهبي",
  brand_name_suffix: "اسم العلامة - الجزء الأبيض",
  landing_badge: "شارة الترحيب",
  landing_hero_line1: "العنوان الرئيسي - السطر 1",
  landing_hero_line2_strong: "السطر 2 - مميز ذهبي",
  landing_hero_line2_rest: "السطر 2 - باقي النص",
  landing_hero_line3_prefix: "السطر 3 - بداية",
  landing_hero_line3_italic: "السطر 3 - مائل",
  landing_hero_line3_suffix: "السطر 3 - نهاية",
  landing_hero_desc: "الوصف التعريفي",
  landing_cta_register: "زر التسجيل",
  landing_cta_login: "زر تسجيل الدخول",
  landing_cta_authenticated: "زر المستخدم المسجل",
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
  const [query, setQuery] = useState("");

  useEffect(() => {
    setDraft({ ...values });
  }, [values]);

  const dirtyKeys = useMemo(
    () => Object.keys(defaults).filter((k) => (draft[k] ?? "") !== (values[k] ?? "")),
    [defaults, draft, values]
  );

  const dirty = dirtyKeys.length > 0;

  const visibleSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SECTIONS;

    return SECTIONS.map((sec) => ({
      ...sec,
      keys: sec.keys.filter((k) => {
        const label = LABELS[k] || k;
        const val = draft[k] ?? "";
        return (
          sec.title.toLowerCase().includes(q) ||
          label.toLowerCase().includes(q) ||
          k.toLowerCase().includes(q) ||
          String(val).toLowerCase().includes(q)
        );
      }),
    })).filter((sec) => sec.keys.length > 0);
  }, [query, draft]);

  const onChange = (k, v) => setDraft((prev) => ({ ...prev, [k]: v }));
  const onReset = (k) => setDraft((prev) => ({ ...prev, [k]: defaults[k] || "" }));

  const save = async () => {
    setSaving(true);
    try {
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

  const ActionBar = ({ bottom = false }) => (
    <div
      className={`glass-card rounded-2xl p-3 sm:p-4 border border-white/10 ${
        bottom ? "mt-6" : "mb-6 sticky top-[72px] z-30"
      }`}
    >
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <div className="font-bold text-sm">
            {dirty ? `لديك ${dirtyKeys.length} تعديل غير محفوظ` : "كل النصوص محفوظة"}
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            التغييرات تظهر عند كل المستخدمين بعد الحفظ.
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={resetAll}
            disabled={saving}
            data-testid="content-reset-all"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/15 text-zinc-300 text-sm font-bold hover:bg-white/10 disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            إعادة الكل
          </button>

          <button
            onClick={save}
            disabled={saving || !dirty}
            data-testid="content-save"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gold text-black text-sm font-black hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ التغييرات
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div data-testid="content-editor">
      <div className="flex items-start justify-between flex-col md:flex-row gap-4 mb-5">
        <div>
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-gold" />
            تحرير نصوص التطبيق
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            عدّل أي نص ثم اضغط حفظ — يتم تطبيق التغييرات فوراً على كل المستخدمين.
          </p>
        </div>
      </div>

      <ActionBar />

      <div className="glass-card rounded-2xl p-4 mb-6 border border-white/10">
        <label className="text-xs font-bold text-zinc-400 mb-2 block">بحث داخل النصوص</label>
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث باسم النص أو محتواه..."
            className="w-full bg-black/40 border border-white/10 rounded-xl pr-10 pl-3 py-3 text-white text-sm focus:border-gold outline-none"
          />
        </div>
      </div>

      <div className="space-y-5">
        {visibleSections.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center text-zinc-400">
            لا توجد نصوص مطابقة للبحث
          </div>
        ) : (
          visibleSections.map((sec) => (
            <div key={sec.title} className="glass-card rounded-2xl p-4 sm:p-6 border border-white/10">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="font-display text-lg font-black text-gold">{sec.title}</h3>
                <span className="text-[11px] text-zinc-500">{sec.keys.length} عنصر</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sec.keys.map((k) => {
                  const val = draft[k] ?? "";
                  const isLong = (val || defaults[k] || "").length > 60;
                  const isDirty = val !== (values[k] ?? "");

                  return (
                    <div key={k} className={`rounded-xl p-3 bg-white/[0.03] border ${isDirty ? "border-gold/40" : "border-white/10"} ${isLong ? "md:col-span-2" : ""}`}>
                      <div className="flex items-center justify-between mb-2 gap-3">
                        <label className="text-xs font-bold text-zinc-300">{LABELS[k] || k}</label>
                        {isDirty && (
                          <button
                            onClick={() => onReset(k)}
                            className="text-[10px] text-zinc-500 hover:text-gold flex items-center gap-1 shrink-0"
                          >
                            <RotateCcw className="w-3 h-3" />
                            إعادة
                          </button>
                        )}
                      </div>

                      {isLong ? (
                        <textarea
                          value={val}
                          onChange={(e) => onChange(k, e.target.value)}
                          data-testid={`content-input-${k}`}
                          rows={4}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-white text-sm focus:border-gold outline-none resize-y"
                        />
                      ) : (
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => onChange(k, e.target.value)}
                          data-testid={`content-input-${k}`}
                          className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 text-white text-sm focus:border-gold outline-none"
                        />
                      )}

                      <div className="text-[10px] text-zinc-600 mt-2 font-mono truncate">{k}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <ActionBar bottom />
    </div>
  );
}
