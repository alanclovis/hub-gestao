import { nanoid } from "nanoid";
import { syncAtividadeIntoProjetos } from "./atividade-sync";
import type {
  Atividade,
  Pendencia,
  PendenciaPrioridade,
  Projeto,
} from "./types";

const PRIORITY_ORDER: Record<PendenciaPrioridade, number> = {
  alta: 0,
  media: 1,
  baixa: 2,
};

export function pendenciaPrioridadeOrDefault(
  p: Pendencia,
): PendenciaPrioridade {
  return p.prioridade ?? "media";
}

export function pendenciaPrioridadeLabel(prioridade: PendenciaPrioridade): string {
  if (prioridade === "alta") return "Alta";
  if (prioridade === "baixa") return "Baixa";
  return "Média";
}

export function comparePendenciasByPriorityAndPrazo(
  a: Pendencia,
  b: Pendencia,
): number {
  const pa = PRIORITY_ORDER[pendenciaPrioridadeOrDefault(a)];
  const pb = PRIORITY_ORDER[pendenciaPrioridadeOrDefault(b)];
  if (pa !== pb) return pa - pb;
  return (a.prazo || "9999").localeCompare(b.prazo || "9999");
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Abertas com prazo vencido, hoje, ou sem prazo. */
export function isPendenciaDueOpen(p: Pendencia, today = todayISO()): boolean {
  if (p.status !== "aberta") return false;
  if (!p.prazo?.trim()) return true;
  return p.prazo <= today;
}

export function countDueOpenPendencias(
  pendencias: Pendencia[] | null | undefined,
  today = todayISO(),
): number {
  return (pendencias ?? []).filter((p) => isPendenciaDueOpen(p, today)).length;
}

export function pendenciaToAtividade(p: Pendencia): Atividade {
  const now = new Date().toISOString();
  return {
    id: nanoid(),
    date: p.prazo?.trim() || todayISO(),
    titulo: p.titulo.trim() || "Pendência concluída",
    notas: p.notas?.trim() || "",
    projetoId: p.projetoId,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Conclui a pendência criando uma atividade (e update no projeto, se vinculado).
 */
export function completePendenciaAsAtividade(
  pendencia: Pendencia,
  projetos: Projeto[],
  atividades: Atividade[],
): {
  pendencia: Pendencia;
  atividade: Atividade;
  projetos: Projeto[];
  atividades: Atividade[];
} {
  const atividadeSeed = pendenciaToAtividade(pendencia);
  const { projetos: nextProjetos, atividade } = syncAtividadeIntoProjetos(
    projetos,
    atividadeSeed,
    null,
  );
  const stampedPendencia: Pendencia = {
    ...pendencia,
    status: "feita",
    updatedAt: new Date().toISOString(),
  };
  return {
    pendencia: stampedPendencia,
    atividade,
    projetos: nextProjetos,
    atividades: [atividade, ...atividades],
  };
}
