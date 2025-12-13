import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PrivateRoute } from "@/components/PrivateRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import PublicBooking from "./pages/PublicBooking";
import NotFound from "./pages/NotFound";

// Dashboard Pages
import Clientes from "./pages/dashboard/Clientes";
import Servicos from "./pages/dashboard/Servicos";
import Agendamentos from "./pages/dashboard/Agendamentos";
import Horarios from "./pages/dashboard/Horarios";
import BotWhatsApp from "./pages/dashboard/BotWhatsApp";
import Relatorios from "./pages/dashboard/Relatorios";
import MinhaPagina from "./pages/dashboard/MinhaPagina";
import Configuracoes from "./pages/dashboard/Configuracoes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/agendar/:slug" element={<PublicBooking />} />
            
            {/* Protected Routes */}
            <Route path="/onboarding" element={
              <PrivateRoute>
                <Onboarding />
              </PrivateRoute>
            } />
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            <Route path="/dashboard/clientes" element={
              <PrivateRoute>
                <Clientes />
              </PrivateRoute>
            } />
            <Route path="/dashboard/servicos" element={
              <PrivateRoute>
                <Servicos />
              </PrivateRoute>
            } />
            <Route path="/dashboard/agendamentos" element={
              <PrivateRoute>
                <Agendamentos />
              </PrivateRoute>
            } />
            <Route path="/dashboard/horarios" element={
              <PrivateRoute>
                <Horarios />
              </PrivateRoute>
            } />
            <Route path="/dashboard/bot" element={
              <PrivateRoute>
                <BotWhatsApp />
              </PrivateRoute>
            } />
            <Route path="/dashboard/relatorios" element={
              <PrivateRoute>
                <Relatorios />
              </PrivateRoute>
            } />
            <Route path="/dashboard/pagina" element={
              <PrivateRoute>
                <MinhaPagina />
              </PrivateRoute>
            } />
            <Route path="/dashboard/configuracoes" element={
              <PrivateRoute>
                <Configuracoes />
              </PrivateRoute>
            } />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
