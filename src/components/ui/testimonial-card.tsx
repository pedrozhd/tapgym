import { cn } from "@/lib/utils";

export interface TestimonialAuthor {
  name: string;
  handle: string;
}

export interface TestimonialCardProps {
  author: TestimonialAuthor;
  text: string;
  href?: string;
  className?: string;
}

/** Avatar local (iniciais) — sem Unsplash/Radix no critical path da LP. */
function Iniciais({ name }: { name: string }) {
  const iniciais = name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-[13px] font-bold text-foreground"
      aria-hidden
    >
      {iniciais}
    </span>
  );
}

export function TestimonialCard({ author, text, href, className }: TestimonialCardProps) {
  const classNames = cn(
    "flex max-w-[320px] flex-col rounded-2xl border border-border bg-card p-4 text-start sm:p-6",
    "transition-colors duration-300 hover:border-primary/40",
    className,
  );

  const body = (
    <>
      <div className="flex items-center gap-3">
        <Iniciais name={author.name} />
        <div className="flex flex-col items-start gap-1">
          <h3 className="text-[15px] leading-none font-semibold">{author.name}</h3>
          <p className="text-[13px] text-muted-foreground">{author.handle}</p>
        </div>
      </div>
      <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground sm:text-[15px]">{text}</p>
    </>
  );

  if (href) {
    return (
      <a href={href} className={classNames}>
        {body}
      </a>
    );
  }

  return <div className={classNames}>{body}</div>;
}
