import Link from "next/link";
import { cn } from "@/lib/utils";

export function LegalFooterLinks({ className }: { className?: string }) {
  return (
    <p className={cn("flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground", className)}>
      <Link href="/privacidade" className="hover:text-foreground">
        Privacidade
      </Link>
      <span aria-hidden>·</span>
      <Link href="/termos" className="hover:text-foreground">
        Termos
      </Link>
    </p>
  );
}
