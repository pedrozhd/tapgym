import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface TestimonialAuthor {
  name: string;
  handle: string;
  avatar: string;
}

export interface TestimonialCardProps {
  author: TestimonialAuthor;
  text: string;
  href?: string;
  className?: string;
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
        <Avatar className="h-12 w-12">
          <AvatarImage src={author.avatar} alt={author.name} loading="lazy" decoding="async" />
          <AvatarFallback>{author.name.slice(0, 1)}</AvatarFallback>
        </Avatar>
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
