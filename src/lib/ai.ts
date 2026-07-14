import type { Atividade } from "./types";

export const ANTHROPIC_KEY_STORAGE = "hub-gestao-anthropic-key";
export const CLAUDE_MODEL = "claude-haiku-4-5";

export function getAnthropicKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(ANTHROPIC_KEY_STORAGE)?.trim() ?? "";
}

export function setAnthropicKey(key: string): void {
  const trimmed = key.trim();
  if (!trimmed) localStorage.removeItem(ANTHROPIC_KEY_STORAGE);
  else localStorage.setItem(ANTHROPIC_KEY_STORAGE, trimmed);
}

export type FeedbackContextItem = {
  date: string;
  titulo: string;
  notas?: string;
  projetoTitulo?: string;
};

export function toFeedbackContext(
  items: Atividade[],
  projetoTitulo: (id?: string) => string | undefined,
): FeedbackContextItem[] {
  return items.map((a) => ({
    date: a.date,
    titulo: a.titulo || "Sem título",
    notas: a.notas?.trim() || undefined,
    projetoTitulo: a.projetoId ? projetoTitulo(a.projetoId) : undefined,
  }));
}

function buildUserPrompt(items: FeedbackContextItem[]): string {
  const blocks = items
    .map((a, i) => {
      const lines = [
        `${i + 1}. [${a.date}] ${a.titulo}`,
        a.projetoTitulo ? `   Projeto: ${a.projetoTitulo}` : null,
        a.notas ? `   Notas: ${a.notas}` : null,
      ].filter(Boolean);
      return lines.join("\n");
    })
    .join("\n\n");

  return `Com base nas atividades abaixo, escreva um feedback resumido em português do Brasil.

Regras:
- 3 a 6 frases objetivas
- Tom profissional, claro e útil
- Use apenas o que está escrito; não invente fatos, números ou pessoas
- Se houver nomes com @, preserve o contexto
- Não use markdown nem títulos; só o parágrafo do feedback

Atividades:
${blocks}`;
}

export async function generateFeedbackSummary(
  items: FeedbackContextItem[],
  apiKey: string,
): Promise<string> {
  if (!apiKey.trim()) {
    throw new Error("Configure a chave da Anthropic em Configurações.");
  }
  if (!items.length) {
    throw new Error("Selecione ao menos uma atividade.");
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey.trim(),
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 800,
      system:
        "Você é um assistente de gestão que resume atividades em feedback profissional curto.",
      messages: [{ role: "user", content: buildUserPrompt(items) }],
    }),
  });

  const raw = await res.text();
  let data: {
    content?: { type: string; text?: string }[];
    error?: { message?: string };
  } = {};
  try {
    data = JSON.parse(raw) as typeof data;
  } catch {
    /* ignore */
  }

  if (!res.ok) {
    const msg =
      data.error?.message ||
      (raw.slice(0, 180) || `Erro Anthropic (${res.status})`);
    throw new Error(msg);
  }

  const text = (data.content ?? [])
    .filter((c) => c.type === "text" && c.text)
    .map((c) => c.text!)
    .join("\n")
    .trim();

  if (!text) throw new Error("A Claude não retornou texto.");
  return text;
}
