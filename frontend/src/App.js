import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

// Pages
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import TextPractice from "./pages/TextPractice";
import VoicePractice from "./pages/VoicePractice";
import VideoCall from "./pages/VideoCall";
import Settings from "./pages/Settings";

// Components
import { DashboardLayout } from "./components/DashboardLayout";

// Context
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

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
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        
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
