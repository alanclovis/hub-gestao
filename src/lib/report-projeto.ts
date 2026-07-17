import { formatProjetoLinkHref } from "./projeto-links";
import { STATUS_COLUMNS, type Projeto } from "./types";

function statusLabel(status: Projeto["status"]): string {
  return STATUS_COLUMNS.find((c) => c.id === status)?.label ?? status;
}

function slugify(text: string): string {
  return (
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "projeto"
  );
}

/** Relatório em Markdown a partir do card do projeto + updates. */
export function buildProjetoReport(projeto: Projeto): string {
  const geradoEm = new Date().toLocaleString("pt-BR");
  const updates = [...projeto.updates].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  const linhas: string[] = [
    `# Relatório — ${projeto.titulo || "Sem título"}`,
    "",
    `Gerado em: ${geradoEm}`,
    "",
    "## Resumo",
    "",
    `| Campo | Valor |`,
    `| --- | --- |`,
    `| Status | ${statusLabel(projeto.status)} |`,
    `| KR | ${projeto.kr || "—"} |`,
    `| Papel | ${projeto.papel} |`,
    `| Colaboradores | ${
      projeto.colaboradores?.length
        ? projeto.colaboradores.map((c) => c.nome).join(", ")
        : "—"
    } |`,
    `| Período | ${projeto.periodo || "—"} |`,
    `| Destaque | ${projeto.destaque ? "Sim" : "Não"} |`,
    "",
    "## Descrição e contexto",
    "",
    projeto.descricao?.trim() || "_(não preenchido)_",
    "",
    "## Impacto / resultado",
    "",
    projeto.impacto?.trim() || "_(não preenchido)_",
    "",
  ];

  if (projeto.links.length) {
    linhas.push("## Links / evidências", "");
    projeto.links.forEach((l) => {
      const href = formatProjetoLinkHref(l.url);
      linhas.push(`- [${l.label || "Link"}](${href})`);
    });
    linhas.push("");
  }

  linhas.push("## Linha do tempo (updates)", "");

  if (!updates.length) {
    linhas.push("_(nenhum update registrado)_", "");
  } else {
    updates.forEach((u) => {
      linhas.push(`### ${u.date}`, "");
      if (u.oQueFiz) linhas.push(u.oQueFiz);
      if (u.decisao) linhas.push(`- Decisão: ${u.decisao}`);
      if (u.evidencia) linhas.push(`- Evidência: ${u.evidencia}`);
      if (u.resultado) linhas.push(`- Resultado: ${u.resultado}`);
      linhas.push("");
    });
  }

  // Síntese automática leve dos updates para apresentação
  const feitos = updates.map((u) => u.oQueFiz).filter(Boolean);
  const resultados = updates.map((u) => u.resultado).filter(Boolean);
  linhas.push("## Destaques para apresentação", "");
  if (feitos.length || resultados.length || projeto.impacto.trim()) {
    if (projeto.impacto.trim()) {
      linhas.push(`- Impacto declarado: ${projeto.impacto.trim()}`);
    }
    feitos.slice(0, 5).forEach((f) => linhas.push(`- Entrega: ${f}`));
    resultados.slice(0, 5).forEach((r) => linhas.push(`- Resultado: ${r}`));
  } else {
    linhas.push(
      "_(adicione updates e impacto no card para enriquecer esta seção)_",
    );
  }
  linhas.push("");

  return linhas.join("\n");
}

export function reportFilename(projeto: Projeto): string {
  const day = new Date().toISOString().slice(0, 10);
  return `relatorio-${slugify(projeto.titulo)}-${day}.md`;
}

export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
