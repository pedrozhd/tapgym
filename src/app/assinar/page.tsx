import { Button } from "@/components/ui/button";
import { PLANO } from "@/lib/pricing";

export default function AssinarPage() {
  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-[430px] flex-col justify-center bg-background px-6 text-foreground">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">TapGym</h1>
        <p className="mt-2 text-muted-foreground">Assine para continuar sua progressão.</p>
      </div>

      <div className="shadow-soft-elevated rounded-2xl bg-card p-6 text-center">
        <p className="text-[13px] text-muted-foreground">Plano {PLANO.nome.toLowerCase()}</p>
        <p className="mt-1 text-4xl font-extrabold tracking-tight">{PLANO.preco}</p>
        <p className="text-[13px] text-muted-foreground">{PLANO.periodo}</p>

        <ul className="mt-5 flex flex-col gap-2 text-left text-[14px]">
          {PLANO.beneficios.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-primary" aria-hidden="true">✓</span>
              {item}
            </li>
          ))}
        </ul>

        <form action="/api/stripe/checkout" method="POST" className="mt-6">
          <Button type="submit" className="h-12 w-full rounded-xl text-[15px] font-bold">
            Assinar
          </Button>
        </form>
      </div>
    </div>
  );
}
