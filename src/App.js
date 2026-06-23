import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
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
import Profile from "@/pages/Profile";
import Admin from "@/pages/Admin";
import AdminAds from "@/pages/AdminAds";

import { useEffect } from "react";
import { listenForegroundNotifications } from "@/lib/push";

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
    listenForegroundNotifications((url) => {
      if (url) navigate(url);
    });

    // 2) إشعار تم الضغط عليه من service worker
    const handler = (event) => {
      const data = event?.data;
      if (data?.type === "OPEN_PUSH_URL" && data?.url) {
        navigate(data.url);
      }
    };

    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener("message", handler);
    }

    return () => {
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener("message", handler);
      }
    };
  }, [navigate]);

  return null;
}

function App() {
  return (
    <div className="App min-h-screen bg-base text-white">
      <AuthProvider>
        <ContentProvider>
          <TeamsProvider>
            <BrowserRouter>
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
                <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute staffOnly><Layout><Admin /></Layout></ProtectedRoute>} />
                <Route path="/admin/ads" element={<ProtectedRoute staffOnly><Layout><AdminAds /></Layout></ProtectedRoute>} />
              </Routes>
            </BrowserRouter>
          </TeamsProvider>
        </ContentProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
