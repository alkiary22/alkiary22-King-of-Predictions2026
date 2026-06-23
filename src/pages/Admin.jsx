import { useEffect, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import api, { apiErrorMessage } from "../lib/api";
import Flag from "../components/Flag";
import { Plus, Trash2, Edit2, CheckCircle2, ShieldCheck, Loader2, X, RefreshCw, Download, Users, Shield, UserMinus, FileText, Eye, Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ContentEditor from "../components/ContentEditor";
import AdminBroadcastPush from "../components/AdminBroadcastPush";
import { toast } from "sonner";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function defaultKickoff() {
  const d = new Date();
  d.setHours(20, 0, 0, 0);
  return d.toISOString().slice(0, 16);
}

function timeAgoAr(iso) {
  if (!iso) return "أبداً";
  try {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return "قبل لحظات";
    if (diff < 3600) return `قبل ${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `قبل ${Math.floor(diff / 3600)} ساعة`;
    return `قبل ${Math.floor(diff / 86400)} يوم`;
  } catch {
    return "—";
  }
}

export default function Admin() {
  const { user: currentUser } = useAuth();
  const currentUserId = currentUser?.id;
  const isFullAdmin = currentUser?.role === "admin";
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resultModal, setResultModal] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [tab, setTab] = useState("matches");
  const [users, setUsers] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [passwordUser, setPasswordUser] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [t, m, ls] = await Promise.all([
        api.get("/teams"),
        api.get("/matches"),
        api.get("/admin/last-sync").catch(() => ({ data: null })),
      ]);
      setTeams(t.data);
      setMatches(m.data);
      setLastSync(ls.data);

      api.get("/admin/users")
        .then((us) => setUsers(us.data || []))
        .catch(() => setUsers([]));
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleEditTime = async (match) => {
    const current = match.kickoff || "";
    const value = window.prompt(
      "أدخل وقت المباراة بهذه الصيغة:\n2026-06-12T05:00:00+03:00",
      current
    );

    if (!value) return;

    try {
      await api.patch(`/admin/matches/${match.id}/time`, { kickoff: value });
      toast.success("تم تعديل وقت المباراة");
      reload();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه المباراة؟ سيتم حذف كل التوقعات المرتبطة بها.")) return;
    try {
      await api.delete(`/matches/${id}`);
      toast.success("تم الحذف");
      reload();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const handleSeedFixtures = async () => {
    if (!window.confirm(
      "سيتم حذف جميع المباريات والتوقعات الحالية وزرع الجدول الرسمي الكامل لكأس العالم 2026 (72 مباراة لدور المجموعات). هل أنت متأكد؟"
    )) return;
    try {
      const { data } = await api.post("/admin/seed-fixtures");
      toast.success(`تمت إضافة ${data.inserted} مباراة من الجدول الرسمي`);
      reload();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  const [syncing, setSyncing] = useState(false);
  const handleImportNewFixtures = async () => {
    if (!window.confirm("سيتم استيراد مباريات كأس العالم الجديدة فقط بدون حذف أي توقعات. هل تريد المتابعة؟")) return;

    setSyncing(true);
    try {
      const { data } = await api.post("/admin/import-new-fixtures");
      alert(`تمت العملية بنجاح\nتمت إضافة: ${data?.created || 0} مباراة\nتم تخطي: ${data?.skipped || 0} مباراة`);
      toast.success(data?.message || `تم استيراد ${data?.created || 0} مباراة جديدة`);
      await reload();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncResults = async () => {
    setSyncing(true);
    try {
      const { data } = await api.post("/admin/sync-results");
      if (data.error) {
        toast.error(`فشل الاتصال بالمصدر: ${data.error}`);
      } else if (data.updated > 0) {
        toast.success(`تم تحديث نتائج ${data.updated} مباراة تلقائياً`);
        reload();
      } else {
        toast.message(`لا توجد نتائج جديدة للتحديث (تم فحص ${data.checked || 0} مباراة منتهية)`);
      }
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`هل أنت متأكد من حذف الحساب "${u.name}" (${u.email})؟ سيتم حذف جميع توقعاته وإشعاراته نهائياً.`)) return;
    try {
      await api.delete(`/admin/users/${u.id}`);
      toast.success("تم حذف الحساب");
      reload();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };


  const handleResetPassword = async (u) => {
    setPasswordUser(u);
  };

  const handleToggleRole = async (u) => {
    const promote = u.role === "user";
    const msg = promote
      ? `هل تريد ترقية "${u.name}" إلى مشرف؟ سيستطيع إدارة المباريات والنتائج فقط (لا يستطيع حذف أحد ولا منح صلاحيات).`
      : `هل تريد إنزال "${u.name}" من رتبة الإشراف ليصبح لاعباً عادياً؟`;
    if (!window.confirm(msg)) return;
    try {
      await api.put(`/admin/users/${u.id}/role`, { role: promote ? "supervisor" : "user" });
      toast.success(promote ? `تمت ترقية "${u.name}" إلى مشرف` : `تمت إعادة "${u.name}" إلى لاعب`);
      reload();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-10" data-testid="admin-page">
      <div className="flex items-start justify-between flex-col md:flex-row gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-gold" />
            <p className="text-xs font-bold text-gold uppercase tracking-[0.2em]">لوحة الإدارة</p>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-black mb-3">إدارة التطبيق</h1>
          <p className="text-zinc-400">أدِر المباريات، النتائج، والمستخدمين من مكان واحد.</p>
          <div className="mt-4">
            <Link
              to="/admin/ads"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gold text-black font-black hover:opacity-90"
            >
              إدارة السلايدر
            </Link>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <AdminStatCard
          label="المستخدمون"
          value={users.length}
          hint="إجمالي الحسابات"
        />
        <AdminStatCard
          label="المباريات"
          value={matches.length}
          hint="كل المباريات"
        />
        <AdminStatCard
          label="المنتهية"
          value={matches.filter((m) => m.status === "finished").length}
          hint="نتائج محفوظة"
        />
        <AdminStatCard
          label="القادمة"
          value={matches.filter((m) => m.status !== "finished").length}
          hint="لم تنتهِ بعد"
        />
        <AdminStatCard
          label="آخر مزامنة"
          value={lastSync?.at ? timeAgoAr(lastSync.at) : "—"}
          hint={lastSync?.ok ? "تعمل" : "غير مؤكدة"}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/5 overflow-x-auto pb-2 scrollbar-hide" data-testid="admin-tabs">
        <TabBtn active={tab === "matches"} onClick={() => setTab("matches")} testId="tab-matches">
          <CheckCircle2 className="w-4 h-4" /> المباريات
        </TabBtn>
        <TabBtn active={tab === "users"} onClick={() => setTab("users")} testId="tab-users">
          <Users className="w-4 h-4" /> المستخدمون
          <span className="bg-white/10 text-zinc-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {users.length}
          </span>
        </TabBtn>
        <TabBtn active={tab === "predictions"} onClick={() => setTab("predictions")} testId="tab-predictions">
          <Eye className="w-4 h-4" /> التوقعات
        </TabBtn>
                {isFullAdmin && (
          <TabBtn active={tab === "push"} onClick={() => setTab("push")} testId="tab-push">
            <Bell className="w-4 h-4" /> الإشعارات
          </TabBtn>
        )}
        {isFullAdmin && (
          <TabBtn active={tab === "content"} onClick={() => setTab("content")} testId="tab-content">
            <FileText className="w-4 h-4" /> النصوص
          </TabBtn>
        )}
      </div>

      {tab === "matches" && (
        <MatchesTab
          loading={loading}
          matches={matches}
          teams={teams}
          lastSync={lastSync}
          onSync={handleSyncResults}
          syncing={syncing}
          onImportNew={handleImportNewFixtures}
          onSeed={handleSeedFixtures}
          onAdd={() => setCreateOpen(true)}
          onResult={(m) => setResultModal(m)}
          onEditTime={handleEditTime}
          onDelete={handleDelete}
          isFullAdmin={isFullAdmin}
        />
      )}

      {tab === "users" && (
        <UsersTab
          users={users}
          currentUserId={currentUserId}
          isFullAdmin={isFullAdmin}
          onEdit={(u) => setEditUser(u)}
          onDelete={handleDeleteUser}
          onToggleRole={handleToggleRole}
          onResetPassword={handleResetPassword}
        />
      )}

      {tab === "push" && isFullAdmin && <AdminBroadcastPush />}

      {tab === "content" && isFullAdmin && <ContentEditor />}

      {tab === "predictions" && (
        <PredictionsTab matches={matches} teams={teams} />
      )}

      {createOpen && (
        <CreateMatchModal teams={teams} onClose={() => setCreateOpen(false)} onCreated={reload} />
      )}
      {resultModal && (
        <ResultModal match={resultModal} onClose={() => setResultModal(null)} onSaved={reload} />
      )}
      {editUser && (
        <EditUserModal user={editUser} onClose={() => setEditUser(null)} onSaved={reload} />
      )}

      {passwordUser && (
        <PasswordResetModal
          user={passwordUser}
          onClose={() => setPasswordUser(null)}
          onSaved={() => {
            setPasswordUser(null);
            reload();
          }}
        />
      )}
    </div>
  );
}


function AdminStatCard({ label, value, hint }) {
  return (
    <div className="glass-card rounded-2xl p-4 border border-white/10">
      <div className="text-xs text-zinc-500 mb-2">{label}</div>
      <div className="font-display text-2xl font-black text-gold truncate">{value}</div>
      <div className="text-[11px] text-zinc-500 mt-1 truncate">{hint}</div>
    </div>
  );
}

function TabBtn({ active, onClick, children, testId }) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className={`flex items-center gap-2 px-5 py-3 text-sm font-bold transition-colors relative ${
        active ? "text-gold" : "text-zinc-400 hover:text-white"
      }`}
    >
      {children}
      {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold rounded-t" />}
    </button>
  );
}

function MatchesTab({ loading, matches, teams, lastSync, onSync, syncing, onImportNew, onSeed, onAdd, onResult, onEditTime, onDelete, isFullAdmin }) {
  const [matchFilter, setMatchFilter] = useState("all");
  const [matchSearch, setMatchSearch] = useState("");

  const today = new Date().toISOString().slice(0, 10);

  const filteredMatches = matches.filter((m) => {
    const home = teams.find((t) => t.code === m.home_team);
    const away = teams.find((t) => t.code === m.away_team);

    const q = matchSearch.trim().toLowerCase();
    const searchOk =
      !q ||
      home?.name_ar?.toLowerCase().includes(q) ||
      away?.name_ar?.toLowerCase().includes(q) ||
      home?.name_en?.toLowerCase().includes(q) ||
      away?.name_en?.toLowerCase().includes(q) ||
      m.home_team?.toLowerCase().includes(q) ||
      m.away_team?.toLowerCase().includes(q);

    const filterOk =
      matchFilter === "all" ||
      (matchFilter === "upcoming" && m.status !== "finished") ||
      (matchFilter === "finished" && m.status === "finished") ||
      (matchFilter === "today" && m.match_date === today);

    return searchOk && filterOk;
  });

  return (
    <>
      <div className="flex items-start justify-between flex-col md:flex-row gap-4 mb-6">
        <h2 className="font-display text-2xl font-bold">إدارة المباريات</h2>
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <button
            onClick={onSync}
            disabled={syncing}
            data-testid="sync-results-button"
            className="flex items-center gap-2 px-5 py-3 rounded-lg bg-green-500/15 border border-green-500/30 text-green-400 font-bold hover:bg-green-500/25 active:scale-95 transition-all disabled:opacity-60"
          >
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            تحديث النتائج تلقائياً
          </button>
          {isFullAdmin && (
            <button
              onClick={onImportNew}
              disabled={syncing}
              data-testid="import-new-fixtures-button"
              className="flex items-center gap-2 px-5 py-3 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 font-bold hover:bg-blue-500/25 active:scale-95 transition-all disabled:opacity-60"
            >
              <Download className="w-4 h-4" /> استيراد مباريات كأس العالم الجديدة
            </button>
          )}
          {isFullAdmin && (
            <button
              onClick={onSeed}
              data-testid="seed-fixtures-button"
              className="flex items-center gap-2 px-5 py-3 rounded-lg bg-white/5 border border-white/15 text-white font-bold hover:bg-white/10 active:scale-95 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> زرع جدول كأس العالم 2026
            </button>
          )}
          <button
            onClick={onAdd}
            data-testid="add-match-button"
            className="flex items-center gap-2 px-5 py-3 rounded-lg bg-gold text-black font-bold hover:bg-yellow-400 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> إضافة مباراة
          </button>
        </div>
      </div>

      {/* Sync status strip */}
      <div className="glass-card rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3" data-testid="sync-status-strip">
        <div className="flex items-center gap-3 text-sm">
          <div className={`w-2.5 h-2.5 rounded-full ${lastSync?.ok ? "bg-green-400 animate-pulse" : "bg-zinc-600"}`} />
          <span className="text-zinc-400">المزامنة التلقائية من TheSportsDB:</span>
          {lastSync?.at ? (
            <span className="font-bold">
              {timeAgoAr(lastSync.at)}
              {lastSync.updated > 0 && (
                <span className="mr-2 text-gold">— حُدّثت {lastSync.updated} نتيجة</span>
              )}
              {!lastSync.ok && lastSync.error && (
                <span className="mr-2 text-red-400">— خطأ: {lastSync.error}</span>
              )}
            </span>
          ) : (
            <span className="text-zinc-500">لم تتم بعد</span>
          )}
        </div>
        <span className="text-xs text-zinc-500">تعمل تلقائياً كل 15 دقيقة</span>
      </div>


      <div className="glass-card rounded-2xl p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <input
            type="text"
            value={matchSearch}
            onChange={(e) => setMatchSearch(e.target.value)}
            placeholder="ابحث باسم الفريق..."
            className="w-full lg:w-80 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-gold"
          />

          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              ["all", "الكل"],
              ["upcoming", "القادمة"],
              ["finished", "المنتهية"],
              ["today", "اليوم"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setMatchFilter(key)}
                className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold ${
                  matchFilter === key
                    ? "bg-gold text-black"
                    : "bg-white/5 text-zinc-300 hover:bg-white/10"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-zinc-500 mt-3">
          عرض {filteredMatches.length} من {matches.length} مباراة
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-zinc-400">
          لا توجد مباريات مطابقة للفلتر.
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {filteredMatches.map((m) => {
              const home = teams.find((t) => t.code === m.home_team);
              const away = teams.find((t) => t.code === m.away_team);

              return (
                <div key={m.id} className="glass-card rounded-2xl p-4 border border-white/10" data-testid={`admin-match-card-${m.id}`}>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Flag code={home?.code} size="w-7 h-5" />
                      <span className="font-bold truncate">{home?.name_ar}</span>
                    </div>
                    <span className="text-zinc-500 text-xs">ضد</span>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold truncate">{away?.name_ar}</span>
                      <Flag code={away?.code} size="w-7 h-5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                    <div className="bg-white/5 rounded-xl p-3">
                      <div className="text-zinc-500 mb-1">التاريخ</div>
                      <div className="font-bold">{m.match_date}</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3">
                      <div className="text-zinc-500 mb-1">المرحلة</div>
                      <div className="font-bold">{m.stage}{m.group_name ? ` · ${m.group_name}` : ""}</div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-3 mb-3">
                    <div className="text-zinc-500 text-xs mb-1">النتيجة</div>
                    {m.status === "finished" ? (
                      <div>
                        <div className="font-display font-black text-lg text-gold">{m.home_score} - {m.away_score}</div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                            m.result_source === "auto"
                              ? "bg-green-500/15 text-green-400"
                              : "bg-blue-500/15 text-blue-400"
                          }`}>
                            {m.result_source === "auto" ? "تلقائي" : "يدوي"}
                          </span>
                          <span className="text-[10px] text-zinc-500">{timeAgoAr(m.result_updated_at)}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-zinc-400 text-sm">لم تنتهِ بعد</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => onResult(m)}
                      data-testid={`set-result-mobile-${m.id}`}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gold/15 text-gold text-sm font-bold hover:bg-gold/25"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {m.status === "finished" ? "تعديل النتيجة" : "إدخال النتيجة"}
                    </button>

                    <button
                      onClick={() => onEditTime(m)}
                      data-testid={`edit-time-mobile-${m.id}`}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500/10 text-blue-400 text-sm font-bold hover:bg-blue-500/20"
                    >
                      تعديل الوقت
                    </button>

                    <button
                      onClick={() => onDelete(m.id)}
                      data-testid={`delete-match-mobile-${m.id}`}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 text-sm font-bold hover:bg-red-500/20"
                    >
                      <Trash2 className="w-4 h-4" />
                      حذف المباراة
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="glass-card rounded-2xl overflow-hidden hidden md:block">
            <div className="w-full overflow-x-auto"><table className="w-full min-w-[760px] text-sm">
              <thead className="bg-white/5">
                <tr className="text-right">
                  <th className="p-4 font-bold">المباراة</th>
                  <th className="p-4 font-bold">التاريخ</th>
                  <th className="p-4 font-bold">المرحلة</th>
                  <th className="p-4 font-bold">النتيجة</th>
                  <th className="p-4 font-bold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredMatches.map((m) => {
                  const home = teams.find((t) => t.code === m.home_team);
                  const away = teams.find((t) => t.code === m.away_team);
                  return (
                    <tr key={m.id} className="border-t border-white/5" data-testid={`admin-match-row-${m.id}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Flag code={home?.code} size="w-7 h-5" />
                          <span className="font-bold">{home?.name_ar}</span>
                          <span className="text-zinc-500 mx-1">ضد</span>
                          <span className="font-bold">{away?.name_ar}</span>
                          <Flag code={away?.code} size="w-7 h-5" />
                        </div>
                      </td>
                      <td className="p-4 text-zinc-300">{m.match_date}</td>
                      <td className="p-4 text-zinc-300">{m.stage}{m.group_name ? ` · ${m.group_name}` : ""}</td>
                      <td className="p-4">
                        {m.status === "finished" ? (
                          <div>
                            <span className="font-display font-bold text-gold">{m.home_score} - {m.away_score}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                m.result_source === "auto"
                                  ? "bg-green-500/15 text-green-400"
                                  : "bg-blue-500/15 text-blue-400"
                              }`}>
                                {m.result_source === "auto" ? "تلقائي" : "يدوي"}
                              </span>
                              <span className="text-[10px] text-zinc-500">{timeAgoAr(m.result_updated_at)}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-zinc-500 text-xs">لم تنتهِ</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onResult(m)}
                            data-testid={`set-result-${m.id}`}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-gold/15 text-gold text-xs font-bold hover:bg-gold/25"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {m.status === "finished" ? "تعديل النتيجة" : "إدخال النتيجة"}
                          </button>
                          <button
                            onClick={() => onEditTime(m)}
                            data-testid={`edit-time-${m.id}`}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-500/10 text-blue-400 text-xs font-bold hover:bg-blue-500/20"
                          >
                            تعديل الوقت
                          </button>
                          <button
                            onClick={() => onDelete(m.id)}
                            data-testid={`delete-match-${m.id}`}
                            className="p-1.5 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table></div>
          </div>
        </>
      )}
    </>
  );
}

