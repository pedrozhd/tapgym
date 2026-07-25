import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, is_legacy_free, subscription_status")
    .eq("id", user.id)
    .maybeSingle();

  const origin = new URL(request.url).origin;

  // Evita criar uma segunda assinatura/customer no Stripe quando o usuário já
  // tem acesso (ex.: acabou de pagar e o webhook `checkout.session.completed`
  // ainda não gravou `subscription_status = "active"` a tempo do middleware
  // liberar `/dashboard`). Mesma checagem usada em `src/lib/supabase/middleware.ts`.
  const temAcesso = profile?.is_legacy_free || profile?.subscription_status === "active";

  if (temAcesso) {
    return NextResponse.redirect(`${origin}/dashboard`, { status: 303 });
  }

  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    client_reference_id: user.id,
    ...(profile?.stripe_customer_id
      ? { customer: profile.stripe_customer_id }
      : { customer_email: user.email }),
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: `${origin}/dashboard`,
    cancel_url: `${origin}/assinar`,
  });

  if (!session.url) {
    return NextResponse.json({ error: "não foi possível criar a sessão de checkout" }, { status: 500 });
  }

  return NextResponse.redirect(session.url, { status: 303 });
}
