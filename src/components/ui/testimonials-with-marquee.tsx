import { cn } from "@/lib/utils";
import { TestimonialCard, type TestimonialAuthor } from "@/components/ui/testimonial-card";

interface TestimonialsSectionProps {
  title: string;
  description: string;
  testimonials: Array<{
    author: TestimonialAuthor;
    text: string;
    href?: string;
  }>;
  className?: string;
}

export function TestimonialsSection({
  title,
  description,
  testimonials,
  className,
}: TestimonialsSectionProps) {
  return (
    <section
      className={cn(
        "border-t border-border bg-background text-foreground",
        "px-0 py-20 md:py-28",
        className,
      )}
    >
      <div className="mx-auto flex max-w-container flex-col items-center gap-4 text-center sm:gap-16">
        <div className="flex flex-col items-center gap-4 px-6 sm:gap-6">
          <p className="text-[12px] font-bold tracking-[0.14em] text-primary uppercase">
            Depoimentos
          </p>
          <h2 className="max-w-[720px] text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
          <p className="max-w-[600px] text-[15px] text-muted-foreground sm:text-lg">{description}</p>
        </div>

        <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
          <div className="group flex w-full flex-row overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)]">
            {Array.from({ length: 2 }, (_, setIndex) => (
              <div
                key={setIndex}
                className="animate-marquee flex shrink-0 flex-row justify-around [gap:var(--gap)] group-hover:[animation-play-state:paused]"
                aria-hidden={setIndex > 0 ? true : undefined}
              >
                {testimonials.map((testimonial, i) => (
                  <TestimonialCard key={`${setIndex}-${i}`} {...testimonial} />
                ))}
              </div>
            ))}
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/3 bg-gradient-to-r from-background sm:block" />
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-background sm:block" />
        </div>
      </div>
    </section>
  );
}