function UsersTab({ users, currentUserId, isFullAdmin, onEdit, onDelete, onToggleRole, onResetPassword }) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filtered = users.filter((u) => {
    const q = search.trim().toLowerCase();
    const searchOk =
      !q ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q);

    const roleOk =
      roleFilter === "all" ||
      (roleFilter === "admin" && u.role === "admin") ||
      (roleFilter === "supervisor" && u.role === "supervisor") ||
      (roleFilter === "user" && (u.role === "user" || !u.role));

    return searchOk && roleOk;
  });

  return (
    <div data-testid="users-tab">
      <div className="flex items-center justify-between flex-col md:flex-row gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold">إدارة المستخدمين</h2>
          {!isFullAdmin && (
            <p className="text-xs text-zinc-500 mt-1" data-testid="readonly-notice">
              <ShieldCheck className="w-3 h-3 inline ml-1" />
              عرض فقط — التعديل والحذف للمدير العام فقط
            </p>
          )}
        </div>
        <div className="w-full md:w-auto flex flex-col gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو البريد..."
            data-testid="users-search"
            className="w-full md:w-72 bg-surface border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-gold outline-none text-sm"
          />

          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              ["all", "الكل"],
              ["admin", "مدير"],
              ["supervisor", "مشرف"],
              ["user", "لاعب"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setRoleFilter(key)}
                className={`shrink-0 px-3 py-2 rounded-xl text-xs font-bold ${
                  roleFilter === key
                    ? "bg-gold text-black"
                    : "bg-white/5 text-zinc-300 hover:bg-white/10"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="text-xs text-zinc-500">
            عرض {filtered.length} من {users.length} مستخدم
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-zinc-400">
          {users.length === 0 ? "لا يوجد مستخدمون مسجلون بعد" : "لا توجد نتائج مطابقة"}
        </div>
      ) : (
        <>
          {/* Mobile user cards */}
          <div className="grid gap-3 md:hidden">
            {filtered.map((u) => {
              const isSelf = u.id === currentUserId;
              return (
                <div key={u.id} className="glass-card rounded-2xl p-4 border border-white/10" data-testid={`admin-user-card-${u.id}`}>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gold/15 text-gold flex items-center justify-center text-sm font-black shrink-0">
                        {u.name?.[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="font-black truncate">
                          {u.name}
                          {isSelf && <span className="text-[10px] text-gold mr-2">(أنت)</span>}
                        </div>
                        <div className="text-xs text-zinc-400 font-mono truncate">{u.email}</div>
                      </div>
                    </div>
                    <RoleBadge role={u.role} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white/5 rounded-xl p-3">
                      <div className="text-zinc-500 text-xs mb-1">النقاط</div>
                      <div className="font-display font-black text-gold">{u.total_points || 0}</div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3">
                      <div className="text-zinc-500 text-xs mb-1">التوقعات</div>
                      <div className="font-display font-black text-white">{u.predictions_count ?? 0}</div>
                    </div>
                  </div>

                  {isFullAdmin && (
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={() => onEdit(u)}
                        data-testid={`edit-user-mobile-${u.id}`}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500/10 text-blue-400 text-sm font-bold hover:bg-blue-500/20"
                      >
                        <Edit2 className="w-4 h-4" />
                        تعديل الاسم
                      </button>

                      {u.role !== "admin" && (
                        <button
                          onClick={() => onToggleRole(u)}
                          disabled={isSelf}
                          data-testid={`toggle-role-mobile-${u.id}`}
                          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed ${
                            u.role === "supervisor"
                              ? "bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
                              : "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20"
                          }`}
                        >
                          {u.role === "supervisor" ? (
                            <>
                              <UserMinus className="w-4 h-4" /> إنزال لـ لاعب
                            </>
                          ) : (
                            <>
                              <Shield className="w-4 h-4" /> ترقية لـ مشرف
                            </>
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => onResetPassword?.(u)}
                        disabled={isSelf}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 text-amber-400 text-sm font-bold hover:bg-amber-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        تغيير كلمة المرور
                      </button>

                      <button
                        onClick={() => onDelete(u)}
                        disabled={isSelf}
                        data-testid={`delete-user-mobile-${u.id}`}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 text-red-400 text-sm font-bold hover:bg-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                        حذف المستخدم
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop users table */}
          <div className="glass-card rounded-2xl overflow-hidden hidden md:block">
            <div className="w-full overflow-x-auto"><table className="w-full min-w-[760px] text-sm">
            <thead className="bg-white/5">
              <tr className="text-right">
                <th className="p-4 font-bold">المستخدم</th>
                <th className="p-4 font-bold">البريد الإلكتروني</th>
                <th className="p-4 font-bold">الدور</th>
                <th className="p-4 font-bold">النقاط</th>
                <th className="p-4 font-bold">التوقعات</th>
                {isFullAdmin && <th className="p-4 font-bold">إجراءات</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isSelf = u.id === currentUserId;
                return (
                  <tr key={u.id} className="border-t border-white/5" data-testid={`admin-user-row-${u.id}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gold/15 text-gold flex items-center justify-center text-xs font-bold">
                          {u.name?.[0]}
                        </div>
                        <span className="font-bold">
                          {u.name}
                          {isSelf && <span className="text-[10px] text-gold mr-2">(أنت)</span>}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-zinc-300 text-xs font-mono">{u.email}</td>
                    <td className="p-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="p-4 font-display font-bold text-gold">{u.total_points || 0}</td>
                    <td className="p-4 text-zinc-300">{u.predictions_count ?? 0}</td>
                    {isFullAdmin && (
                      <td className="p-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => onEdit(u)}
                            data-testid={`edit-user-${u.id}`}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-500/10 text-blue-400 text-xs font-bold hover:bg-blue-500/20"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            تعديل الاسم
                          </button>
                          {u.role !== "admin" && (
                            <button
                              onClick={() => onToggleRole(u)}
                              disabled={isSelf}
                              data-testid={`toggle-role-${u.id}`}
                              title={isSelf ? "لا يمكنك تغيير صلاحياتك" : ""}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed ${
                                u.role === "supervisor"
                                  ? "bg-orange-500/10 text-orange-400 hover:bg-orange-500/20"
                                  : "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20"
                              }`}
                            >
                              {u.role === "supervisor" ? (
                                <>
                                  <UserMinus className="w-3.5 h-3.5" /> إنزال لـ لاعب
                                </>
                              ) : (
                                <>
                                  <Shield className="w-3.5 h-3.5" /> ترقية لـ مشرف
                                </>
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => onResetPassword?.(u)}
                            disabled={isSelf}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-amber-500/10 text-amber-400 text-xs font-bold hover:bg-amber-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                            title={isSelf ? "لا يمكنك تغيير كلمة مرور حسابك من هنا" : "تغيير كلمة المرور"}
                          >
                            تغيير كلمة المرور
                          </button>

                          <button
                            onClick={() => onDelete(u)}
                            disabled={isSelf}
                            data-testid={`delete-user-${u.id}`}
                            className="p-1.5 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                            title={isSelf ? "لا يمكن حذف حسابك الشخصي" : "حذف"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        </div>
        </>
      )}
    </div>
  );
}

