import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { LoginForm } from "@/components/auth/LoginForm";
import { PsychologistLayout } from "@/layouts/PsychologistLayout";
import { ChildLayout } from "@/layouts/ChildLayout";
import { PsychologistDashboard } from "@/components/psychologist/Dashboard";
import { PatientsView } from "@/components/psychologist/Patients";
import { SessionsView } from "@/components/psychologist/Sessions";
import { AnalysisTEAView } from "@/components/psychologist/AnalysisTEA";
import { BiometricView } from "@/components/psychologist/BiometricView";
import { SettingsView } from "@/components/psychologist/Settings";
import { EmotionalWorld } from "@/components/child/EmotionalWorld";
import { AudioProvider } from "@/components/shared/AudioSystem";
import NotFound from "./pages/NotFound";
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

const App = () => {
  const { isAuthenticated, user, theme, accessToken } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored token on app load and restore authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('access_token');
      if (storedToken && !accessToken) {
        // If we have a token in localStorage but not in state, we need to restore it
        // The persist middleware should handle this, but let's ensure it's set
        console.log('Token found in localStorage, restoring authentication state');

        // For mock authentication, we don't need to validate the token
        // The persisted state should be restored automatically by Zustand persist
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [accessToken]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AudioProvider>
          <Toaster />
          <Sonner />
          
          {!isAuthenticated || !user ? (
            <LoginForm />
          ) : (
            <div className={theme === 'psychologist' ? 'psychologist-theme' : 'child-theme'}>
              <BrowserRouter>
                {user.role === 'psychologist' ? (
                  <PsychologistLayout>
                    <Routes>
                      <Route path="/" element={<PsychologistDashboard />} />
                      <Route path="/dashboard" element={<PsychologistDashboard />} />
                      <Route path="/patients" element={<PatientsView />} />
                      <Route path="/sessions" element={<SessionsView />} />
                      <Route path="/analysis" element={<AnalysisTEAView />} />
                      <Route path="/biometric" element={<BiometricView />} />
                      <Route path="/settings" element={<SettingsView />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </PsychologistLayout>
                ) : (
                  <ChildLayout>
                    <Routes>
                      <Route path="/" element={<EmotionalWorld />} />
                      <Route path="/emotions" element={<EmotionalWorld />} />
                      {/* ADD ALL CHILD ROUTES HERE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </ChildLayout>
                )}
              </BrowserRouter>
            </div>
          )}
        </AudioProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
