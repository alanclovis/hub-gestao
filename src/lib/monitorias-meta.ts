import type { MonitoriasSummary } from "./monitorias";
import type { Meta } from "./types";

export type MonitoriasMetaStatus =
  | "meta_batida"
  | "no_ritmo"
  | "atrasado"
  | "sem_meta";

export interface MonitoriasMetaInsights {
  weekStart: string;
  weekEnd: string;
  atual: number;
  meta?: number;
  progressPct?: number;
  gap?: number;
  casosPorDia: number;
  diasDecorridos: number;
  diasRestantes: number;
  projecao: number;
  status: MonitoriasMetaStatus;
  statusLabel: string;
  messages: string[];
}

function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function diffDays(fromYmd: string, toYmdStr: string): number {
  const from = parseYmd(fromYmd);
  const to = parseYmd(toYmdStr);
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

/** Segunda-feira da semana de `dateYmd`. */
export function weekStartKey(dateYmd: string): string {
  const d = parseYmd(dateYmd);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return toYmd(d);
}

export function weekEndKey(weekStart: string): string {
  const d = parseYmd(weekStart);
  d.setDate(d.getDate() + 6);
  return toYmd(d);
}

export function isSameCalendarWeek(from: string, to: string): boolean {
  return weekStartKey(from) === weekStartKey(to);
}

export function isWeekViewPeriod(
  period: "hoje" | "semana" | "mes" | "custom",
  from: string,
  to: string,
): boolean {
  if (period === "semana") return true;
  if (period === "custom") return isSameCalendarWeek(from, to);
  return false;
}

export function getMetaCasosSemana(
  meta: Meta | null | undefined,
  weekStart: string,
): number | undefined {
  const n = meta?.monitoriasMetaCasosPorSemana?.[weekStart];
  return typeof n === "number" && n > 0 ? n : undefined;
}

export function buildMonitoriasMetaInsights(
  summary: MonitoriasSummary,
  metaCasos: number | undefined,
  today = new Date(),
): MonitoriasMetaInsights {
  const weekStart = weekStartKey(summary.from);
  const weekEnd = weekEndKey(weekStart);
  const todayYmd = toYmd(today);
  const anchor = todayYmd <= weekEnd ? todayYmd : weekEnd;
  const progressEnd =
    summary.to < anchor ? summary.to : anchor < weekStart ? weekStart : anchor;

  const diasDecorridos = Math.max(1, diffDays(weekStart, progressEnd) + 1);
  const diasRestantes = Math.max(0, diffDays(progressEnd, weekEnd));
  const casosPorDia = summary.count / diasDecorridos;
  const projecao = Math.round(summary.count + casosPorDia * diasRestantes);

  const messages: string[] = [];
  let status: MonitoriasMetaStatus = "sem_meta";
  let statusLabel = "Defina a meta da semana";
  let progressPct: number | undefined;
  let gap: number | undefined;

  messages.push(
    `Ritmo: ${casosPorDia.toFixed(1)} casos/dia · projeção: ${projecao} casos`,
  );

  if (metaCasos !== undefined) {
    progressPct = Math.min(100, Math.round((summary.count / metaCasos) * 100));
    gap = metaCasos - summary.count;

    if (summary.count >= metaCasos) {
      status = "meta_batida";
      statusLabel = "Meta batida";
      messages.unshift(
        `Meta batida (+${summary.count - metaCasos} casos acima da meta)`,
      );
    } else {
      messages.unshift(`Faltam ${gap} casos para a meta`);
      const pastHalf = diasDecorridos >= 4;
      if (pastHalf && projecao < metaCasos) {
        status = "atrasado";
        statusLabel = "Atrasado em relação à meta";
      } else {
        status = "no_ritmo";
        statusLabel = "No ritmo para bater a meta";
      }
    }
    messages.push(`Status: ${statusLabel}`);
  } else {
    messages.push(`${summary.count} casos registrados no período`);
  }

  return {
    weekStart,
    weekEnd,
    atual: summary.count,
    meta: metaCasos,
    progressPct,
    gap,
    casosPorDia,
    diasDecorridos,
    diasRestantes,
    projecao,
    status,
    statusLabel,
    messages,
  };
}
