import axios from "axios";
import { Capacitor } from "@capacitor/core";

// Production backend (Render)
const PROD_BACKEND_URL = "https://kingbackend-apk.onrender.com";

function isPrivateHost(host) {
  if (!host) return false;
  if (host === "localhost" || host === "127.0.0.1") return true;
  // 10.x.x.x
  if (/^10\.\d+\.\d+\.\d+$/.test(host)) return true;
  // 192.168.x.x
  if (/^192\.168\.\d+\.\d+$/.test(host)) return true;
  // 172.16.x.x - 172.31.x.x
  const m = host.match(/^172\.(\d+)\.\d+\.\d+$/);
  if (m) {
    const n = Number(m[1]);
    if (n >= 16 && n <= 31) return true;
  }
  return false;
}

const host =
  typeof window !== "undefined" && window.location ? window.location.hostname : "localhost";

// لو الواجهة تعمل محليًا/على IP داخلي، خلّ الباكند المحلي على نفس الجهاز/الشبكة
const DEV_BACKEND_URL = `http://${host === "localhost" ? "127.0.0.1" : host}:8000`;

// داخل تطبيق Capacitor لا نستخدم localhost إطلاقًا.
// WebView في Android يستخدم hostname = localhost، لكن الـBackend الحقيقي على Render.
const isNativeApp = Capacitor.isNativePlatform();

const BACKEND_URL =
  isNativeApp
    ? PROD_BACKEND_URL
    : (isPrivateHost(host) ? DEV_BACKEND_URL : PROD_BACKEND_URL);

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
    return detail
      .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
      .join(" • ");
  }
  if (detail && typeof detail.msg === "string") return detail.msg;
  return err?.message || "حدث خطأ غير متوقع";
}



// ========================================
// 🚀 CACHE تلقائي لجميع طلبات GET
// ========================================
const __apiCache = new Map();
const __apiCacheTime = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // دقيقتين

// Interceptor للطلبات: ارجع من الـ Cache إذا موجود
api.interceptors.request.use((config) => {
  if (config.method === "get" && !config.__skipCache) {
    const key = config.url + JSON.stringify(config.params || {});
    const cached = __apiCache.get(key);
    const time = __apiCacheTime.get(key);
    
    if (cached && time && Date.now() - time < CACHE_DURATION) {
      // ارجع البيانات المخزنة فوراً
      config.adapter = () => Promise.resolve({
        data: cached,
        status: 200,
        statusText: "OK (cached)",
        headers: {},
        config,
        request: {}
      });
    }
  }
  return config;
});

// Interceptor للردود: خزن البيانات
api.interceptors.response.use(
  (response) => {
    if (response.config.method === "get" && !response.config.__skipCache) {
      const key = response.config.url + JSON.stringify(response.config.params || {});
      if (response.statusText !== "OK (cached)") {
        __apiCache.set(key, response.data);
        __apiCacheTime.set(key, Date.now());
      }
    }
    return response;
  },
  (error) => Promise.reject(error)
);

// دوال مساعدة
export const clearApiCache = (url) => {
  if (url) {
    for (const key of __apiCache.keys()) {
      if (key.startsWith(url)) {
        __apiCache.delete(key);
        __apiCacheTime.delete(key);
      }
    }
  } else {
    __apiCache.clear();
    __apiCacheTime.clear();
  }
};

// إبطال Cache توقعات المستخدم بعد الحفظ مباشرة.
// يمسح Cache الخاصة بطبقة Axios وطبقة sessionStorage/SWR.
export const clearPredictionCache = () => {
  clearApiCache("/predictions/me");

  try {
    const tokenTail = (localStorage.getItem("mt_token") || "").slice(-10);
    sessionStorage.removeItem(`agc:${tokenTail}:/predictions/me`);
  } catch (_) {}
};

// Prefetch جميع التبويبات المهمة
export const prefetchAll = () => {
  const endpoints = [
    "/matches",
    "/leaderboard?period=weekly",
    "/leaderboard?period=monthly",
    "/leaderboard?period=all",
    "/competitions",
    "/teams",
    "/predictions/me",
  ];
  endpoints.forEach(ep => {
    api.get(ep).catch(() => {});
  });
};

// شغّل Prefetch تلقائياً بعد ثانية من التحميل
if (typeof window !== "undefined") {
  setTimeout(() => prefetchAll(), 1000);
}

api.clearPredictionCache = clearPredictionCache;

export default api;

/* ===== طبقة تسريع التبويبات (SWR-lite) ===== */
const __rawGet = api.get.bind(api);
const __TTL = 30000; // 30 ثانية

api.get = (url, config) => {
  if (config && (config.params || config.responseType)) return __rawGet(url, config);

  const tk = (localStorage.getItem("mt_token") || "").slice(-10);
  const key = `agc:${tk}:${url}`;

  try {
    const hit = JSON.parse(sessionStorage.getItem(key) || "null");
    if (hit && Date.now() - hit.t < __TTL) {
      __rawGet(url, config)
        .then((r) => {
          try {
            sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d: r.data }));
          } catch {}
        })
        .catch(() => {});
      return Promise.resolve({ data: hit.d, status: 200, headers: {}, cached: true });
    }
  } catch {}

  return __rawGet(url, config).then((r) => {
    try {
      sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d: r.data }));
    } catch {}
    return r;
  });
};

window.addEventListener("unhandledrejection", (e) => {
  console.log("UNHANDLED PROMISE:", e.reason);
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    console.log("=========== AXIOS ===========");
    console.log("baseURL:", err?.config?.baseURL);
    console.log("url:", err?.config?.url);
    console.log("message:", err.message);
    console.log("code:", err.code);
    console.log("status:", err.response?.status);
    console.log("data:", err.response?.data);
    console.log("=============================");
    return Promise.reject(err);
  }
);
