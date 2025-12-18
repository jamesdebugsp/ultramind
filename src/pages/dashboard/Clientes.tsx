import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  MessageSquare,
  Loader2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClients, Client } from "@/hooks/useClients";

export default function Clientes() {
  const { clients, loading, createClient, updateClient, deleteClient } = useClients();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Client | null>(null);
  const [formData, setFormData] = useState({ name: "", whatsapp: "", email: "", notes: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredClientes = clients.filter(cliente =>
    cliente.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cliente.whatsapp && cliente.whatsapp.includes(searchTerm)) ||
    (cliente.email && cliente.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (editingCliente) {
      await updateClient(editingCliente.id, { 
        name: formData.name, 
        whatsapp: formData.whatsapp || null, 
        email: formData.email || null,
        notes: formData.notes || null
      });
    } else {
      await createClient({
        name: formData.name,
        whatsapp: formData.whatsapp || null,
        email: formData.email || null,
        notes: formData.notes || null
      });
    }
    
    setFormData({ name: "", whatsapp: "", email: "", notes: "" });
    setEditingCliente(null);
    setIsDialogOpen(false);
    setIsSubmitting(false);
  };

  const handleEdit = (cliente: Client) => {
    setEditingCliente(cliente);
    setFormData({ 
      name: cliente.name, 
      whatsapp: cliente.whatsapp || "", 
      email: cliente.email || "",
      notes: cliente.notes || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteClient(id);
  };

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    window.open(`https://api.whatsapp.com/send?phone=55${cleanPhone}`, "_blank");
  };

  const openNewClientDialog = () => {
    setEditingCliente(null);
    setFormData({ name: "", whatsapp: "", email: "", notes: "" });
    setIsDialogOpen(true);
  };

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
              Clientes
            </h1>
            <p className="text-muted-foreground">
              Gerencie sua base de clientes
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" onClick={openNewClientDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent aria-describedby="client-desc">
              <DialogHeader>
                <DialogTitle>
                  {editingCliente ? "Editar Cliente" : "Novo Cliente"}
                </DialogTitle>
              </DialogHeader>
              <DialogDescription id="client-desc">
                Preencha os campos para adicionar ou editar o cliente.
              </DialogDescription>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <Input
                    id="name"
                    placeholder="Nome do cliente"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    placeholder="(11) 99999-9999"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    placeholder="Informações adicionais sobre o cliente"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="hero" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingCliente ? "Salvar" : "Adicionar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Search, Stats e Lista de clientes */}
        {/* O resto do código permanece igual */}
      </div>
    </DashboardLayout>
  );
}