function RoleBadge({ role }) {
  if (role === "admin") {
    return (
      <span className="px-2 py-0.5 rounded-md bg-gold/15 text-gold text-[10px] font-bold inline-flex items-center gap-1">
        <ShieldCheck className="w-3 h-3" /> مدير
      </span>
    );
  }
  if (role === "supervisor") {
    return (
      <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-400 text-[10px] font-bold inline-flex items-center gap-1">
        <Shield className="w-3 h-3" /> مشرف
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded-md bg-white/5 text-zinc-400 text-[10px] font-bold">
      لاعب
    </span>
  );
}


function PasswordResetModal({ user, onClose, onSaved }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [donePassword, setDonePassword] = useState("");

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }
    setPassword(pass);
    setConfirm(pass);
  };

  const copyPassword = async () => {
    const text = donePassword || password;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("تم نسخ كلمة المرور");
    } catch {
      toast.error("تعذر النسخ");
    }
  };

  const submit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف أو أكثر");
      return;
    }

    if (password !== confirm) {
      toast.error("كلمة المرور وتأكيدها غير متطابقين");
      return;
    }

    setSaving(true);
    try {
      await api.put(`/admin/users/${user.id}/password`, { new_password: password });
      setDonePassword(password);
      toast.success(`تم تغيير كلمة مرور "${user.name}" بنجاح`);
      onSaved?.();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl w-full max-w-md p-5 sm:p-6 border border-white/10">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h3 className="font-display text-2xl font-black">تغيير كلمة المرور</h3>
            <p className="text-sm text-zinc-400 mt-1">
              المستخدم: <span className="text-gold font-bold">{user.name}</span>
            </p>
            <p className="text-xs text-zinc-500 mt-1">{user.email}</p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300"
          >
            ×
          </button>
        </div>

        {donePassword ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
              <div className="font-bold text-emerald-300 mb-2">تم التغيير بنجاح</div>
              <div className="text-xs text-zinc-400 mb-2">كلمة المرور الجديدة:</div>
              <div className="font-mono text-lg bg-black/30 rounded-lg px-3 py-2 text-gold break-all">
                {donePassword}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={copyPassword}
                className="px-4 py-3 rounded-xl bg-gold text-black font-black"
              >
                نسخ كلمة المرور
              </button>
              <button
                onClick={onClose}
                className="px-4 py-3 rounded-xl bg-white/10 text-white font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">كلمة المرور الجديدة</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-gold"
                placeholder="اكتب كلمة المرور الجديدة"
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2">تأكيد كلمة المرور</label>
              <input
                type="text"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:border-gold"
                placeholder="أعد كتابة كلمة المرور"
              />
            </div>

            <button
              type="button"
              onClick={generatePassword}
              className="w-full px-4 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/15"
            >
              توليد كلمة مرور تلقائيًا
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-3 rounded-xl bg-gold text-black font-black disabled:opacity-60"
              >
                {saving ? "جاري الحفظ..." : "حفظ كلمة المرور"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 rounded-xl bg-white/10 text-white font-bold"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}


function EditUserModal({ user, onClose, onSaved }) {
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error("الاسم قصير جداً");
      return;
    }
    setSaving(true);
    try {
      await api.put(`/admin/users/${user.id}`, { name: name.trim() });
      toast.success("تم تحديث الاسم");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title={`تعديل اسم: ${user.email}`} testId="edit-user-modal">
      <form onSubmit={submit} className="space-y-4">
        <FormField label="الاسم الجديد">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="edit-user-name-input"
            autoFocus
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-gold outline-none"
          />
        </FormField>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-lg border border-white/10 text-white hover:bg-white/5">
            إلغاء
          </button>
          <button
            type="submit"
            disabled={saving}
            data-testid="submit-edit-user"
            className="flex-1 py-3 rounded-lg bg-gold text-black font-bold hover:bg-yellow-400 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            حفظ
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CreateMatchModal({ teams, onClose, onCreated }) {
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [date, setDate] = useState(todayISO());
  const [kickoff, setKickoff] = useState(defaultKickoff());
  const [stage, setStage] = useState("مرحلة المجموعات");
  const [groupName, setGroup] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!home || !away || home === away) {
      toast.error("اختر فريقين مختلفين");
      return;
    }
    setSaving(true);
    try {
      await api.post("/matches", {
        home_team: home,
        away_team: away,
        match_date: date,
        kickoff: `${kickoff}:00+03:00`,
        stage,
        group_name: groupName || null,
      });
      toast.success("تمت إضافة المباراة");
      onCreated();
      onClose();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title="إضافة مباراة جديدة" testId="create-match-modal">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <TeamSelect label="الفريق الأول" value={home} onChange={setHome} teams={teams} testId="home-team-select" />
          <TeamSelect label="الفريق الثاني" value={away} onChange={setAway} teams={teams} testId="away-team-select" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="تاريخ المباراة">
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              data-testid="match-date-input"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-gold outline-none"
            />
          </FormField>
          <FormField label="وقت الانطلاق">
            <input
              type="datetime-local"
              required
              value={kickoff}
              onChange={(e) => setKickoff(e.target.value)}
              data-testid="match-kickoff-input"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-gold outline-none"
            />
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="المرحلة">
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              data-testid="match-stage-select"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-gold outline-none"
            >
              <option>مرحلة المجموعات</option>
              <option>دور الـ32</option>
              <option>دور الـ16</option>
              <option>ربع النهائي</option>
              <option>نصف النهائي</option>
              <option>المباراة النهائية</option>
              <option>تحديد المركز الثالث</option>
            </select>
          </FormField>
          <FormField label="المجموعة (اختياري)">
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroup(e.target.value)}
              placeholder="مثل: المجموعة A"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-gold outline-none"
            />
          </FormField>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-lg border border-white/10 text-white hover:bg-white/5"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={saving}
            data-testid="submit-create-match"
            className="flex-1 py-3 rounded-lg bg-gold text-black font-bold hover:bg-yellow-400 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            إضافة
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ResultModal({ match, onClose, onSaved }) {
  const [h, setH] = useState(match.home_score ?? 0);
  const [a, setA] = useState(match.away_score ?? 0);
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/matches/${match.id}/result`, {
        home_score: Number(h),
        away_score: Number(a),
      });
      toast.success("تم حفظ النتيجة واحتساب النقاط");
      onSaved();
      onClose();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title="إدخال النتيجة النهائية" testId="result-modal">
      <form onSubmit={submit} className="space-y-5">
        <p className="text-sm text-zinc-400 text-center">
          عند الحفظ، ستُحتسب نقاط جميع توقعات المستخدمين تلقائياً.
        </p>
        <div className="flex items-center justify-center gap-4">
          <input
            type="number"
            min="0"
            max="30"
            value={h}
            onChange={(e) => setH(e.target.value)}
            data-testid="result-home-input"
            className="w-24 bg-black/40 border border-white/10 rounded-lg py-4 text-center font-display font-black text-3xl text-white focus:border-gold outline-none"
          />
          <span className="text-zinc-500 font-bold text-xl">-</span>
          <input
            type="number"
            min="0"
            max="30"
            value={a}
            onChange={(e) => setA(e.target.value)}
            data-testid="result-away-input"
            className="w-24 bg-black/40 border border-white/10 rounded-lg py-4 text-center font-display font-black text-3xl text-white focus:border-gold outline-none"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-lg border border-white/10 text-white hover:bg-white/5"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={saving}
            data-testid="submit-result"
            className="flex-1 py-3 rounded-lg bg-gold text-black font-bold hover:bg-yellow-400 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            حفظ النتيجة
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({ children, onClose, title, testId }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
      onClick={onClose}
      data-testid={testId}
    >
      <div
        className="bg-[#141414] border border-white/10 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-white/5">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function TeamSelect({ label, value, onChange, teams, testId }) {
  return (
    <FormField label={label}>
      <select
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={testId}
        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-gold outline-none"
      >
        <option value="">-- اختر --</option>
        {teams.map((t) => (
          <option key={t.code} value={t.code}>
            {t.name_ar}
          </option>
        ))}
      </select>
    </FormField>
  );
}


// ---------- Predictions Tab (Admin + Supervisor: view all members' predictions) ----------
function PredictionsTab({ matches, teams }) {
  const [matchId, setMatchId] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);

  const teamsMap = useMemo(() => {
    const m = {};
    teams.forEach((t) => (m[t.code] = t));
    return m;
  }, [teams]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = matchId
        ? `/admin/predictions?match_id=${encodeURIComponent(matchId)}`
        : `/admin/predictions`;
      const { data } = await api.get(url);
      setRows(data.items || []);
      setCount(data.count || 0);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    load();
  }, [load]);

  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) =>
      String(a.kickoff_utc || "").localeCompare(String(b.kickoff_utc || ""))
    );
  }, [matches]);

  return (
    <div data-testid="predictions-tab" className="space-y-5">
      <div className="glass-card rounded-2xl p-5 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="flex-1">
          <label className="text-xs text-zinc-400 mb-1 block">فلتر بالمباراة</label>
          <select
            data-testid="predictions-match-filter"
            value={matchId}
            onChange={(e) => setMatchId(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:border-gold outline-none"
          >
            <option value="">جميع المباريات</option>
            {sortedMatches.map((m) => {
              const h = teamsMap[m.home_team];
              const a = teamsMap[m.away_team];
              const d = m.kickoff_utc ? new Date(m.kickoff_utc).toISOString().slice(0, 10) : "";
              return (
                <option key={m.id} value={m.id}>
                  {d} — {h?.name_ar || m.home_team} ضد {a?.name_ar || m.away_team}
                </option>
              );
            })}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button
            onClick={load}
            data-testid="predictions-refresh"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-bold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> تحديث
          </button>
        </div>
        <div className="text-sm text-zinc-400 self-end md:self-center">
          <span data-testid="predictions-count" className="text-gold font-bold">{count}</span> توقع
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        {loading && rows.length === 0 ? (
          <div className="p-10 text-center text-zinc-500">
            <Loader2 className="w-6 h-6 animate-spin inline-block" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-zinc-500" data-testid="predictions-empty">
            لا توجد توقعات لعرضها.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="predictions-table">
              <thead className="bg-black/40 border-b border-white/5">
                <tr className="text-right">
                  <th className="px-4 py-3 font-bold text-zinc-400">العضو</th>
                  <th className="px-4 py-3 font-bold text-zinc-400">المباراة</th>
                  <th className="px-4 py-3 font-bold text-zinc-400">التوقع</th>
                  <th className="px-4 py-3 font-bold text-zinc-400">النتيجة</th>
                  <th className="px-4 py-3 font-bold text-zinc-400">النقاط</th>
                  <th className="px-4 py-3 font-bold text-zinc-400">تاريخ التوقع</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <PredictionRow key={r.id} row={r} teamsMap={teamsMap} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function PredictionRow({ row, teamsMap }) {
  const m = row.match || {};
  const home = teamsMap[m.home_team];
  const away = teamsMap[m.away_team];
  const finished = m.status === "finished";
  const created = row.created_at
    ? new Date(row.created_at).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" })
    : "—";

  const pointsBadge =
    row.points === 3 ? (
      <span className="px-2 py-0.5 rounded-full bg-gold text-black text-xs font-black">+3</span>
    ) : row.points === 1 ? (
      <span className="px-2 py-0.5 rounded-full bg-white/15 text-white text-xs font-black">+1</span>
    ) : row.points === 0 ? (
      <span className="px-2 py-0.5 rounded-full bg-white/5 text-zinc-500 text-xs font-bold">0</span>
    ) : (
      <span className="text-xs text-zinc-500">—</span>
    );

  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02]">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {row.user_avatar ? (
            <img src={row.user_avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
              {(row.user_name || "?").charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-bold truncate max-w-[200px]">{row.user_name || "—"}</p>
            <p className="text-[10px] text-zinc-500 truncate max-w-[200px]">{row.user_email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 text-xs">
          {home && <Flag code={home.code} size="w-5 h-3.5" />}
          <span className="font-bold">{home?.name_ar || m.home_team || "—"}</span>
          <span className="text-zinc-500">ضد</span>
          <span className="font-bold">{away?.name_ar || m.away_team || "—"}</span>
          {away && <Flag code={away.code} size="w-5 h-3.5" />}
        </div>
      </td>
      <td className="px-4 py-3 font-bold text-gold tabular-nums">
        {row.pred_home} - {row.pred_away}
      </td>
      <td className="px-4 py-3 tabular-nums">
        {finished && typeof m.home_score === "number" ? (
          <span className="font-bold">
            {m.home_score} - {m.away_score}
          </span>
        ) : (
          <span className="text-xs text-zinc-500">لم تنتهِ</span>
        )}
      </td>
      <td className="px-4 py-3">{pointsBadge}</td>
      <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap">{created}</td>
    </tr>
  );
}
