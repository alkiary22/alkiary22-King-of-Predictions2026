import React, { useEffect, useMemo, useState } from "react";

const TEST_API = "https://king-of-predictions-backend-test.onrender.com/api";
const REFRESH_SECONDS = 30;
const CACHE_KEY = "public_predictions_cache";

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
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState("");
  const [lastUpdate, setLastUpdate] = useState(null);

  
useEffect(() => {

  try{
    const cache=JSON.parse(sessionStorage.getItem(CACHE_KEY)||"null");

    if(cache?.rows?.length){

      setRows(cache.rows);

      setLastUpdate(new Date(cache.time));

      setLoading(false);

      const p=cache.rows[0];

      if(p){
        const home=teamName(p.home_team_name||p.home_team);
        const away=teamName(p.away_team_name||p.away_team);
        setSelected(p.match_id||`${home}-${away}`);
      }

    }

  }catch{}

  loadRows(true);

  const timer=setInterval(
    ()=>loadRows(false),
    REFRESH_SECONDS*1000
  );

  return ()=>clearInterval(timer);

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
        const list = Array.isArray(data) ? data : [];
        setRows(list);

        try{
          sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              rows:list,
              time:Date.now()
            })
          );
        }catch{}

        setLastUpdate(new Date());

        setSelected((prev) => {
          if (!list.length) return "";
          const keys = list.map((p) => {
            const home = teamName(p.home_team_name || p.home_team);
            const away = teamName(p.away_team_name || p.away_team);
            return p.match_id || `${home}-${away}`;
          });
          return prev && keys.includes(prev) ? prev : keys[0];
        });
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
    if (!selected) return [];
    return rows.filter((p) => {
      const home = teamName(p.home_team_name || p.home_team);
      const away = teamName(p.away_team_name || p.away_team);
      const key = p.match_id || `${home}-${away}`;
      return key === selected;
    });
  }, [rows, selected]);

  const selectedMatch = matches.find((m) => m.key === selected);

  return (
    <div dir="rtl" className="min-h-screen bg-black px-2 py-3 space-y-3 overflow-x-hidden">
      <div className="rounded-2xl p-4 text-white bg-gradient-to-l from-green-800 to-emerald-600 shadow">
        <h1 className="text-xl sm:text-2xl font-black">توقعات المستخدمين</h1>
        <p className="text-xs sm:text-sm opacity-90 mt-2 leading-6">
          تظهر توقعات الجميع بعد بداية المباراة، ويتم التحديث تلقائيًا كل {REFRESH_SECONDS} ثانية.
        </p>

        <div className="flex items-center justify-between gap-2 mt-3">
          <button
            onClick={() => loadRows(false)}
            className="px-3 py-2 rounded-xl bg-white text-green-800 font-black text-sm shrink-0"
          >
            {refreshing ? "جاري التحديث..." : "تحديث الآن"}
          </button>

          <div className="text-[11px] opacity-90 text-left leading-5">
            آخر تحديث: {lastUpdate ? lastUpdate.toLocaleTimeString("ar") : "--"}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-3 border shadow-sm">
        <label className="block text-sm font-bold text-zinc-700 mb-2">
          اختر المباراة
        </label>

        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full max-w-full p-3 rounded-xl border-2 border-yellow-500 bg-white text-zinc-900 font-black text-sm outline-none"
        >
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
        <div className="bg-zinc-900 text-white rounded-2xl p-3 shadow">
          <div className="text-xs text-zinc-400 mb-1">المباراة المحددة</div>
          <div className="text-lg sm:text-xl font-black leading-7">
            {selectedMatch ? `${selectedMatch.home} × ${selectedMatch.away}` : "—"}
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
            <div key={p.id || i} className="bg-white rounded-2xl p-3 border shadow-sm overflow-hidden">
              <div className="text-xs font-bold text-zinc-500 mb-2 truncate">
                {home} × {away}
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-black text-zinc-900 text-base truncate">
                    {p.user_name || "مستخدم"}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    توقع المستخدم
                  </div>
                </div>

                <div className="text-center min-w-[82px] rounded-2xl bg-emerald-50 px-3 py-2 shrink-0">
                  <div className="text-xs text-emerald-700 font-bold mb-1">
                    النتيجة
                  </div>
                  <div className="text-2xl font-black text-emerald-700">
                    {p.pred_home ?? "-"} - {p.pred_away ?? "-"}
                  </div>
                </div>
              </div>

              {p.created_at && (
                <div className="text-[11px] text-zinc-400 mt-2 border-t pt-2">
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
