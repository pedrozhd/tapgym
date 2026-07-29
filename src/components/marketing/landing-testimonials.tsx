import { TestimonialsSection } from "@/components/ui/testimonials-with-marquee";

/** Exemplos ilustrativos — não são depoimentos reais até haver autorização. */
const TESTIMONIALS = [
  {
    author: { name: "Marina Costa", handle: "@marinatreina" },
    text: "Parecia que eu estagnava toda semana. Com o histórico de carga no bolso, finalmente vejo o próximo degrau sem abrir planilha.",
  },
  {
    author: { name: "Rafael Mendes", handle: "@rafalift" },
    text: "O atalho na tela de início mudou meu treino. Registro a série entre um exercício e outro, suado, sem desbloquear o celular inteiro.",
  },
  {
    author: { name: "Julia Nakamura", handle: "@julianakfit" },
    text: "Toques grandes, sem firula. Em 10 segundos anoto carga, reps e se a série foi boa — e o gráfico não me deixa mentir.",
  },
  {
    author: { name: "Thiago Alves", handle: "@thiagoforce" },
    text: "Troquei o caderninho sujo de suor pelo TapGym. Volume semanal e progressão por exercício no mesmo lugar.",
  },
  {
    author: { name: "Camila Duarte", handle: "@camilapuxa" },
    text: "Monto a divisão do meu jeito. Sem PPL forçado, sem modelo engessado — só o que eu faço na academia de verdade.",
  },
  {
    author: { name: "Bruno Ferreira", handle: "@brunopress" },
    text: "R$ 9,90 e zero distração. Sem feed, sem like — só carga, reps e a certeza de que estou avançando.",
  },
];

export function LandingTestimonials() {
  return (
    <TestimonialsSection
      title="Quem registra, evolui."
      description="Exemplos do tipo de progresso que o TapGym acompanha — depoimentos reais entram aqui com autorização."
      testimonials={TESTIMONIALS}
    />
  );
}
