import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let ratelimit: Ratelimit | null | undefined;

function getRatelimit(): Ratelimit | null {
  if (ratelimit !== undefined) return ratelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    ratelimit = null;
    return ratelimit;
  }

  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(20, "60 s"),
    prefix: "ratelimit",
  });
  return ratelimit;
}

export async function checkRateLimit(identifier: string): Promise<{ success: boolean }> {
  const limiter = getRatelimit();
  if (!limiter) {
    // Fail-open só é aceitável em dev local. Rodando na Vercel (produção ou
    // preview, que usam as mesmas credenciais de Supabase/Stripe, ver
    // docs/CEREBRO.md) sem essas variáveis é incidente de configuração, não
    // ausência de tráfego a limitar: liberar geral apagaria justamente as
    // cotas que protegem o token do atalho contra compartilhamento e força bruta.
    if (process.env.VERCEL_ENV) {
      console.error("[ratelimit] Upstash não configurado neste ambiente Vercel, negando por padrão");
      return { success: false };
    }
    return { success: true };
  }

  const { success } = await limiter.limit(identifier);
  return { success };
}

export function clientIp(request: Request): string {
  // x-real-ip é preenchido pela Vercel com o IP real da conexão e não pode ser
  // forjado pelo cliente. x-forwarded-for pode vir com um valor inicial
  // arbitrário enviado pelo cliente — a Vercel só *acrescenta* o IP real ao
  // final da lista, então o último item (não o primeiro) é o confiável.
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwardedFor = request.headers.get("x-forwarded-for");
  const ips = forwardedFor?.split(",").map((ip) => ip.trim()).filter(Boolean);
  return ips?.[ips.length - 1] ?? "unknown";
}
