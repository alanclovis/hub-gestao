import { formatMinutes, type MonitoriaRow } from "./monitorias";
import type { Atividade, CollectionMap, Projeto } from "./types";

export type CalendarKind =
  | "atividade"
  | "update"
  | "pendencia"
  | "monitoria";

export interface CalendarEvent {
  id: string;
  date: string;
  titulo: string;
  subtitle?: string;
  kind: CalendarKind;
  href: string;
}

export const CALENDAR_KIND_LABEL: Record<CalendarKind, string> = {
  atividade: "Atividade",
  update: "Update",
  pendencia: "Pendência",
  monitoria: "Monitoria",
};

const WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function weekdayLabels(): string[] {
  return WEEKDAYS_SHORT;
}

/** Local YYYY-MM-DD (evita drift UTC no Brasil). */
export function toYmdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseYmdLocal(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function monthLabel(year: number, month: number): string {
  const d = new Date(year, month, 1);
  const raw = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function dayLabelLong(ymd: string): string {
  const d = parseYmdLocal(ymd);
  const raw = d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export interface CalendarCell {
  ymd: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
}

/** Grade estilo Google Agenda: domingo → sábado, 6 semanas. */
export function buildMonthGrid(
  year: number,
  month: number,
  today = new Date(),
): CalendarCell[] {
  const todayYmd = toYmdLocal(today);
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const ymd = toYmdLocal(d);
    cells.push({
      ymd,
      day: d.getDate(),
      inMonth: d.getMonth() === month,
      isToday: ymd === todayYmd,
    });
  }
  return cells;
}

export function buildCalendarEvents(
  data: CollectionMap,
  monitorias?: MonitoriaRow[] | null,
): CalendarEvent[] {
  const projetoById = new Map(data.projetos.map((p) => [p.id, p]));
  const linkedUpdateIds = new Set(
    data.atividades
      .map((a) => a.linkedUpdateId)
      .filter((id): id is string => Boolean(id)),
  );

  const events: CalendarEvent[] = [];

  data.atividades.forEach((a: Atividade) => {
    if (!a.date) return;
    const proj = a.projetoId ? projetoById.get(a.projetoId) : undefined;
    events.push({
      id: `a-${a.id}`,
      date: a.date,
      titulo: a.titulo || "Sem título",
      subtitle: [
        proj?.titulo ?? "Avulsa",
        a.duracaoMin
          ? a.duracaoMin === 60
            ? "1h"
            : `${a.duracaoMin} min`
          : null,
      ]
        .filter(Boolean)
        .join(" · "),
      kind: "atividade",
      href: "/atividades/",
    });
  });

  data.projetos.forEach((p: Projeto) => {
    p.updates.forEach((u) => {
      if (!u.date) return;
      if (linkedUpdateIds.has(u.id)) return;
      events.push({
        id: `u-${p.id}-${u.id}`,
        date: u.date,
        titulo: u.oQueFiz || "Update",
        subtitle: p.titulo,
        kind: "update",
        href: "/projetos/",
      });
    });
  });

  data.pendencias.forEach((p) => {
    if (!p.prazo) return;
    events.push({
      id: `p-${p.id}`,
      date: p.prazo,
      titulo: p.titulo || "Pendência",
      subtitle: p.status === "feita" ? "Concluída" : "Prazo",
      kind: "pendencia",
      href: "/pendencias/",
    });
  });

  if (monitorias?.length) {
    const byDay = new Map<string, { count: number; minutos: number }>();
    for (const row of monitorias) {
      if (!row.data) continue;
      const cur = byDay.get(row.data) ?? { count: 0, minutos: 0 };
      cur.count += 1;
      cur.minutos += row.tsMin;
      byDay.set(row.data, cur);
    }
    for (const [date, agg] of byDay) {
      events.push({
        id: `m-${date}`,
        date,
        titulo: `${agg.count} monitoria${agg.count === 1 ? "" : "s"}`,
        subtitle: formatMinutes(agg.minutos),
        kind: "monitoria",
        href: "/monitorias/",
      });
    }
  }

  events.sort((a, b) => {
    const byDate = b.date.localeCompare(a.date);
    if (byDate !== 0) return byDate;
    return a.titulo.localeCompare(b.titulo, "pt-BR");
  });

  return events;
}

export function eventsByDate(
  events: CalendarEvent[],
): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const list = map.get(e.date);
    if (list) list.push(e);
    else map.set(e.date, [e]);
  }
  return map;
}
