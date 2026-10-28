import "@/App.css";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { Capacitor } from "@capacitor/core";

// Pages
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import TextPractice from "./pages/TextPractice";
import VoicePractice from "./pages/VoicePractice";
import VideoCall from "./pages/VideoCall";
import Settings from "./pages/Settings";
import { PricingPage } from "./pages/PricingPage";
import { FeaturesPage } from "./pages/FeaturesPage";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import HowToSay from "./pages/HowToSay";

// Components
import { DashboardLayout } from "./components/DashboardLayout";

// Context
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// ─── Android Hardware Back Button Handler ───
const BackButtonHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listener = null;

    const setup = async () => {
      try {
        const { App } = await import("@capacitor/app");
        listener = await App.addListener("backButton", ({ canGoBack }) => {
          // Check if sidebar is open
          const mobileOverlay = document.getElementById("mobile-overlay");
          if (mobileOverlay) {
            mobileOverlay.click(); // This closes the sidebar
            return;
          }

          // If we're at the root/landing page, minimize the app instead of closing it
          if (!canGoBack || location.pathname === "/" || location.pathname === "/dashboard") {
            App.minimizeApp();
          } else {
            navigate(-1);
          }
        });
      } catch (err) {
        console.warn("[BackButton] Failed to setup:", err);
      }
    };

    setup();

    return () => {
      if (listener) listener.remove();
    };
  }, [navigate, location.pathname]);

  return null;
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Cargando...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return children;
};

// App Routes Component
function AppRoutes() {
  return (
    <BrowserRouter>
      <BackButtonHandler />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        
        {/* Protected routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/practice/text" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <TextPractice />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/practice/voice" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <VoicePractice />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/practice/video" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <VideoCall />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/how-to-say" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <HowToSay />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// Main App Component
function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <div className="App">
          <Toaster position="top-center" richColors />
          <AppRoutes />
        </div>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
