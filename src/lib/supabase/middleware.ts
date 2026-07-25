import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Refreshes the Supabase session cookie on every request and gates the app routes behind auth e assinatura. */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith("/login");
  const isLandingPage = pathname === "/";
  const isAssinarRoute = pathname === "/assinar";

  // `getUser()` acima pode ter renovado o cookie de sessão (via `setAll`),
  // o que só foi gravado em `supabaseResponse`. Redirecionar retornando uma
  // `NextResponse.redirect` nova, sem copiar esses cookies, descarta a
  // renovação — o navegador guarda o cookie antigo/expirado e o usuário pode
  // cair deslogado sem aviso na navegação seguinte.
  function redirectPreservingSession(pathname: string) {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    const response = NextResponse.redirect(url);
    for (const cookie of supabaseResponse.cookies.getAll()) {
      response.cookies.set(cookie);
    }
    return response;
  }

  if (!user && !isAuthRoute && !isLandingPage) {
    return redirectPreservingSession("/login");
  }

  // Quem já tem conta não precisa ver a LP ou a tela de login de novo — manda
  // direto pra Dashboard.
  if (user && (isAuthRoute || isLandingPage)) {
    return redirectPreservingSession("/dashboard");
  }

  if (user && !isAuthRoute && !isLandingPage) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_legacy_free, subscription_status")
      .eq("id", user.id)
      .maybeSingle();

    const temAcesso = profile?.is_legacy_free || profile?.subscription_status === "active";

    if (!temAcesso && !isAssinarRoute) {
      return redirectPreservingSession("/assinar");
    }

    if (temAcesso && isAssinarRoute) {
      return redirectPreservingSession("/dashboard");
    }
  }

  return supabaseResponse;
}
