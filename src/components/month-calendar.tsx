"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MentionText } from "@/components/mention-text";
import {
  buildMonthGrid,
  CALENDAR_KIND_LABEL,
  dayLabelLong,
  monthLabel,
  toYmdLocal,
  weekdayLabels,
  type CalendarEvent,
} from "@/lib/calendar";

const MAX_CHIPS = 3;

interface MonthCalendarProps {
  events: CalendarEvent[];
}

export function MonthCalendar({ events }: MonthCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => ({
    year: today.getFullYear(),
    month: today.getMonth(),
  }));
  const [selected, setSelected] = useState(() => toYmdLocal(today));

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const list = map.get(e.date);
      if (list) list.push(e);
      else map.set(e.date, [e]);
    }
    return map;
  }, [events]);

  const cells = useMemo(
    () => buildMonthGrid(cursor.year, cursor.month, today),
    [cursor.year, cursor.month, today],
  );

  const selectedEvents = byDate.get(selected) ?? [];

  const goMonth = (delta: number) => {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const goToday = () => {
    const ymd = toYmdLocal(today);
    setCursor({ year: today.getFullYear(), month: today.getMonth() });
    setSelected(ymd);
  };

  return (
    <div className="cal-layout">
      <section className="cal-panel" aria-label="Calendário mensal">
        <div className="cal-toolbar">
          <div className="cal-toolbar-left">
            <button
              type="button"
              className="cal-nav-btn"
              onClick={() => goMonth(-1)}
              aria-label="Mês anterior"
            >
              ‹
            </button>
            <button
              type="button"
              className="cal-nav-btn"
              onClick={() => goMonth(1)}
              aria-label="Próximo mês"
            >
              ›
            </button>
            <h2 className="cal-month-title">
              {monthLabel(cursor.year, cursor.month)}
            </h2>
          </div>
          <button type="button" className="hub-secondary-btn" onClick={goToday}>
            Hoje
          </button>
        </div>

        <div className="cal-weekdays" role="row">
          {weekdayLabels().map((w) => (
            <div key={w} className="cal-weekday" role="columnheader">
              {w}
            </div>
          ))}
        </div>

        <div className="cal-grid" role="grid">
          {cells.map((cell) => {
            const dayEvents = byDate.get(cell.ymd) ?? [];
            const visible = dayEvents.slice(0, MAX_CHIPS);
            const more = dayEvents.length - visible.length;
            const isSelected = cell.ymd === selected;

            return (
              <button
                key={cell.ymd}
                type="button"
                role="gridcell"
                className={[
                  "cal-day",
                  cell.inMonth ? "" : "is-outside",
                  cell.isToday ? "is-today" : "",
                  isSelected ? "is-selected" : "",
                  dayEvents.length ? "has-events" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => {
                  setSelected(cell.ymd);
                  if (!cell.inMonth) {
                    const d = new Date(
                      Number(cell.ymd.slice(0, 4)),
                      Number(cell.ymd.slice(5, 7)) - 1,
                      1,
                    );
                    setCursor({ year: d.getFullYear(), month: d.getMonth() });
                  }
                }}
              >
                <span className="cal-day-num">{cell.day}</span>
                <div className="cal-chips">
                  {visible.map((e) => (
                    <span
                      key={e.id}
                      className={`cal-chip cal-chip--${e.kind}`}
                      title={`${CALENDAR_KIND_LABEL[e.kind]}: ${e.titulo}`}
                    >
                      {e.titulo}
                    </span>
                  ))}
                  {more > 0 ? (
                    <span className="cal-more">+{more} mais</span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        <ul className="cal-legend" aria-label="Legenda">
          {(
            [
              "atividade",
              "update",
              "oneone",
              "feedback",
              "pendencia",
              "monitoria",
            ] as const
          ).map((kind) => (
            <li key={kind}>
              <span className={`cal-dot cal-chip--${kind}`} />
              {CALENDAR_KIND_LABEL[kind]}
            </li>
          ))}
        </ul>
      </section>

      <aside className="cal-side" aria-live="polite">
        <h2>{dayLabelLong(selected)}</h2>
        {selectedEvents.length === 0 ? (
          <p className="empty-hint">Nada registrado neste dia.</p>
        ) : (
          <ul className="cal-day-list">
            {selectedEvents.map((e) => (
              <li key={e.id} className={`cal-day-item cal-chip--${e.kind}`}>
                <span className="cal-day-kind">
                  {CALENDAR_KIND_LABEL[e.kind]}
                </span>
                <Link href={e.href}>
                  <MentionText text={e.titulo} />
                </Link>
                {e.subtitle ? (
                  <span className="muted">{e.subtitle}</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
