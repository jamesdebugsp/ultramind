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
  Calendar,
  MessageSquare,
  DollarSign,
  RefreshCw,
  Settings2,
  Building2,
  User,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useAdminData, AdminUser } from "@/hooks/useAdminData";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSuperAdmin, loading: rolesLoading } = useUserRoles();
  const { users, loading: usersLoading, updateUserSubscription, updateUserRole, refetch } = useAdminData();
  
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    maxAppointments: 50,
    whatsappEnabled: false,
    remindersEnabled: false,
  });
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [whatsappActiveUsers, setWhatsappActiveUsers] = useState(0);

  // Fetch additional stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: appointmentsCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true });
        
        setTotalAppointments(appointmentsCount || 0);

        const { data: subsWithWhatsapp } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('whatsapp_enabled', true);
        
        setWhatsappActiveUsers(subsWithWhatsapp?.length || 0);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    if (isSuperAdmin) {
      fetchStats();
    }
  }, [isSuperAdmin, users]);

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
        return <Badge className="bg-muted text-muted-foreground">Inativo</Badge>;
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
        return <Badge className="bg-highlight/10 text-highlight border-highlight/20"><Zap className="w-3 h-3 mr-1" />Pro</Badge>;
      case "basic":
        return <Badge variant="outline">Básico</Badge>;
      default:
        return <Badge variant="secondary">{plan}</Badge>;
    }
  };

  const handleEditUser = (user: AdminUser) => {
    setEditingUser(user);
    setEditForm({
      maxAppointments: 50,
      whatsappEnabled: false,
      remindersEnabled: false,
    });
    setEditDialogOpen(true);
  };

  const handleSaveUserLimits = async () => {
    if (!editingUser) return;

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          max_appointments: editForm.maxAppointments,
          whatsapp_enabled: editForm.whatsappEnabled,
          reminders_enabled: editForm.remindersEnabled,
        })
        .eq('user_id', editingUser.user_id);

      if (error) throw error;

      toast({
        title: 'Limites atualizados',
        description: 'Os limites do usuário foram salvos com sucesso.',
      });

      setEditDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleResetTrial = async (userId: string) => {
    try {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'trial',
          trial_ends_at: trialEndsAt.toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Trial resetado',
        description: 'O período de trial foi reiniciado por 14 dias.',
      });

      refetch();
    } catch (error: any) {
      toast({
        title: 'Erro ao resetar trial',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleMarkAsPaid = async (userId: string) => {
    try {
      const currentPeriodEnd = new Date();
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: currentPeriodEnd.toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Pagamento registrado',
        description: 'Usuário marcado como pago e ativado.',
      });

      refetch();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'inactive' })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Usuário suspenso',
        description: 'Acesso suspenso por inadimplência.',
        variant: 'destructive',
      });

      refetch();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleReactivateUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'active' })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Usuário reativado',
        description: 'Acesso restaurado com sucesso.',
      });

      refetch();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.subscription?.status === "active").length,
    trial: users.filter(u => u.subscription?.status === "trial").length,
    cancelled: users.filter(u => u.subscription?.status === "cancelled").length,
    inactive: users.filter(u => u.subscription?.status === "inactive").length,
  };

  if (rolesLoading || usersLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-highlight" />
        </div>
      </DashboardLayout>
    );
  }

  if (!isSuperAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full min-h-[60vh] gap-4">
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
      <div className="p-4 lg:p-8 space-y-8">
        {/* Owner Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-r from-highlight/10 via-primary/5 to-background border-highlight/20">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-highlight/20 flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-highlight" />
                  </div>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                      UltraMind Solutions
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">James Rodrigo</span>
                      <Separator orientation="vertical" className="h-4" />
                      <Badge className="bg-highlight/10 text-highlight border-highlight/20">
                        <Crown className="w-3 h-3 mr-1" />
                        Owner / Super Admin
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button onClick={() => refetch()} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar Dados
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-6 gap-4"
        >
          <Card variant="elevated" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-highlight/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-highlight" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Usuários</p>
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
                <p className="text-xs text-muted-foreground">Ativos</p>
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
                <p className="text-xs text-muted-foreground">Trial</p>
              </div>
            </div>
          </Card>
          
          <Card variant="elevated" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Ban className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.cancelled}</p>
                <p className="text-xs text-muted-foreground">Cancelados</p>
              </div>
            </div>
          </Card>

          <Card variant="elevated" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalAppointments}</p>
                <p className="text-xs text-muted-foreground">Agendamentos</p>
              </div>
            </div>
          </Card>

          <Card variant="elevated" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{whatsappActiveUsers}</p>
                <p className="text-xs text-muted-foreground">WhatsApp Ativo</p>
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
                Gestão de Usuários
              </CardTitle>
              <CardDescription>
                Gerencie todos os usuários, planos e acessos do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Alterar Plano</TableHead>
                      <TableHead>Alterar Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Nenhum usuário cadastrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div>
                              <p className="font-semibold">{user.business_name || "—"}</p>
                              <p className="text-xs text-muted-foreground">{user.owner_name || "Sem nome"}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{user.email || "—"}</TableCell>
                          <TableCell>
                            {user.subscription?.plan ? getPlanBadge(user.subscription.plan) : <Badge variant="secondary">Sem plano</Badge>}
                          </TableCell>
                          <TableCell>
                            {user.subscription?.status ? getStatusBadge(user.subscription.status) : <Badge variant="secondary">—</Badge>}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={user.subscription?.plan || 'basic'}
                              onValueChange={(value: 'basic' | 'pro' | 'premium') => updateUserSubscription(user.user_id, { plan: value })}
                            >
                              <SelectTrigger className="w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="basic">Básico</SelectItem>
                                <SelectItem value="pro">Pro</SelectItem>
                                <SelectItem value="premium">Premium</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={user.subscription?.status || 'trial'}
                              onValueChange={(value: 'active' | 'trial' | 'inactive' | 'cancelled') => updateUserSubscription(user.user_id, { status: value })}
                            >
                              <SelectTrigger className="w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Ativo</SelectItem>
                                <SelectItem value="trial">Trial</SelectItem>
                                <SelectItem value="inactive">Inativo</SelectItem>
                                <SelectItem value="cancelled">Cancelado</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 flex-wrap">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                                title="Editar limites"
                              >
                                <Settings2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResetTrial(user.user_id)}
                                title="Resetar trial"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsPaid(user.user_id)}
                                className="text-emerald-600"
                                title="Marcar como pago"
                              >
                                <DollarSign className="w-4 h-4" />
                              </Button>
                              {user.subscription?.status === 'inactive' ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleReactivateUser(user.user_id)}
                                  className="text-highlight"
                                  title="Reativar"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSuspendUser(user.user_id)}
                                  className="text-destructive"
                                  title="Suspender"
                                >
                                  <AlertTriangle className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Edit User Limits Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Limites do Usuário</DialogTitle>
              <DialogDescription>
                {editingUser?.business_name || editingUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="maxAppointments">Máximo de Agendamentos</Label>
                <Input
                  id="maxAppointments"
                  type="number"
                  value={editForm.maxAppointments}
                  onChange={(e) => setEditForm({ ...editForm, maxAppointments: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>WhatsApp Ativado</Label>
                  <p className="text-xs text-muted-foreground">Permite envio de mensagens automáticas</p>
                </div>
                <Switch
                  checked={editForm.whatsappEnabled}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, whatsappEnabled: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Lembretes Ativados</Label>
                  <p className="text-xs text-muted-foreground">Permite envio de lembretes automáticos</p>
                </div>
                <Switch
                  checked={editForm.remindersEnabled}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, remindersEnabled: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveUserLimits}>
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
