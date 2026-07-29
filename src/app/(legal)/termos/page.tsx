import type { Metadata } from "next";
import { lerLegalMarkdown, renderLegalMarkdown } from "@/lib/legal/markdown";

export const metadata: Metadata = {
  title: "Termos · TapGym",
  description: "Termos de uso do TapGym",
};

export default async function TermosPage() {
  const md = await lerLegalMarkdown("termos");
  return renderLegalMarkdown(md);
}
