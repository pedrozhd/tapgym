import { TestimonialsSection } from "@/components/ui/testimonials-with-marquee";

/** Depoimentos mockados da LP — trocar por reais quando existirem. */
const TESTIMONIALS = [
  {
    author: {
      name: "Marina Costa",
      handle: "@marinatreina",
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    },
    text: "Parecia que eu estagnava toda semana. Com o histórico de carga no bolso, finalmente vejo o próximo degrau sem abrir planilha.",
  },
  {
    author: {
      name: "Rafael Mendes",
      handle: "@rafalift",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    },
    text: "O atalho na tela de início mudou meu treino. Registro a série entre um exercício e outro, suado, sem desbloquear o celular inteiro.",
  },
  {
    author: {
      name: "Julia Nakamura",
      handle: "@julianakfit",
      avatar:
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    },
    text: "Toques grandes, sem firula. Em 10 segundos anoto carga, reps e se a série foi boa — e o gráfico não me deixa mentir.",
  },
  {
    author: {
      name: "Thiago Alves",
      handle: "@thiagoforce",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    },
    text: "Troquei o caderninho sujo de suor pelo TapGym. Volume semanal e progressão por exercício no mesmo lugar.",
  },
  {
    author: {
      name: "Camila Duarte",
      handle: "@camilapuxa",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    },
    text: "Monto a divisão do meu jeito. Sem PPL forçado, sem modelo engessado — só o que eu faço na academia de verdade.",
  },
  {
    author: {
      name: "Bruno Ferreira",
      handle: "@brunopress",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    },
    text: "R$ 9,90 e zero distração. Sem feed, sem like — só carga, reps e a certeza de que estou avançando.",
  },
];

export function LandingTestimonials() {
  return (
    <TestimonialsSection
      title="Quem registra, evolui."
      description="Depoimentos de quem largou a planilha e passou a acompanhar a progressão série a série."
      testimonials={TESTIMONIALS}
    />
  );
}
