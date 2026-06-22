import React, { useEffect, useMemo, useState } from "react";

const TEST_API = "https://king-of-predictions-backend-test.onrender.com/api";
const REFRESH_SECONDS = 30;

const TEAM_NAMES = {
  ar:"الأرجنتين", at:"النمسا", mx:"المكسيك", za:"جنوب أفريقيا",
  kr:"كوريا الجنوبية", cz:"التشيك", ca:"كندا", ba:"البوسنة والهرسك",
  qa:"قطر", ch:"سويسرا", us:"الولايات المتحدة", py:"باراغواي",
  au:"أستراليا", tr:"تركيا", br:"البرازيل", ma:"المغرب",
  ht:"هايتي", sco:"اسكتلندا", "gb-sct":"اسكتلندا",
  de:"ألمانيا", ci:"ساحل العاج", ec:"الإكوادور", cw:"كوراساو",
  nl:"هولندا", jp:"اليابان", se:"السويد", tn:"تونس",
  be:"بلجيكا", eg:"مصر", ir:"إيران", nz:"نيوزيلندا",
  es:"إسبانيا", cv:"الرأس الأخضر", sa:"السعودية", uy:"أوروغواي",
  fr:"فرنسا", sn:"السنغال", iq:"العراق", no:"النرويج",
  dz:"الجزائر", jo:"الأردن", pt:"البرتغال", cd:"الكونغو الديمقراطية",
  uz:"أوزبكستان", co:"كولومبيا", eng:"إنجلترا", hr:"كرواتيا",
  gh:"غانا", pa:"بنما",
};

function teamName(v) {
  if (!v) return "الفريق";
  return TEAM_NAMES[String(v).toLowerCase()] || v;
}

export default function UserPredictions() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState("");
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    loadRows(true);
    const timer = setInterval(() => loadRows(false), REFRESH_SECONDS * 1000);
    return () => clearInterval(timer);
  }, []);

  async function loadRows(firstLoad = false) {
    if (firstLoad) setLoading(true);
    else setRefreshing(true);

    setErr("");

    try {
      const token = localStorage.getItem("mt_token");
      const res = await fetch(`${TEST_API}/predictions/public`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        setErr(data?.detail || "حدث خطأ أثناء تحميل التوقعات");
        setRows([]);
      } else {
        setRows(Array.isArray(data) ? data : []);
        setLastUpdate(new Date());
      }
    } catch {
      setErr("تعذر الاتصال بخدمة التوقعات");
      setRows([]);
    }

    setLoading(false);
    setRefreshing(false);
  }

  const matches = useMemo(() => {
    const map = {};

    rows.forEach((p) => {
      const home = teamName(p.home_team_name || p.home_team);
      const away = teamName(p.away_team_name || p.away_team);
      const key = p.match_id || `${home}-${away}`;

      if (!map[key]) {
        map[key] = { key, home, away, label: `${home} ضد ${away}`, count: 0 };
      }

      map[key].count += 1;
    });

    return Object.values(map);
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (selected === "all") return rows;
    return rows.filter((p) => {
      const home = teamName(p.home_team_name || p.home_team);
      const away = teamName(p.away_team_name || p.away_team);
      const key = p.match_id || `${home}-${away}`;
      return key === selected;
    });
  }, [rows, selected]);

  const selectedMatch = matches.find((m) => m.key === selected);

  return (
    <div dir="rtl" className="p-4 space-y-4">
      <div className="rounded-3xl p-5 text-white bg-gradient-to-l from-green-800 to-emerald-600 shadow">
        <h1 className="text-2xl font-black">توقعات المستخدمين</h1>
        <p className="text-sm opacity-90 mt-2">
          تظهر توقعات الجميع بعد بداية المباراة، ويتم التحديث تلقائيًا كل {REFRESH_SECONDS} ثانية.
        </p>

        <div className="flex items-center justify-between gap-3 mt-4">
          <button
            onClick={() => loadRows(false)}
            className="px-4 py-2 rounded-xl bg-white text-green-800 font-bold"
          >
            {refreshing ? "جاري التحديث..." : "تحديث الآن"}
          </button>

          <div className="text-xs opacity-90">
            آخر تحديث: {lastUpdate ? lastUpdate.toLocaleTimeString("ar") : "--"}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border shadow-sm">
        <label className="block text-sm font-bold text-zinc-700 mb-2">
          اختر المباراة
        </label>

        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full p-3 rounded-xl border bg-white text-zinc-900 font-bold"
        >
          <option value="all">جميع المباريات الظاهرة ({rows.length})</option>
          {matches.map((m) => (
            <option key={m.key} value={m.key}>
              {m.label} — {m.count} توقع
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="bg-white rounded-2xl p-5 border text-zinc-700">
          جاري تحميل التوقعات...
        </div>
      )}

      {!loading && err && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700">
          {err}
        </div>
      )}

      {!loading && !err && (
        <div className="bg-zinc-900 text-white rounded-3xl p-4 shadow">
          <div className="text-xs text-zinc-400 mb-1">المباراة المحددة</div>
          <div className="text-xl font-black">
            {selected === "all"
              ? "جميع المباريات الظاهرة"
              : `${selectedMatch?.home || ""} × ${selectedMatch?.away || ""}`}
          </div>
          <div className="text-xs text-zinc-400 mt-1">
            عدد التوقعات المعروضة: {filteredRows.length}
          </div>
        </div>
      )}

      {!loading && !err && filteredRows.length === 0 && (
        <div className="bg-white rounded-2xl p-5 border text-zinc-700">
          لا توجد توقعات ظاهرة الآن.
        </div>
      )}

      <div className="grid gap-3">
        {filteredRows.map((p, i) => {
          const home = teamName(p.home_team_name || p.home_team);
          const away = teamName(p.away_team_name || p.away_team);

          return (
            <div key={p.id || i} className="bg-white rounded-3xl p-4 border shadow-sm">
              <div className="text-sm font-bold text-zinc-500 mb-3">
                {home} × {away}
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-black text-zinc-900 text-lg">
                    {p.user_name || "مستخدم"}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    توقع المستخدم
                  </div>
                </div>

                <div className="text-center min-w-[100px] rounded-2xl bg-emerald-50 p-3">
                  <div className="text-xs text-emerald-700 font-bold mb-1">
                    النتيجة
                  </div>
                  <div className="text-3xl font-black text-emerald-700">
                    {p.pred_home ?? "-"} - {p.pred_away ?? "-"}
                  </div>
                </div>
              </div>

              {p.created_at && (
                <div className="text-xs text-zinc-400 mt-3 border-t pt-2">
                  وقت التوقع: {new Date(p.created_at).toLocaleString("ar")}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
