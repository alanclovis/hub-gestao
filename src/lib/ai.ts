import type { Atividade } from "./types";

export const GEMINI_KEY_STORAGE = "hub-gestao-gemini-key";
/** Flash: gratuito no AI Studio e bom para resumos curtos. */
export const GEMINI_MODEL = "gemini-2.0-flash";

export function getGeminiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(GEMINI_KEY_STORAGE)?.trim() ?? "";
}

export function setGeminiKey(key: string): void {
  const trimmed = key.trim();
  if (!trimmed) localStorage.removeItem(GEMINI_KEY_STORAGE);
  else localStorage.setItem(GEMINI_KEY_STORAGE, trimmed);
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
    throw new Error("Configure a chave do Gemini em Configurações.");
  }
  if (!items.length) {
    throw new Error("Selecione ao menos uma atividade.");
  }

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text: "Você é um assistente de gestão que resume atividades em feedback profissional curto.",
          },
        ],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: buildUserPrompt(items) }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 800,
      },
    }),
  });

  const raw = await res.text();
  let data: {
    candidates?: {
      content?: { parts?: { text?: string }[] };
      finishReason?: string;
    }[];
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
      (raw.slice(0, 200) || `Erro Gemini (${res.status})`);
    throw new Error(msg);
  }

  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("")
    .trim();

  if (!text) throw new Error("O Gemini não retornou texto.");
  return text;
}
