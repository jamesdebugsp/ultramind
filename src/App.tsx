import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/clientes" element={<Clientes />} />
          <Route path="/dashboard/servicos" element={<Servicos />} />
          <Route path="/dashboard/agendamentos" element={<Agendamentos />} />
          <Route path="/dashboard/horarios" element={<Horarios />} />
          <Route path="/dashboard/bot" element={<BotWhatsApp />} />
          <Route path="/dashboard/relatorios" element={<Relatorios />} />
          <Route path="/dashboard/pagina" element={<MinhaPagina />} />
          <Route path="/dashboard/configuracoes" element={<Configuracoes />} />
          <Route path="/agendar/:slug" element={<PublicBooking />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
