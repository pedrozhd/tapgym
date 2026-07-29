import { LoginForm } from "@/components/auth/login-form";
import { LegalFooterLinks } from "@/components/legal/legal-footer-links";

/**
 * Entrar e cadastrar são a mesma ação (Continuar com Google). `?modo=criar`
 * nos CTAs da LP ainda é aceito na URL por compatibilidade, mas não muda a UI.
 */
export default async function LoginPage() {
  return (
    // min-h-svh (não h-dvh): mesma razão documentada em (app)/layout.tsx — a
    // altura dinâmica oscila quando a barra do Safari some na rolagem.
    <div className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col bg-background px-6 py-10 text-foreground">
      <div className="flex flex-1 flex-col justify-center">
        <LoginForm />
      </div>

      <div className="mt-10 flex flex-col items-center gap-2">
        <LegalFooterLinks />
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} TapGym. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
