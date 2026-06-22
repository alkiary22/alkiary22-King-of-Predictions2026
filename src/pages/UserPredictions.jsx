import React, { useEffect, useMemo, useState } from "react";

const API = process.env.REACT_APP_BACKEND_URL + "/api";
const REFRESH_SECONDS = 30;

const TEAM_NAMES = {
  ar:"الأرجنتين", at:"النمسا", mx:"المكسيك", za:"جنوب أفريقيا",
  eg:"مصر", nz:"نيوزيلندا", uy:"أوروغواي", cv:"الرأس الأخضر",
  be:"بلجيكا", ir:"إيران", br:"البرازيل", ma:"المغرب",
  fr:"فرنسا", iq:"العراق", sa:"السعودية", es:"إسبانيا",
};

function teamName(v) {
  if (!v) return "الفريق";
  return TEAM_NAMES[String(v).toLowerCase()] || v;
}

export default function UserPredictions() {
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState("all");
  const [loading, setLoading] = useState(true);

  async function loadRows() {
    const token = localStorage.getItem("mt_token");
    const res = await fetch(`${API}/predictions/public`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setRows(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    loadRows();
    const timer = setInterval(loadRows, REFRESH_SECONDS * 1000);
    return () => clearInterval(timer);
  }, []);

  const matches = useMemo(() => {
    const map = {};
    rows.forEach((p) => {
      const home = teamName(p.home_team_name || p.home_team);
      const away = teamName(p.away_team_name || p.away_team);
      const key = p.match_id || `${home}-${away}`;
      if (!map[key]) map[key] = { key, home, away, count: 0 };
      map[key].count++;
    });
    return Object.values(map);
  }, [rows]);

  const shown = selected === "all"
    ? rows
    : rows.filter((p) => p.match_id === selected);

  return (
    <div dir="rtl" className="p-4 space-y-4">
      <div className="rounded-2xl p-5 text-white bg-gradient-to-l from-green-800 to-emerald-600">
        <h1 className="text-2xl font-black">توقعات المستخدمين</h1>
        <p className="text-sm mt-2 opacity-90">
          تظهر توقعات المستخدمين بعد بداية المباراة، ويتم التحديث تلقائيًا.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-4 border">
        <label className="block text-sm font-bold mb-2">اختر المباراة</label>
        <select
          className="w-full p-3 rounded-xl border font-bold"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="all">جميع المباريات ({rows.length})</option>
          {matches.map((m) => (
            <option key={m.key} value={m.key}>
              {m.home} ضد {m.away} — {m.count} توقع
            </option>
          ))}
        </select>
      </div>

      {loading && <div className="bg-white rounded-xl p-4">جاري التحميل...</div>}

      {!loading && shown.length === 0 && (
        <div className="bg-white rounded-xl p-4">لا توجد توقعات ظاهرة الآن.</div>
      )}

      <div className="grid gap-3">
        {shown.map((p, i) => {
          const home = teamName(p.home_team_name || p.home_team);
          const away = teamName(p.away_team_name || p.away_team);

          return (
            <div key={p.id || i} className="bg-white rounded-2xl p-4 border shadow-sm">
              <div className="text-sm text-zinc-500 mb-2">{home} × {away}</div>
              <div className="flex justify-between items-center gap-3">
                <div className="font-black text-zinc-900">{p.user_name || "مستخدم"}</div>
                <div className="text-3xl font-black text-emerald-700">
                  {p.pred_home ?? "-"} - {p.pred_away ?? "-"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
