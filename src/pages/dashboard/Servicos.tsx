import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Scissors, 
  Plus, 
  Clock, 
  DollarSign,
  MoreVertical,
  Edit,
  Trash2
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
import { useToast } from "@/hooks/use-toast";

interface Servico {
  id: string;
  name: string;
  duration: number;
  price: number;
  active: boolean;
}

const initialServicos: Servico[] = [
  { id: "1", name: "Corte Feminino", duration: 60, price: 80, active: true },
  { id: "2", name: "Corte Masculino", duration: 30, price: 45, active: true },
  { id: "3", name: "Escova", duration: 45, price: 50, active: true },
  { id: "4", name: "Coloração", duration: 120, price: 180, active: true },
  { id: "5", name: "Manicure", duration: 45, price: 35, active: true },
  { id: "6", name: "Pedicure", duration: 60, price: 45, active: true },
  { id: "7", name: "Barba", duration: 30, price: 30, active: true },
  { id: "8", name: "Hidratação", duration: 60, price: 70, active: false },
];

export default function Servicos() {
  const [servicos, setServicos] = useState<Servico[]>(initialServicos);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingServico, setEditingServico] = useState<Servico | null>(null);
  const [formData, setFormData] = useState({ name: "", duration: "", price: "" });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingServico) {
      setServicos(servicos.map(s => 
        s.id === editingServico.id 
          ? { ...s, name: formData.name, duration: Number(formData.duration), price: Number(formData.price) }
          : s
      ));
      toast({ title: "Serviço atualizado!", description: "As alterações foram salvas." });
    } else {
      const newServico: Servico = {
        id: Date.now().toString(),
        name: formData.name,
        duration: Number(formData.duration),
        price: Number(formData.price),
        active: true
      };
      setServicos([...servicos, newServico]);
      toast({ title: "Serviço adicionado!", description: "Novo serviço cadastrado com sucesso." });
    }
    
    setFormData({ name: "", duration: "", price: "" });
    setEditingServico(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (servico: Servico) => {
    setEditingServico(servico);
    setFormData({ 
      name: servico.name, 
      duration: servico.duration.toString(), 
      price: servico.price.toString() 
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setServicos(servicos.filter(s => s.id !== id));
    toast({ title: "Serviço removido", description: "O serviço foi excluído." });
  };

  const toggleActive = (id: string) => {
    setServicos(servicos.map(s => 
      s.id === id ? { ...s, active: !s.active } : s
    ));
  };

  const openNewDialog = () => {
    setEditingServico(null);
    setFormData({ name: "", duration: "", price: "" });
    setIsDialogOpen(true);
  };

  const activeServicos = servicos.filter(s => s.active);
  const totalRevenue = activeServicos.reduce((acc, s) => acc + s.price, 0);

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
                  <Button type="submit" variant="hero" className="flex-1">
                    {editingServico ? "Salvar" : "Adicionar"}
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
                <p className="text-2xl font-bold text-foreground">{servicos.length}</p>
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
          {servicos.map((servico) => (
            <Card 
              key={servico.id} 
              variant="elevated" 
              className={`p-4 ${!servico.active ? 'opacity-60' : ''}`}
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
                    <DropdownMenuItem onClick={() => toggleActive(servico.id)}>
                      {servico.active ? "Desativar" : "Ativar"}
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
              
              <Badge variant={servico.active ? "highlight" : "secondary"}>
                {servico.active ? "Ativo" : "Inativo"}
              </Badge>
            </Card>
          ))}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
