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
  today = todayISO(),
): number {
  return comparePendenciasByUrgency(a, b, today);
}

function urgencyRank(p: Pendencia, today: string): number {
  if (p.status !== "aberta") return 4;
  if (!p.prazo?.trim()) return 2;
  if (p.prazo < today) return 0;
  if (p.prazo === today) return 1;
  return 3;
}

/** Atrasadas → hoje → sem prazo → futuras; depois prioridade e prazo. */
export function comparePendenciasByUrgency(
  a: Pendencia,
  b: Pendencia,
  today = todayISO(),
): number {
  const ra = urgencyRank(a, today);
  const rb = urgencyRank(b, today);
  if (ra !== rb) return ra - rb;
  const pa = PRIORITY_ORDER[pendenciaPrioridadeOrDefault(a)];
  const pb = PRIORITY_ORDER[pendenciaPrioridadeOrDefault(b)];
  if (pa !== pb) return pa - pb;
  return (a.prazo || "9999").localeCompare(b.prazo || "9999");
}

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function diffDays(fromYmd: string, toYmdStr: string): number {
  const from = parseYmd(fromYmd);
  const to = parseYmd(toYmdStr);
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export type PendenciaFiltro =
  | "aberta"
  | "atrasada"
  | "hoje"
  | "feita"
  | "todas";

export function isPendenciaAtrasada(
  p: Pendencia,
  today = todayISO(),
): boolean {
  return (
    p.status === "aberta" && Boolean(p.prazo?.trim()) && p.prazo! < today
  );
}

export function isPendenciaVenceHoje(
  p: Pendencia,
  today = todayISO(),
): boolean {
  return p.status === "aberta" && p.prazo?.trim() === today;
}

export function matchesPendenciaFiltro(
  p: Pendencia,
  filtro: PendenciaFiltro,
  today = todayISO(),
): boolean {
  if (filtro === "todas") return true;
  if (filtro === "feita") return p.status === "feita";
  if (p.status !== "aberta") return false;
  if (filtro === "aberta") return true;
  if (filtro === "atrasada") return isPendenciaAtrasada(p, today);
  if (filtro === "hoje") return isPendenciaVenceHoje(p, today);
  return true;
}

export function formatPendenciaPrazoRelativo(
  prazo: string | undefined,
  today = todayISO(),
): string {
  if (!prazo?.trim()) return "sem prazo";
  if (prazo < today) {
    const days = diffDays(prazo, today);
    return days === 1 ? "venceu há 1 dia" : `venceu há ${days} dias`;
  }
  if (prazo === today) return "vence hoje";
  const days = diffDays(today, prazo);
  if (days === 1) return "vence amanhã";
  return `em ${days} dias`;
}

export function summarizePendenciasAbertas(
  pendencias: Pendencia[],
  today = todayISO(),
): {
  atrasadas: number;
  hoje: number;
  futuras: number;
  semPrazo: number;
  total: number;
} {
  let atrasadas = 0;
  let hoje = 0;
  let futuras = 0;
  let semPrazo = 0;

  for (const p of pendencias) {
    if (p.status !== "aberta") continue;
    if (!p.prazo?.trim()) {
      semPrazo += 1;
      continue;
    }
    if (p.prazo < today) atrasadas += 1;
    else if (p.prazo === today) hoje += 1;
    else futuras += 1;
  }

  return {
    atrasadas,
    hoje,
    futuras,
    semPrazo,
    total: atrasadas + hoje + futuras + semPrazo,
  };
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
