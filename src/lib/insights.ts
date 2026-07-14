import type { Atividade, CollectionMap, Projeto } from "./types";

export type InsightPeriod = "semana" | "mes";

export interface TimelineEntry {
  id: string;
  date: string;
  titulo: string;
  projetoTitulo: string | null;
  source: "atividade" | "update";
  href: string;
}

export interface Insights {
  periodLabel: string;
  from: string;
  to: string;
  activityCount: number;
  timeline: TimelineEntry[];
  projetosMovidos: { id: string; titulo: string; updates: number }[];
  pendenciasAbertas: number;
  projetosEmAndamento: number;
}

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7; // Monday=0
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function toYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function periodRange(
  period: InsightPeriod,
  now = new Date(),
): { from: string; to: string; label: string } {
  const to = toYmd(now);
  if (period === "semana") {
    const from = toYmd(startOfWeek(now));
    return { from, to, label: "Esta semana" };
  }
  const from = toYmd(startOfMonth(now));
  return { from, to, label: "Este mês" };
}

function inRange(date: string, from: string, to: string): boolean {
  return date >= from && date <= to;
}

export function buildInsights(
  data: CollectionMap,
  period: InsightPeriod,
): Insights {
  const { from, to, label } = periodRange(period);
  const projetoById = new Map(data.projetos.map((p) => [p.id, p]));
  const linkedUpdateIds = new Set(
    data.atividades
      .map((a) => a.linkedUpdateId)
      .filter((id): id is string => Boolean(id)),
  );

  const timeline: TimelineEntry[] = [];

  data.atividades.forEach((a: Atividade) => {
    if (!inRange(a.date, from, to)) return;
    const proj = a.projetoId ? projetoById.get(a.projetoId) : undefined;
    timeline.push({
      id: `a-${a.id}`,
      date: a.date,
      titulo: a.titulo || "Sem título",
      projetoTitulo: proj?.titulo ?? null,
      source: "atividade",
      href: "/atividades/",
    });
  });

  data.projetos.forEach((p: Projeto) => {
    p.updates.forEach((u) => {
      if (!inRange(u.date, from, to)) return;
      if (linkedUpdateIds.has(u.id)) return; // já contado via atividade
      timeline.push({
        id: `u-${p.id}-${u.id}`,
        date: u.date,
        titulo: u.oQueFiz || "Update",
        projetoTitulo: p.titulo,
        source: "update",
        href: "/projetos/",
      });
    });
  });

  timeline.sort((a, b) => b.date.localeCompare(a.date));

  const movidosMap = new Map<string, number>();
  timeline.forEach((t) => {
    if (!t.projetoTitulo) return;
    const proj = data.projetos.find((p) => p.titulo === t.projetoTitulo);
    if (!proj) return;
    movidosMap.set(proj.id, (movidosMap.get(proj.id) ?? 0) + 1);
  });

  const projetosMovidos = [...movidosMap.entries()]
    .map(([id, updates]) => ({
      id,
      titulo: projetoById.get(id)?.titulo ?? id,
      updates,
    }))
    .sort((a, b) => b.updates - a.updates);

  return {
    periodLabel: label,
    from,
    to,
    activityCount: timeline.length,
    timeline: timeline.slice(0, 12),
    projetosMovidos: projetosMovidos.slice(0, 8),
    pendenciasAbertas: data.pendencias.filter((p) => p.status === "aberta")
      .length,
    projetosEmAndamento: data.projetos.filter((p) => p.status === "em_andamento")
      .length,
  };
}
