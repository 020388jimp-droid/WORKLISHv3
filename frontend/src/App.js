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

// Context
import { LanguageProvider } from "./contexts/LanguageContext";

// Auth guard
import { getToken } from "./lib/utils";

const ProtectedRoute = ({ children }) => {
  if (!getToken()) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

function App() {
  return (
    <div className="App">
      <Toaster position="top-center" richColors />
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
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/practice/text" 
            element={
              <ProtectedRoute>
                <TextPractice />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/practice/voice" 
            element={
              <ProtectedRoute>
                <VoicePractice />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/practice/video" 
            element={
              <ProtectedRoute>
                <VideoCall />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } 
          />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
