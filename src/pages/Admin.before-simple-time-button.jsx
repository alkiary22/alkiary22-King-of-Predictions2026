import { useEffect, useState, useCallback, useMemo } from "react";
import api, { apiErrorMessage } from "../lib/api";
import Flag from "../components/Flag";
import { Plus, Trash2, Edit2, CheckCircle2, ShieldCheck, Loader2, X, RefreshCw, Download, Users, Shield, UserMinus, FileText, Eye } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ContentEditor from "../components/ContentEditor";
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

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [t, m, ls, us] = await Promise.all([
        api.get("/teams"),
        api.get("/matches"),
        api.get("/admin/last-sync").catch(() => ({ data: null })),
        api.get("/admin/users").catch(() => ({ data: [] })),
      ]);
      setTeams(t.data);
      setMatches(m.data);
      setLastSync(ls.data);
      setUsers(us.data);
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" data-testid="admin-page">
      <div className="flex items-start justify-between flex-col md:flex-row gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-gold" />
            <p className="text-xs font-bold text-gold uppercase tracking-[0.2em]">لوحة الإدارة</p>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-black mb-3">إدارة التطبيق</h1>
          <p className="text-zinc-400">أدِر المباريات، النتائج، والمستخدمين من مكان واحد.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/5" data-testid="admin-tabs">
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
        />
      )}

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

function MatchesTab({ loading, matches, teams, lastSync, onSync, syncing, onImportNew, onSeed, onAdd, onResult, onDelete, isFullAdmin }) {
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

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-zinc-400">
          لم تُضف أي مباراة بعد.
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
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
              {matches.map((m) => {
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
          </table>
        </div>
      )}
    </>
  );
}

function UsersTab({ users, currentUserId, isFullAdmin, onEdit, onDelete, onToggleRole }) {
  const [search, setSearch] = useState("");
  const filtered = users.filter(
    (u) =>
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

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
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث بالاسم أو البريد..."
          data-testid="users-search"
          className="w-full md:w-72 bg-surface border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-gold outline-none text-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-zinc-400">
          {users.length === 0 ? "لا يوجد مستخدمون مسجلون بعد" : "لا توجد نتائج مطابقة"}
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
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
          </table>
        </div>
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
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm font-bold"
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
