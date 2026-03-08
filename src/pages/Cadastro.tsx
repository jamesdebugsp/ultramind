import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function Cadastro() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signUp, user, loading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!formData.name.trim()) {
      toast({ title: "Erro", description: "Preencha seu nome", variant: "destructive" });
      return;
    }

    if (!formData.email.trim()) {
      toast({ title: "Erro", description: "Preencha seu email", variant: "destructive" });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem", variant: "destructive" });
      return;
    }

    if (formData.password.length < 6) {
      toast({ title: "Erro", description: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    console.log("[Cadastro] Iniciando signup para:", formData.email);

    try {
      const { error } = await signUp(formData.email, formData.password, {
        name: formData.name,
        phone: formData.phone,
      });

      if (error) {
        console.error("[Cadastro] Erro no signup:", error.message);
        let errorMessage = "Erro ao criar conta. Tente novamente.";
        
        if (error.message.includes("User already registered")) {
          errorMessage = "Este email já está cadastrado. Tente fazer login.";
        } else if (error.message.includes("Password")) {
          errorMessage = "A senha deve ter pelo menos 6 caracteres.";
        } else if (error.message.includes("Invalid email")) {
          errorMessage = "Por favor, insira um email válido.";
        } else if (error.message.includes("Signup is disabled")) {
          errorMessage = "Cadastro temporariamente desabilitado. Tente novamente mais tarde.";
        } else if (error.message.includes("rate limit") || error.message.includes("429")) {
          errorMessage = "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
        } else if (error.message.includes("network") || error.message.includes("fetch")) {
          errorMessage = "Erro de conexão. Verifique sua internet e tente novamente.";
        }
        
        toast({ title: "Erro no cadastro", description: errorMessage, variant: "destructive" });
        return;
      }

      console.log("[Cadastro] Signup bem-sucedido para:", formData.email);
      toast({
        title: "Conta criada com sucesso! 🎉",
        description: "Vamos configurar seu estabelecimento...",
      });
      navigate("/onboarding");
    } catch (err: any) {
      console.error("[Cadastro] Erro inesperado:", err);
      toast({
        title: "Erro inesperado",
        description: "Falha ao criar conta. Verifique sua conexão e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show nothing while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-highlight border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <img 
            src="/lovable-uploads/bcdc5c69-c93a-473f-9c5f-4e5af7b0e9f5.png" 
            alt="UltraMind Solutions" 
            className="h-12 w-auto"
          />
        </Link>

        <Card variant="elevated" className="p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">Criar sua conta</h1>
            <p className="text-muted-foreground">Comece seu teste grátis de 7 dias</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Seu nome</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="João Silva"
                  value={formData.name}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">WhatsApp</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="flex items-start gap-2">
              <input type="checkbox" className="mt-1 rounded border-border" required />
              <span className="text-sm text-muted-foreground">
                Concordo com os{" "}
                <a href="#" className="text-highlight hover:underline">
                  Termos de Uso
                </a>{" "}
                e{" "}
                <a href="#" className="text-highlight hover:underline">
                  Política de Privacidade
                </a>
              </span>
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? "Criando conta..." : "Criar conta grátis"}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Já tem uma conta?{" "}
              <Link to="/login" className="text-highlight font-semibold hover:underline">
                Entrar
              </Link>
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
