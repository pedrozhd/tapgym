import Link from "next/link";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <header
        className="mx-auto flex max-w-3xl items-center justify-between px-6 pb-4"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 1.25rem)" }}
      >
        <Link href="/" className="text-lg font-bold tracking-tight">
          TapGym
        </Link>
        <Link
          href="/"
          className="text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          Voltar
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-6 pb-16 pt-4">{children}</main>
    </div>
  );
}
