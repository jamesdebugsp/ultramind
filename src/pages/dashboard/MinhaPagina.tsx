import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  QrCode, 
  Copy, 
  ExternalLink, 
  CheckCircle2,
  Share2,
  Download,
  Instagram,
  MessageSquare,
  Loader2,
  Link as LinkIcon,
  Pencil
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function MinhaPagina() {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [slugInput, setSlugInput] = useState("");
  const [slugError, setSlugError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { profile, loading, updateProfile, refetch } = useProfile();

  const currentSlug = useMemo(() => {
    if (profile?.slug) return profile.slug;
    if (profile?.business_name) return generateSlug(profile.business_name);
    return "";
  }, [profile]);

  useEffect(() => {
    setSlugInput(currentSlug);
  }, [currentSlug]);

  const baseUrl = window.location.origin;
  const bookingUrl = `${baseUrl}/agendar/${currentSlug}`;
  const previewUrl = `/agendar/${currentSlug}`;

  const validateSlug = async (slug: string): Promise<boolean> => {
    if (!slug.trim()) {
      setSlugError("O link não pode estar vazio");
      return false;
    }

    if (slug.length < 3) {
      setSlugError("Mínimo de 3 caracteres");
      return false;
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      setSlugError("Use apenas letras, números e hífens");
      return false;
    }

    // Check if slug is already in use by another user
    const { data } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('slug', slug)
      .maybeSingle();

    if (data && data.user_id !== profile?.user_id) {
      setSlugError("Este link já está em uso");
      return false;
    }

    setSlugError("");
    return true;
  };

  const handleSlugChange = (value: string) => {
    const formatted = generateSlug(value);
    setSlugInput(formatted);
    setSlugError("");
  };

  const saveSlug = async () => {
    const isValid = await validateSlug(slugInput);
    if (!isValid) return;

    setIsSaving(true);
    try {
      await updateProfile({ slug: slugInput });
      setIsEditing(false);
      await refetch();
    } catch (error) {
      console.error('Error saving slug:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    toast({
      title: "Link copiado!",
      description: "Compartilhe com seus clientes",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const message = encodeURIComponent(`Agende seu horário conosco! 📅\n\n${bookingUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${message}`, "_blank");
  };

  const shareInstagram = () => {
    toast({
      title: "Compartilhar no Instagram",
      description: "Copie o link e cole na sua bio ou stories!",
    });
    copyLink();
  };

  const downloadQRCode = () => {
    const svg = document.getElementById("qr-code");
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = "qrcode-agendamento.png";
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
    }
    toast({
      title: "QR Code baixado!",
      description: "Use em materiais impressos",
    });
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
          className="mb-8"
        >
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Minha Página de Agendamento
          </h1>
          <p className="text-muted-foreground">
            Compartilhe sua página e receba agendamentos automaticamente
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Link Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="highlight" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Seu link de agendamento</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="w-4 h-4 mr-1" />
                  Personalizar
                </Button>
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="slug">Link personalizado</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {baseUrl}/agendar/
                      </span>
                      <Input
                        id="slug"
                        value={slugInput}
                        onChange={(e) => handleSlugChange(e.target.value)}
                        placeholder="seu-negocio"
                        className="flex-1"
                      />
                    </div>
                    {slugError && (
                      <p className="text-sm text-destructive">{slugError}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Use apenas letras minúsculas, números e hífens
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="highlight" 
                      onClick={saveSlug}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      Salvar
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsEditing(false);
                        setSlugInput(currentSlug);
                        setSlugError("");
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-background/50 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <LinkIcon className="w-4 h-4" />
                      <span className="text-sm">Link público</span>
                    </div>
                    <p className="font-mono text-lg text-foreground break-all">{bookingUrl}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <Button variant="highlight" onClick={copyLink}>
                      {copied ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      {copied ? "Copiado!" : "Copiar Link"}
                    </Button>
                    <Button variant="highlight-outline" asChild>
                      <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Visualizar
                      </a>
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </motion.div>

          {/* QR Code Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="elevated" className="p-6">
              <h3 className="font-semibold text-foreground mb-4">QR Code</h3>
              
              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-xl mb-4">
                  <QRCodeSVG
                    id="qr-code"
                    value={bookingUrl}
                    size={180}
                    level="H"
                    includeMargin
                    fgColor="#0A0F1F"
                  />
                </div>
                
                <Button variant="outline" onClick={downloadQRCode}>
                  <Download className="w-4 h-4 mr-2" />
                  Baixar QR Code
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Share Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <Card variant="elevated" className="p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-highlight" />
              Compartilhar
            </h3>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2"
                onClick={shareWhatsApp}
              >
                <MessageSquare className="w-6 h-6 text-emerald-600" />
                <span>WhatsApp</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2"
                onClick={shareInstagram}
              >
                <Instagram className="w-6 h-6 text-pink-600" />
                <span>Instagram</span>
              </Button>
              
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2"
                onClick={copyLink}
              >
                <Copy className="w-6 h-6 text-highlight" />
                <span>Copiar Link</span>
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <Card variant="elevated" className="p-6 bg-highlight/5 border-highlight/20">
            <h3 className="font-semibold text-foreground mb-3">💡 Dicas para aumentar agendamentos</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Adicione o link na bio do seu Instagram</li>
              <li>• Imprima o QR Code e deixe no balcão</li>
              <li>• Envie o link no WhatsApp para clientes antigos</li>
              <li>• Compartilhe nos stories regularmente</li>
              <li>• Inclua em cartões de visita e panfletos</li>
            </ul>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}