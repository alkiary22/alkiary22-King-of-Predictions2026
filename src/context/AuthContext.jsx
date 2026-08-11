import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { apiErrorMessage } from "../lib/api";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { Capacitor } from "@capacitor/core";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem("mt_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch (e) {
      // لا نحذف التوكن عند فشل مؤقت من السيرفر
      console.error("fetchMe failed:", e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("mt_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const { data } = await api.post("/auth/register", { name, email, password });
    localStorage.setItem("mt_token", data.token);
    setUser(data.user);
    return data.user;
  };

  const loginWithGoogle = async () => {
    let idToken = null;

    if (Capacitor.isNativePlatform()) {
      // Native Android:
      // احصل على Google ID Token مباشرة من Capacitor Firebase.
      const result = await FirebaseAuthentication.signInWithGoogle();

      idToken =
        result?.credential?.idToken ||
        result?.user?.idToken ||
        result?.idToken ||
        null;

      // بعض إصدارات Firebase Authentication قد لا تعيد
      // الـ token في النتيجة، لذلك نجرب Firebase Web Auth كاحتياط.
      if (!idToken) {
        const currentUser = auth.currentUser;

        if (currentUser) {
          idToken = await currentUser.getIdToken(true);
        }
      }
    } else {
      // Web فقط: لا نغيّر مسار تسجيل الويب.
      const result = await signInWithPopup(auth, googleProvider);
      idToken = await result.user.getIdToken(true);
    }

    if (!idToken) {
      console.error("GOOGLE DEBUG: No ID token received");
      throw new Error("لم يتم استلام Google ID Token");
    }

    console.log(
      "GOOGLE DEBUG: ID token received, length:",
      String(idToken).length
    );

    console.log(
      "GOOGLE DEBUG: API base:",
      api.defaults?.baseURL
    );

    try {
      const { data } = await api.post("/auth/google", {
        id_token: idToken,
      });

      console.log(
        "GOOGLE DEBUG: Backend response:",
        data
      );

      localStorage.setItem("mt_token", data.token);
      setUser(data.user);

      return data.user;
    } catch (error) {
      console.error(
        "GOOGLE DEBUG: Backend request failed:",
        {
          message: error?.message,
          code: error?.code,
          status: error?.response?.status,
          data: error?.response?.data,
          url: error?.config?.url,
          baseURL: error?.config?.baseURL,
        }
      );

      throw error;
    }

    localStorage.setItem("mt_token", data.token);
    setUser(data.user);

    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("mt_token");
    setUser(null);
  };

  const refreshUser = fetchMe;

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, register, logout, refreshUser, apiErrorMessage }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
