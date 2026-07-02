import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("mt_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function apiErrorMessage(err) {
  const detail = err?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).join(" • ");
  }
  if (detail && typeof detail.msg === "string") return detail.msg;
  return err?.message || "حدث خطأ غير متوقع";
}

export default api;

/* ===== طبقة تسريع التبويبات (SWR-lite) =====
 * GET المتكرر خلال 30 ثانية → يرجع فورًا من الكاش (0ms)
 * + تحديث بالخلفية للفتحة القادمة
 * sessionStorage → يمسح عند إغلاق التطبيق (لا بيانات قديمة بين الجلسات)
 */
const __rawGet = api.get.bind(api);
const __TTL = 30000; // 30 ثانية

api.get = (url, config) => {
  // لا تكاشي الطلبات التي فيها إعدادات خاصة
  if (config && (config.params || config.responseType)) return __rawGet(url, config);

  const tk = (localStorage.getItem("mt_token") || "").slice(-10);
  const key = `agc:${tk}:${url}`;

  try {
    const hit = JSON.parse(sessionStorage.getItem(key) || "null");
    if (hit && Date.now() - hit.t < __TTL) {
      // تحديث صامت بالخلفية
      __rawGet(url, config)
        .then((r) => {
          try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d: r.data })); } catch {}
        })
        .catch(() => {});
      return Promise.resolve({ data: hit.d, status: 200, headers: {}, cached: true });
    }
  } catch {}

  return __rawGet(url, config).then((r) => {
    try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d: r.data })); } catch {}
    return r;
  });
};
