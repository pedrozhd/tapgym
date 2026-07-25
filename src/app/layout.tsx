import type { Metadata, Viewport } from "next";
import { satoshi } from "./fonts";
import { ThemeInitScript } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "TapGym",
  description: "Progressão de carga com foco em qualidade de execução",
};

// Sem `maximumScale`: travar o zoom em 1 impede quem precisa ampliar a tela
// (WCAG 1.4.4). Os inputs já usam text-base/16px, que é o que evita o
// auto-zoom do iOS ao focar um campo — o motivo usual de travar a escala.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#08090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${satoshi.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background">
        <ThemeInitScript />
        {children}
      </body>
    </html>
  );
}
