import type { Atividade } from "./types";

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

/** Monta um prompt pronto para colar no Claude (chat). */
export function buildClaudeFeedbackPrompt(
  items: FeedbackContextItem[],
): string {
  if (!items.length) {
    throw new Error("Selecione ao menos uma atividade.");
  }

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
