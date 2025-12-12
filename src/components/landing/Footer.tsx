import { Link } from "react-router-dom";
import { Calendar, Instagram, Mail, Phone, MapPin } from "lucide-react";

const footerLinks = {
  produto: [
    { label: "Funcionalidades", href: "#funcionalidades" },
    { label: "Planos", href: "#planos" },
    { label: "Como funciona", href: "#como-funciona" },
    { label: "FAQ", href: "#faq" },
  ],
  empresa: [
    { label: "Sobre nós", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Carreiras", href: "#" },
    { label: "Contato", href: "#" },
  ],
  legal: [
    { label: "Termos de Uso", href: "#" },
    { label: "Política de Privacidade", href: "#" },
    { label: "Cookies", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-highlight flex items-center justify-center">
                <Calendar className="w-5 h-5 text-highlight-foreground" />
              </div>
              <div>
                <span className="font-bold text-lg">AgendePro</span>
                <p className="text-xs text-primary-foreground/60">by UltraMind Solutions</p>
              </div>
            </Link>
            <p className="text-sm text-primary-foreground/70 mb-6 max-w-sm">
              Sistema completo de agendamentos para transformar WhatsApp e Instagram em lucro para o seu negócio.
            </p>
            <div className="space-y-2 text-sm text-primary-foreground/70">
              <a href="mailto:contato@ultramind.com" className="flex items-center gap-2 hover:text-highlight transition-colors">
                <Mail className="w-4 h-4" />
                contato@ultramind.com
              </a>
              <a href="tel:+5511999999999" className="flex items-center gap-2 hover:text-highlight transition-colors">
                <Phone className="w-4 h-4" />
                (11) 99999-9999
              </a>
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                São Paulo, Brasil
              </p>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold mb-4">Produto</h4>
            <ul className="space-y-3">
              {footerLinks.produto.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-primary-foreground/70 hover:text-highlight transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Empresa</h4>
            <ul className="space-y-3">
              {footerLinks.empresa.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-primary-foreground/70 hover:text-highlight transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-primary-foreground/70 hover:text-highlight transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-primary-foreground/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-primary-foreground/60">
            © {new Date().getFullYear()} UltraMind Solutions. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://instagram.com/ultramind"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-highlight transition-colors"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://api.whatsapp.com/send?phone=5511999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-highlight transition-colors"
            >
              <Phone className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
