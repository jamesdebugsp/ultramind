import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  Crown,
  CheckCircle,
  Clock,
  Ban,
  Loader2,
  Shield,
  Bot,
  MessageSquare,
  Zap,
  Gift,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useAdminData, AdminUser } from "@/hooks/useAdminData";

export default function AdminPanel() {
  const navigate = useNavigate();
  const { isSuperAdmin, loading: rolesLoading } = useUserRoles();
  const { 
    users, 
    loading: usersLoading, 
    updateUserSubscription, 
    updateUserRole,
    toggleBotOverride,
    grantBotTrial,
    revokeBotTrial,
    grantExtraCredits,
    resetUserCredits,
    refetch,
  } = useAdminData();
  
  const [trialDialog, setTrialDialog] = useState<{ open: boolean; user: AdminUser | null }>({ 
    open: false, 
    user: null 
  });
  const [creditsDialog, setCreditsDialog] = useState<{ open: boolean; user: AdminUser | null }>({ 
    open: false, 
    user: null 
  });
  const [trialDays, setTrialDays] = useState(7);
  const [creditsAmount, setCreditsAmount] = useState(100);

  // Redirect if not super admin
  useEffect(() => {
    if (!rolesLoading && !isSuperAdmin) {
      navigate("/dashboard");
    }
  }, [rolesLoading, isSuperAdmin, navigate]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Ativo</Badge>;
      case "trial":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Trial</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inativo</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "premium":
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20"><Crown className="w-3 h-3 mr-1" />Premium</Badge>;
      case "pro":
        return <Badge className="bg-highlight/10 text-highlight border-highlight/20">Pro</Badge>;
      case "basic":
        return <Badge variant="outline">Básico</Badge>;
      default:
        return <Badge variant="secondary">{plan}</Badge>;
    }
  };

  const getBotStatus = (user: AdminUser) => {
    const sub = user.subscription;
    if (!sub) return { active: false, label: "Sem plano", color: "text-muted-foreground" };

    const hasWhatsapp = !!user.whatsapp;
    const planAllows = sub.plan === "pro" || sub.plan === "premium";
    const isActive = sub.status === "active" || sub.status === "trial";
    
    // Check credits
    const availableCredits = (sub.monthly_credits + sub.extra_credits) - sub.credits_used;
    const hasCredits = availableCredits > 0;
    
    // Check trial
    const trialActive = sub.whatsapp_bot_trial_until && new Date(sub.whatsapp_bot_trial_until) > new Date();
    
    // Check override
    if (sub.whatsapp_bot_override !== null) {
      if (sub.whatsapp_bot_override) {
        return { 
          active: hasWhatsapp && isActive && hasCredits, 
          label: hasCredits ? "Forçado ON" : "Override ON (sem créditos)", 
          color: hasCredits ? "text-emerald-600" : "text-amber-600",
          isOverride: true,
        };
      } else {
        return { 
          active: false, 
          label: "Forçado OFF", 
          color: "text-destructive",
          isOverride: true,
        };
      }
    }

    // Check trial
    if (trialActive) {
      const trialEnd = new Date(sub.whatsapp_bot_trial_until!);
      const daysLeft = Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return { 
        active: hasWhatsapp && isActive && hasCredits, 
        label: `Trial (${daysLeft}d)`, 
        color: "text-amber-600",
        isTrial: true,
      };
    }

    // Check plan rules
    if (!planAllows) {
      return { active: false, label: "Plano básico", color: "text-muted-foreground" };
    }

    if (!hasWhatsapp) {
      return { active: false, label: "Sem WhatsApp", color: "text-amber-600" };
    }

    if (!hasCredits) {
      return { active: false, label: "Sem créditos", color: "text-destructive" };
    }

    if (!isActive) {
      return { active: false, label: "Assinatura inativa", color: "text-destructive" };
    }

    return { 
      active: sub.whatsapp_bot_enabled, 
      label: sub.whatsapp_bot_enabled ? "Ativo" : "Desativado", 
      color: sub.whatsapp_bot_enabled ? "text-emerald-600" : "text-muted-foreground",
    };
  };

  const getCreditsInfo = (user: AdminUser) => {
    const sub = user.subscription;
    if (!sub) return { available: 0, used: 0, total: 0, extra: 0 };
    
    const total = sub.monthly_credits + sub.extra_credits;
    const available = Math.max(0, total - sub.credits_used);
    
    return {
      available,
      used: sub.credits_used,
      total,
      extra: sub.extra_credits,
      monthly: sub.monthly_credits,
    };
  };

  const handleBotToggle = async (user: AdminUser, currentlyOn: boolean) => {
    if (user.subscription?.whatsapp_bot_override !== null) {
      await toggleBotOverride(user.user_id, !currentlyOn);
    } else {
      await toggleBotOverride(user.user_id, !currentlyOn);
    }
  };

  const handleClearOverride = async (userId: string) => {
    await toggleBotOverride(userId, null);
  };

  const handleGrantTrial = async () => {
    if (trialDialog.user) {
      await grantBotTrial(trialDialog.user.user_id, trialDays);
      setTrialDialog({ open: false, user: null });
    }
  };

  const handleGrantCredits = async () => {
    if (creditsDialog.user && creditsAmount > 0) {
      await grantExtraCredits(creditsDialog.user.user_id, creditsAmount);
      setCreditsDialog({ open: false, user: null });
      setCreditsAmount(100);
    }
  };

  // Calculate stats
  const totalCreditsUsed = users.reduce((acc, u) => acc + (u.subscription?.credits_used || 0), 0);
  const stats = {
    total: users.length,
    active: users.filter(u => u.subscription?.status === "active").length,
    trial: users.filter(u => u.subscription?.status === "trial").length,
    inactive: users.filter(u => u.subscription?.status === "inactive" || u.subscription?.status === "cancelled").length,
    botActive: users.filter(u => getBotStatus(u).active).length,
    totalCreditsUsed,
  };

  if (rolesLoading || usersLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-highlight" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <Shield className="w-16 h-16 text-destructive" />
          <h1 className="text-2xl font-bold text-foreground">Acesso Negado</h1>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
          <Button onClick={() => navigate("/dashboard")}>Voltar ao Dashboard</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                  Painel Administrativo
                </h1>
                <p className="text-muted-foreground">
                  Gerencie usuários, créditos e controle do bot WhatsApp
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8"
        >
          <Card variant="elevated" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-highlight/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-highlight" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </Card>
          <Card variant="elevated" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Ativos</p>
              </div>
            </div>
          </Card>
          <Card variant="elevated" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.trial}</p>
                <p className="text-sm text-muted-foreground">Trial</p>
              </div>
            </div>
          </Card>
          <Card variant="elevated" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Ban className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.inactive}</p>
                <p className="text-sm text-muted-foreground">Inativos</p>
              </div>
            </div>
          </Card>
          <Card variant="elevated" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-highlight/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-highlight" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.botActive}</p>
                <p className="text-sm text-muted-foreground">Bot Ativo</p>
              </div>
            </div>
          </Card>
          <Card variant="elevated" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalCreditsUsed}</p>
                <p className="text-sm text-muted-foreground">Créditos Usados</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Usuários Cadastrados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>WhatsApp</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-4 h-4" />
                          Créditos
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          <Bot className="w-4 h-4" />
                          Bot
                        </div>
                      </TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const botStatus = getBotStatus(user);
                      const credits = getCreditsInfo(user);
                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.business_name || "—"}</p>
                              <p className="text-xs text-muted-foreground">{user.owner_name || "—"}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {user.whatsapp ? (
                              <span className="text-emerald-600 flex items-center gap-1 text-sm">
                                <MessageSquare className="w-3 h-3" />
                                {user.whatsapp}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.subscription?.plan ? getPlanBadge(user.subscription.plan) : <Badge variant="secondary">Sem plano</Badge>}
                          </TableCell>
                          <TableCell>
                            {user.subscription?.status ? getStatusBadge(user.subscription.status) : <Badge variant="secondary">—</Badge>}
                          </TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex flex-col">
                                    <span className={`font-semibold ${credits.available === 0 ? 'text-destructive' : credits.available <= 50 ? 'text-amber-600' : 'text-foreground'}`}>
                                      {credits.available}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      {credits.used} usados
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Mensal: {credits.monthly}</p>
                                  <p>Extra: {credits.extra}</p>
                                  <p>Usado: {credits.used}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-2">
                                    <Switch
                                      checked={botStatus.active}
                                      onCheckedChange={() => handleBotToggle(user, botStatus.active)}
                                      className="data-[state=checked]:bg-emerald-500"
                                    />
                                    <span className={`text-xs ${botStatus.color}`}>
                                      {botStatus.label}
                                    </span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Toggle para forçar ON/OFF do bot</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 flex-wrap">
                              {/* Grant Credits */}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setCreditsDialog({ open: true, user })}
                                      className="h-7 px-2 text-xs"
                                    >
                                      <Gift className="w-3 h-3 mr-1" />
                                      Créditos
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Conceder créditos extras
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              {/* Clear Override */}
                              {user.subscription?.whatsapp_bot_override !== null && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleClearOverride(user.user_id)}
                                  className="h-7 px-2 text-xs"
                                >
                                  Limpar
                                </Button>
                              )}

                              {/* Grant Trial */}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setTrialDialog({ open: true, user })}
                                      className="h-7 px-2 text-xs"
                                    >
                                      <Zap className="w-3 h-3 mr-1" />
                                      Trial
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Conceder período de teste
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              {/* Plan/Status Selects */}
                              <Select
                                value={user.subscription?.plan || 'basic'}
                                onValueChange={(value: 'basic' | 'pro' | 'premium') => updateUserSubscription(user.user_id, { plan: value })}
                              >
                                <SelectTrigger className="w-20 h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="basic">Básico</SelectItem>
                                  <SelectItem value="pro">Pro</SelectItem>
                                  <SelectItem value="premium">Premium</SelectItem>
                                </SelectContent>
                              </Select>
                              <Select
                                value={user.subscription?.status || 'trial'}
                                onValueChange={(value: 'active' | 'trial' | 'inactive' | 'cancelled') => updateUserSubscription(user.user_id, { status: value })}
                              >
                                <SelectTrigger className="w-20 h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">Ativo</SelectItem>
                                  <SelectItem value="trial">Trial</SelectItem>
                                  <SelectItem value="inactive">Inativo</SelectItem>
                                  <SelectItem value="cancelled">Cancelado</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Trial Dialog */}
        <Dialog open={trialDialog.open} onOpenChange={(open) => setTrialDialog({ open, user: open ? trialDialog.user : null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-highlight" />
                Conceder Trial do Bot
              </DialogTitle>
              <DialogDescription>
                Liberar acesso temporário ao bot WhatsApp para{" "}
                <strong>{trialDialog.user?.business_name || trialDialog.user?.owner_name}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium">Duração do trial (dias)</label>
              <Select value={String(trialDays)} onValueChange={(v) => setTrialDays(Number(v))}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 dias</SelectItem>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="14">14 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTrialDialog({ open: false, user: null })}>
                Cancelar
              </Button>
              <Button onClick={handleGrantTrial}>
                <Zap className="w-4 h-4 mr-2" />
                Conceder Trial
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Credits Dialog */}
        <Dialog open={creditsDialog.open} onOpenChange={(open) => setCreditsDialog({ open, user: open ? creditsDialog.user : null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-highlight" />
                Conceder Créditos Extras
              </DialogTitle>
              <DialogDescription>
                Adicionar créditos extras para{" "}
                <strong>{creditsDialog.user?.business_name || creditsDialog.user?.owner_name}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Créditos atuais</label>
                <p className="text-muted-foreground">
                  {creditsDialog.user && getCreditsInfo(creditsDialog.user).available} disponíveis
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Quantidade a adicionar</label>
                <Input
                  type="number"
                  value={creditsAmount}
                  onChange={(e) => setCreditsAmount(parseInt(e.target.value) || 0)}
                  min={1}
                  className="mt-2"
                />
              </div>
              <div className="flex gap-2">
                {[50, 100, 300, 600].map((amount) => (
                  <Button
                    key={amount}
                    variant={creditsAmount === amount ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCreditsAmount(amount)}
                  >
                    {amount}
                  </Button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreditsDialog({ open: false, user: null })}>
                Cancelar
              </Button>
              <Button onClick={handleGrantCredits} disabled={creditsAmount <= 0}>
                <Gift className="w-4 h-4 mr-2" />
                Conceder {creditsAmount} Créditos
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}