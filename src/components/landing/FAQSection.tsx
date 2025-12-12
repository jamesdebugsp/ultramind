import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Como funciona o período de teste grátis?",
    answer: "Você tem 7 dias para testar todas as funcionalidades do plano escolhido, sem precisar inserir cartão de crédito. Após o período, você pode escolher continuar com o plano pago ou cancelar sem custo.",
  },
  {
    question: "Preciso de conhecimento técnico para usar?",
    answer: "Não! O AgendePro foi desenvolvido para ser simples e intuitivo. Em menos de 3 minutos você configura seu negócio e já pode começar a receber agendamentos.",
  },
  {
    question: "Como meus clientes agendam?",
    answer: "Você recebe um link exclusivo (ex: agende.ultramind.com/seu-negocio) que pode compartilhar no WhatsApp, Instagram, cartões de visita ou qualquer lugar. Seus clientes acessam e escolhem serviço, profissional e horário disponível.",
  },
  {
    question: "O bot de WhatsApp é automático mesmo?",
    answer: "Sim! Assim que um cliente agenda, ele e você recebem confirmação automática no WhatsApp. Também enviamos lembretes 24h e 1h antes do horário, reduzindo drasticamente as faltas.",
  },
  {
    question: "Posso personalizar as mensagens do bot?",
    answer: "Claro! No painel você pode editar todos os textos das mensagens de confirmação, lembrete, reagendamento e cancelamento para deixar com a cara do seu negócio.",
  },
  {
    question: "Funciona para qualquer tipo de negócio?",
    answer: "Sim! O AgendePro é ideal para salões de beleza, barbearias, manicures, pet shops, clínicas, estúdios de tatuagem, consultórios e qualquer negócio que trabalhe com agendamentos.",
  },
  {
    question: "Como faço para mudar de plano?",
    answer: "Você pode fazer upgrade ou downgrade a qualquer momento pelo painel. A cobrança será ajustada proporcionalmente.",
  },
  {
    question: "Qual a forma de pagamento?",
    answer: "Aceitamos cartão de crédito, PIX e boleto bancário. A cobrança é mensal, mas oferecemos desconto para pagamento anual.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-24 bg-background">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Perguntas Frequentes
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tire suas dúvidas sobre o AgendePro
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border rounded-xl px-6 data-[state=open]:shadow-card transition-shadow"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:text-highlight py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
