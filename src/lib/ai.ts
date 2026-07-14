import type { PersonHit } from "./mentions";

const kindLabel: Record<PersonHit["kind"], string> = {
  feedback: "Feedback",
  atividade: "Atividade",
  projeto: "Projeto",
  update: "Update",
};

/** Monta um prompt pronto para colar no Claude, sobre uma pessoa. */
export function buildClaudePersonPrompt(
  pessoa: string,
  hits: PersonHit[],
): string {
  const name = pessoa.trim().replace(/^@+/, "");
  if (!name) {
    throw new Error("Escolha uma pessoa.");
  }
  if (!hits.length) {
    throw new Error(`Nenhuma menção encontrada para @${name}.`);
  }

  const blocks = hits
    .map((h, i) => {
      const lines = [
        `${i + 1}. [${h.data}] (${kindLabel[h.kind]}) ${h.titulo}`,
        h.detalhe ? `   Contexto: ${h.detalhe}` : null,
      ].filter(Boolean);
      return lines.join("\n");
    })
    .join("\n\n");

  return `Com base nos registros abaixo sobre @${name}, escreva um feedback resumido em português do Brasil.

Regras:
- 3 a 6 frases objetivas
- Tom profissional, claro e útil (pode ser para dar feedback a @${name} ou sobre o trabalho com essa pessoa)
- Use apenas o que está escrito; não invente fatos, números ou pessoas
- Preserve menções com @ quando fizer sentido
- Não use markdown nem títulos; só o parágrafo do feedback

Registros sobre @${name}:
${blocks}`;
}
