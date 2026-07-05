import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import api from "../lib/api";
import CONTENT_DEFAULTS from "../lib/contentDefaults";

const ContentContext = createContext({
  values: CONTENT_DEFAULTS,
  defaults: CONTENT_DEFAULTS,
  loading: true,
  refresh: () => {},
  t: (key, fallback) => CONTENT_DEFAULTS[key] ?? fallback ?? key,
});

export function ContentProvider({ children }) {
  const [values, setValues] = useState(CONTENT_DEFAULTS);
  const [defaults, setDefaults] = useState(CONTENT_DEFAULTS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/content");
      // Merge: bundled defaults < server defaults < server overrides
      setDefaults({ ...CONTENT_DEFAULTS, ...(data.defaults || {}) });
      setValues({ ...CONTENT_DEFAULTS, ...(data.defaults || {}), ...(data.values || {}) });
    } catch (e) {
      console.warn("[content] failed to fetch /content, using bundled defaults", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const t = useCallback(
    (key, fallback) => {
      if (values[key]) return values[key];
      if (defaults[key]) return defaults[key];
      if (CONTENT_DEFAULTS[key]) return CONTENT_DEFAULTS[key];
      return fallback ?? key;
    },
    [values, defaults]
  );

  const ctxValue = useMemo(
    () => ({ values, defaults, loading, refresh, t }),
    [values, defaults, loading, refresh, t]
  );

  return <ContentContext.Provider value={ctxValue}>{children}</ContentContext.Provider>;
}

export function useContent() {
  return useContext(ContentContext);
}
