import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";

import { AuthProvider } from "@/context/AuthContext";
import { TeamsProvider } from "@/context/TeamsContext";
import { ContentProvider } from "@/context/ContentContext";

import Header from "@/components/Header";
import ClockWarning from "@/components/ClockWarning";
import ProtectedRoute from "@/components/ProtectedRoute";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Matches from "@/pages/Matches";
import Live from "@/pages/Live";
import Teams from "@/pages/Teams";
import Leaderboard from "@/pages/Leaderboard";
import Profile from "@/pages/Profile";
import Admin from "@/pages/Admin";

function Layout({ children }) {
  return (
    <>
      <Header />
      <ClockWarning />
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
                <Route path="/" element={<Layout><Landing /></Layout>} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/matches" element={<Layout><Matches /></Layout>} />
                <Route path="/live" element={<Layout><Live /></Layout>} />
                <Route path="/teams" element={<Layout><Teams /></Layout>} />
                <Route path="/leaderboard" element={<Layout><Leaderboard /></Layout>} />
                <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute staffOnly><Layout><Admin /></Layout></ProtectedRoute>} />
              </Routes>
            </BrowserRouter>
          </TeamsProvider>
        </ContentProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
