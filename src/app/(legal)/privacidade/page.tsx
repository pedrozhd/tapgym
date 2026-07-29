import type { Metadata } from "next";
import { lerLegalMarkdown, renderLegalMarkdown } from "@/lib/legal/markdown";

export const metadata: Metadata = {
  title: "Privacidade · TapGym",
  description: "Política de privacidade do TapGym",
};

export default async function PrivacidadePage() {
  const md = await lerLegalMarkdown("privacidade");
  return renderLegalMarkdown(md);
}
