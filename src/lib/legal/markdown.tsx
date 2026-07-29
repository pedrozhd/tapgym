import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ReactNode } from "react";
import Link from "next/link";

/** Lê um arquivo em `content/legal/` (cwd = raiz do app na Vercel/local). */
export async function lerLegalMarkdown(nome: "privacidade" | "termos"): Promise<string> {
  const arquivo = path.join(process.cwd(), "content", "legal", `${nome}.md`);
  return readFile(arquivo, "utf8");
}

function inline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  // Links e negrito (`**texto**`), na mesma passagem.
  const re = /(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[1]) {
      const label = match[2]!;
      const href = match[3]!;
      if (href.startsWith("/")) {
        parts.push(
          <Link key={key++} href={href} className="font-semibold text-primary underline-offset-4 hover:underline">
            {label}
          </Link>,
        );
      } else {
        parts.push(
          <a
            key={key++}
            href={href}
            className="font-semibold text-primary underline-offset-4 hover:underline"
            rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
          >
            {label}
          </a>,
        );
      }
    } else {
      parts.push(
        <strong key={key++} className="font-semibold text-foreground">
          {match[5]}
        </strong>,
      );
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/**
 * Parser mínimo para os docs legais (sem MDX).
 * Suporta: `#`, `##`, listas `- `, parágrafos, links `[t](u)`, negrito `**t**`.
 */
export function renderLegalMarkdown(md: string): ReactNode {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const nodes: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (line.trim() === "") {
      i += 1;
      continue;
    }
    if (line.startsWith("# ")) {
      nodes.push(
        <h1 key={key++} className="text-3xl font-extrabold tracking-tight">
          {inline(line.slice(2))}
        </h1>,
      );
      i += 1;
      continue;
    }
    if (line.startsWith("## ")) {
      nodes.push(
        <h2 key={key++} className="mt-10 text-xl font-bold tracking-tight">
          {inline(line.slice(3))}
        </h2>,
      );
      i += 1;
      continue;
    }
    if (line.startsWith("- ")) {
      const items: ReactNode[] = [];
      while (i < lines.length && (lines[i] ?? "").startsWith("- ")) {
        items.push(
          <li key={key++} className="leading-relaxed">
            {inline((lines[i] ?? "").slice(2))}
          </li>,
        );
        i += 1;
      }
      nodes.push(
        <ul key={key++} className="mt-3 list-disc space-y-2 pl-5 text-[15px] text-muted-foreground">
          {items}
        </ul>,
      );
      continue;
    }
    const bloco: string[] = [];
    while (i < lines.length) {
      const atual = lines[i] ?? "";
      if (
        atual.trim() === "" ||
        atual.startsWith("# ") ||
        atual.startsWith("## ") ||
        atual.startsWith("- ")
      ) {
        break;
      }
      bloco.push(atual);
      i += 1;
    }
    nodes.push(
      <p key={key++} className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
        {inline(bloco.join(" "))}
      </p>,
    );
  }

  return <div className="flex flex-col gap-1">{nodes}</div>;
}
