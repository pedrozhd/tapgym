import { LoginForm } from "@/components/auth/login-form";

/**
 * `?modo=criar` abre a tela já no cadastro. Os CTAs da LP ("Assinar", "Criar
 * conta") apontam pra lá. Sem isso o usuário clicava em "Criar conta" e caía
 * numa tela de login, com o cadastro escondido atrás de um toggle.
 *
 * Lido no server (searchParams é Promise nesta versão do Next) em vez de
 * useSearchParams pra não precisar de Suspense em volta do formulário.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ modo?: string }>;
}) {
  const { modo } = await searchParams;

  return (
    // min-h-svh (não h-dvh): mesma razão documentada em (app)/layout.tsx — a
    // altura dinâmica oscila quando a barra do Safari some na rolagem. `min-h`
    // em vez de `h` porque o modo "criar" é mais alto e precisa poder rolar.
    // O rodapé fica no fluxo, não absoluto: no cadastro o conteúdo cresce e
    // passaria por baixo dele.
    <div className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col bg-background px-6 py-10 text-foreground">
      <div className="flex flex-1 flex-col justify-center">
        <LoginForm modoInicial={modo === "criar" ? "criar" : "entrar"} />
      </div>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} TapGym. Todos os direitos reservados.
      </p>
    </div>
  );
}
