import { useState, useEffect } from "react";
import api from "../lib/api";

// Cache عالمي في الذاكرة
const globalCache = window.__appCache || (window.__appCache = {});
const cacheTime = window.__appCacheTime || (window.__appCacheTime = {});

const CACHE_DURATION = 2 * 60 * 1000; // دقيقتين

// جلب البيانات مع Cache
export const prefetchData = async (endpoint) => {
  try {
    const { data } = await api.get(endpoint);
    globalCache[endpoint] = data;
    cacheTime[endpoint] = Date.now();
    return data;
  } catch (e) {
    console.warn("Prefetch failed:", endpoint, e?.message);
    return null;
  }
};

// Hook للاستخدام: يعرض القديم فوراً + يحدّث في الخلفية
export const useCachedData = (endpoint, options = {}) => {
  const { enabled = true, refreshInterval = 0 } = options;
  const [data, setData] = useState(() => globalCache[endpoint] || null);
  const [loading, setLoading] = useState(!globalCache[endpoint]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !endpoint) return;

    let mounted = true;

    const fetchData = async (silent = false) => {
      if (!silent && !globalCache[endpoint]) setLoading(true);
      try {
        const { data: fresh } = await api.get(endpoint);
        if (!mounted) return;
        globalCache[endpoint] = fresh;
        cacheTime[endpoint] = Date.now();
        setData(fresh);
        setError(null);
      } catch (e) {
        if (mounted) setError(e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // إذا في cache، اعرضه فوراً وحدّث بصمت
    if (globalCache[endpoint]) {
      setData(globalCache[endpoint]);
      setLoading(false);
      // حدّث بصمت إذا انتهت مدة الـ cache
      const age = Date.now() - (cacheTime[endpoint] || 0);
      if (age > CACHE_DURATION) fetchData(true);
    } else {
      fetchData(false);
    }

    // تحديث دوري (اختياري)
    let interval;
    if (refreshInterval > 0) {
      interval = setInterval(() => fetchData(true), refreshInterval);
    }

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
    };
  }, [endpoint, enabled, refreshInterval]);

  const refetch = async () => {
    const { data: fresh } = await api.get(endpoint);
    globalCache[endpoint] = fresh;
    cacheTime[endpoint] = Date.now();
    setData(fresh);
    return fresh;
  };

  return { data, loading, error, refetch };
};

// جلب كل التبويبات مسبقاً
export const prefetchAllTabs = () => {
  const endpoints = [
    "/matches",
    "/leaderboard?period=weekly",
    "/leaderboard?period=monthly",
    "/leaderboard?period=all",
    "/competitions",
    "/teams",
  ];
  endpoints.forEach((ep) => prefetchData(ep));
};

// مسح الـ Cache
export const clearCache = (endpoint) => {
  if (endpoint) {
    delete globalCache[endpoint];
    delete cacheTime[endpoint];
  } else {
    Object.keys(globalCache).forEach((k) => delete globalCache[k]);
    Object.keys(cacheTime).forEach((k) => delete cacheTime[k]);
  }
};
