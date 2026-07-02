import "@/App.css";
import { BrowserRouter, HashRouter, Routes, Route, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";

import { AuthProvider } from "@/context/AuthContext";
import { TeamsProvider } from "@/context/TeamsContext";
import { ContentProvider } from "@/context/ContentContext";

import Header from "@/components/Header";
import AutoUpdate from "@/components/AutoUpdate";
import ClockWarning from "@/components/ClockWarning";
import ProtectedRoute from "@/components/ProtectedRoute";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Matches from "@/pages/Matches";
import UserPredictions from "@/pages/UserPredictions";
import Teams from "@/pages/Teams";
import Leaderboard from "@/pages/Leaderboard";
import Challenge from "@/pages/Challenge";
import Profile from "@/pages/Profile";
import Admin from "@/pages/Admin";
import AdminAds from "@/pages/AdminAds";

import { useEffect, useState } from "react";
import OfflineScreen from "@/components/OfflineScreen";
import { Capacitor } from "@capacitor/core";
import { listenForegroundNotifications } from "@/lib/push";
import { listenNativeNotifications } from "@/lib/nativePush";
import { isNative } from "@/lib/platform";

function Layout({ children }) {
  return (
    <>
      <Header />
      <ClockWarning />
      {children}
    </>
  );
}

function PushNavigationBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    // 1) إشعار أثناء فتح التطبيق
    (isNative ? listenNativeNotifications : listenForegroundNotifications)((url) => {
      if (url) navigate(url);
    });

    // 2) إشعار تم الضغط عليه من service worker
    const handler = (event) => {
      const data = event?.data;
      if (data?.type === "OPEN_PUSH_URL" && data?.url) {
        navigate(data.url);
      }
    };

    if (!isNative && navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener("message", handler);
    }

    return () => {
      if (!isNative && navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener("message", handler);
      }
    };
  }, [navigate]);

  return null;
}

function App() {
  const Router = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter;

  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (!online) {
    return <OfflineScreen />;
  }

  return (
    <div className="App min-h-screen bg-base text-white">
      <AuthProvider>
        <ContentProvider>
          <TeamsProvider>
            <Router>
              <PushNavigationBridge />
              <AutoUpdate />
              <Toaster position="top-center" richColors theme="dark" dir="rtl" />

              <Routes>
                <Route path="/" element={<Layout><Landing /></Layout>} />

                <Route path="/login" element={<Login />} />

                <Route path="/register" element={<Register />} />

                <Route path="/matches" element={<Layout><Matches /></Layout>} />

                <Route path="/user-predictions" element={<Layout><UserPredictions /></Layout>} />

                <Route path="/teams" element={<Layout><Teams /></Layout>} />

                <Route path="/leaderboard" element={<Layout><Leaderboard /></Layout>} />

                <Route path="/challenge" element={<Layout><Challenge /></Layout>} />

                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Profile />
                      </Layout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute staffOnly>
                      <Layout>
                        <Admin />
                      </Layout>
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/admin/ads"
                  element={
                    <ProtectedRoute staffOnly>
                      <Layout>
                        <AdminAds />
                      </Layout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Router>
          </TeamsProvider>
        </ContentProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
