import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Scissors, 
  Plus, 
  Clock, 
  DollarSign,
  MoreVertical,
  Edit,
  Trash2,
  Loader2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useServices, Service } from "@/hooks/useServices";

export default function Servicos() {
  const { services, loading, createService, updateService, deleteService } = useServices();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingServico, setEditingServico] = useState<Service | null>(null);
  const [formData, setFormData] = useState({ name: "", duration: "", price: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (editingServico) {
      await updateService(editingServico.id, { 
        name: formData.name, 
        duration: Number(formData.duration), 
        price: Number(formData.price),
        description: formData.description || null
      });
    } else {
      await createService({
        name: formData.name,
        duration: Number(formData.duration),
        price: Number(formData.price),
        description: formData.description || null,
        status: 'active'
      });
    }
    
    setFormData({ name: "", duration: "", price: "", description: "" });
    setEditingServico(null);
    setIsDialogOpen(false);
    setIsSubmitting(false);
  };

  const handleEdit = (servico: Service) => {
    setEditingServico(servico);
    setFormData({ 
      name: servico.name, 
      duration: servico.duration.toString(), 
      price: servico.price.toString(),
      description: servico.description || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteService(id);
  };

  const toggleActive = async (servico: Service) => {
    await updateService(servico.id, { 
      status: servico.status === 'active' ? 'inactive' : 'active' 
    });
  };

  const openNewDialog = () => {
    setEditingServico(null);
    setFormData({ name: "", duration: "", price: "", description: "" });
    setIsDialogOpen(true);
  };

  const activeServicos = services.filter(s => s.status === 'active');
  const totalRevenue = activeServicos.reduce((acc, s) => acc + s.price, 0);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-highlight" />
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
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
              Serviços
            </h1>
            <p className="text-muted-foreground">
              Gerencie os serviços oferecidos
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" onClick={openNewDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Serviço
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingServico ? "Editar Serviço" : "Novo Serviço"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do serviço</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Corte Feminino"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Input
                    id="description"
                    placeholder="Breve descrição do serviço"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duração (min)</Label>
                    <Input
                      id="duration"
                      type="number"
                      placeholder="60"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Preço (R$)</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="80"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="hero" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingServico ? "Salvar" : "Adicionar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <Card variant="elevated" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-highlight/10 flex items-center justify-center">
                <Scissors className="w-5 h-5 text-highlight" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{services.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </Card>
          <Card variant="elevated" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Scissors className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{activeServicos.length}</p>
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
                <p className="text-2xl font-bold text-foreground">
                  {Math.round(activeServicos.reduce((acc, s) => acc + s.duration, 0) / activeServicos.length || 0)}min
                </p>
                <p className="text-sm text-muted-foreground">Média Duração</p>
              </div>
            </div>
          </Card>
          <Card variant="elevated" className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  R${Math.round(totalRevenue / activeServicos.length || 0)}
                </p>
                <p className="text-sm text-muted-foreground">Ticket Médio</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Services Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {services.length === 0 ? (
            <Card variant="elevated" className="col-span-full p-8 text-center">
              <Scissors className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Nenhum serviço cadastrado</p>
              <Button variant="hero" onClick={openNewDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar primeiro serviço
              </Button>
            </Card>
          ) : (
            services.map((servico) => (
              <Card 
                key={servico.id} 
                variant="elevated" 
                className={`p-4 ${servico.status !== 'active' ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg gradient-accent flex items-center justify-center">
                    <Scissors className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(servico)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleActive(servico)}>
                        {servico.status === 'active' ? "Desativar" : "Ativar"}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(servico.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <h3 className="font-semibold text-foreground mb-2">{servico.name}</h3>
                {servico.description && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{servico.description}</p>
                )}
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {servico.duration}min
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    R${servico.price}
                  </div>
                </div>
                
                <Badge variant={servico.status === 'active' ? "highlight" : "secondary"}>
                  {servico.status === 'active' ? "Ativo" : "Inativo"}
                </Badge>
              </Card>
            ))
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
