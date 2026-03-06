import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ClientesPage from "./pages/ClientesPage";
import ProcessosPage from "./pages/ProcessosPage";
import AgendaPage from "./pages/AgendaPage";
import DocumentosPage from "./pages/DocumentosPage";
import FinanceiroPage from "./pages/FinanceiroPage";
import UsuariosPage from "./pages/UsuariosPage";
import ConfiguracoesPage from "./pages/ConfiguracoesPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/processos" element={<ProcessosPage />} />
          <Route path="/agenda" element={<AgendaPage />} />
          <Route path="/documentos" element={<DocumentosPage />} />
          <Route path="/financeiro" element={<FinanceiroPage />} />
          <Route path="/usuarios" element={<UsuariosPage />} />
          <Route path="/configuracoes" element={<ConfiguracoesPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
