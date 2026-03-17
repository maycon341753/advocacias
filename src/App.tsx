import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import ClientesPage from "./pages/ClientesPage";
import ProcessosPage from "./pages/ProcessosPage";
import AgendaPage from "./pages/AgendaPage";
import DocumentosPage from "./pages/DocumentosPage";
import FinanceiroPage from "./pages/FinanceiroPage";
import UsuariosPage from "./pages/UsuariosPage";
import ConfiguracoesPage from "./pages/ConfiguracoesPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import PlanosPage from "./pages/admin/PlanosPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Office routes (protected) */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/clientes" element={<ProtectedRoute><ClientesPage /></ProtectedRoute>} />
            <Route path="/processos" element={<ProtectedRoute><ProcessosPage /></ProtectedRoute>} />
            <Route path="/agenda" element={<ProtectedRoute><AgendaPage /></ProtectedRoute>} />
            <Route path="/documentos" element={<ProtectedRoute><DocumentosPage /></ProtectedRoute>} />
            <Route path="/financeiro" element={<ProtectedRoute><FinanceiroPage /></ProtectedRoute>} />
            <Route path="/usuarios" element={<ProtectedRoute><UsuariosPage /></ProtectedRoute>} />
            <Route path="/configuracoes" element={<ProtectedRoute><ConfiguracoesPage /></ProtectedRoute>} />

            {/* Super Admin routes */}
            <Route path="/admin" element={<ProtectedRoute requiredRole="platform_admin"><Navigate to="/admin/dashboard" replace /></ProtectedRoute>} />
            <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="platform_admin"><SuperAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/Dashboard" element={<ProtectedRoute requiredRole="platform_admin"><Navigate to="/admin/dashboard" replace /></ProtectedRoute>} />
            <Route path="/admin/escritorios" element={<ProtectedRoute requiredRole="platform_admin"><SuperAdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/planos" element={<ProtectedRoute requiredRole="platform_admin"><PlanosPage /></ProtectedRoute>} />
            <Route path="/admin/usuarios" element={<ProtectedRoute requiredRole="platform_admin"><UsuariosPage /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
