import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "assinatura ausente" }, { status: 400 });
  }

  const body = await request.text();

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "assinatura inválida" }, { status: 400 });
  }

  // Um evento de test mode não pode mexer em perfil de produção, e vice-versa:
  // as duas contas compartilham o mesmo endpoint se o segredo errado for
  // configurado por engano (ver docs/CEREBRO.md, seção 9).
  const modoLive = Boolean(process.env.STRIPE_SECRET_KEY?.startsWith("sk_live"));
  if (event.livemode !== modoLive) {
    return NextResponse.json({ error: "modo incompatível" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Dedup por event.id: a Stripe reentrega em falha de rede ou de 5xx daqui, e
  // sem isto uma reentrega pode reaplicar um evento velho depois de um estado
  // mais novo já ter sido gravado. Violação de unicidade = já processado, 200
  // sem reprocessar. Tabela criada em supabase/migrations/0013_stripe_events.sql
  // (aplicar manualmente no SQL editor, como as demais).
  const { error: dedupError } = await admin.from("stripe_events").insert({ id: event.id });
  if (dedupError) {
    if (dedupError.code === "23505") {
      return NextResponse.json({ received: true, duplicado: true });
    }
    console.error("[stripe/webhook] dedup", dedupError.message);
    return NextResponse.json({ error: "não deu para registrar o evento" }, { status: 500 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    // no_payment_required cobre cartão (captura imediata); "paid" cobre o caso
    // geral. Isso deixa a rota pronta para o dia em que Pix/boleto (métodos de
    // notificação postergada, hoje fora de escopo, ver docs/CEREBRO.md e
    // docs/superpowers/specs/2026-07-24-stripe-billing-design.md) forem
    // habilitados no painel sem ninguém lembrar de mexer aqui.
    const pago = session.payment_status === "paid" || session.payment_status === "no_payment_required";
    if (session.client_reference_id && pago) {
      const { error } = await admin
        .from("profiles")
        .update({
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          subscription_status: "active",
        })
        .eq("id", session.client_reference_id);
      if (error) {
        console.error("[stripe/webhook] checkout.session.completed", error.message);
        return NextResponse.json({ error: "não deu para atualizar a assinatura" }, { status: 500 });
      }
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscriptionId = (event.data.object as Stripe.Subscription).id;
    // Busca o status atual na Stripe em vez de confiar no snapshot do evento:
    // a Stripe não garante ordem de entrega, então um `updated` antigo
    // reentregue depois de um `deleted` não deve conseguir reviver o acesso.
    // `retrieve` continua respondendo mesmo depois de a assinatura ser
    // cancelada.
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const { error } = await admin
      .from("profiles")
      .update({ subscription_status: subscription.status })
      .eq("stripe_subscription_id", subscriptionId);
    if (error) {
      console.error("[stripe/webhook]", event.type, error.message);
      return NextResponse.json({ error: "não deu para atualizar a assinatura" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
