import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

import { AuthProvider } from "@/context/AuthContext";
import { TeamsProvider } from "@/context/TeamsContext";
import { ContentProvider } from "@/context/ContentContext";

import AdminHeader from "@/components/AdminHeader";
import ProtectedRoute from "@/components/ProtectedRoute";

import Login from "@/pages/Login";
import Admin from "@/pages/Admin";
import AdminAds from "@/pages/AdminAds";

function Layout({ children }) {
  return (
    <>
      <AdminHeader />
      {children}
    </>
  );
}

function App() {
  return (
    <div className="App min-h-screen bg-base text-white">
      <AuthProvider>
        <ContentProvider>
          <TeamsProvider>
            <BrowserRouter>
              <Toaster position="top-center" richColors theme="dark" dir="rtl" />

              <Routes>
                <Route path="/" element={<Navigate to="/admin" replace />} />
                <Route path="/login" element={<Login />} />

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

                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </BrowserRouter>
          </TeamsProvider>
        </ContentProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
