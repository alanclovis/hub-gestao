"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MonthCalendar } from "@/components/month-calendar";
import { SaveBadge } from "@/components/save-badge";
import { MentionText } from "@/components/mention-text";
import { useAllData } from "@/hooks/use-collection";
import { useMonitorias } from "@/hooks/use-monitorias";
import { buildCalendarEvents } from "@/lib/calendar";
import { buildInsights, type InsightPeriod } from "@/lib/insights";
import { formatMinutes, shortFila } from "@/lib/monitorias";

export default function HomePage() {
  const { data, status, error } = useAllData();
  const [period, setPeriod] = useState<InsightPeriod>("semana");
  const { rows: monRows, summary: mon, status: monStatus, error: monError } =
    useMonitorias(period);

  const insights = useMemo(
    () => (data ? buildInsights(data, period) : null),
    [data, period],
  );

  const calendarEvents = useMemo(
    () => (data ? buildCalendarEvents(data, monRows) : []),
    [data, monRows],
  );

  return (
    <>
      <header className="hub-page-head">
        <div>
          <p className="hub-kicker">Visão geral</p>
          <h1>Agenda</h1>
          <p>Navegue pelos dias e veja o que você registrou em cada um.</p>
        </div>
        <div className="hub-page-actions">
          <div className="period-toggle" role="group" aria-label="Período">
            <button
              type="button"
              className={period === "semana" ? "is-active" : ""}
              onClick={() => setPeriod("semana")}
            >
              Semana
            </button>
            <button
              type="button"
              className={period === "mes" ? "is-active" : ""}
              onClick={() => setPeriod("mes")}
            >
              Mês
            </button>
          </div>
          <SaveBadge status={status} error={error} />
        </div>
      </header>

      {!data || !insights ? (
        <p className="empty-hint">Carregando agenda…</p>
      ) : (
        <>
          <MonthCalendar events={calendarEvents} />

          <div className="overview-grid" style={{ marginTop: "1rem" }}>
            <section className="overview-panel">
              <h2>{insights.periodLabel}</h2>
              <p className="insight-stat">{insights.activityCount}</p>
              <p className="empty-hint">
                atividades / updates ({insights.from} → {insights.to})
              </p>
              <p style={{ marginTop: "1rem" }}>
                <Link href="/atividades/" className="hub-secondary-btn">
                  Ver atividades
                </Link>
              </p>
            </section>

            <section className="overview-panel">
              <h2>Monitorias qualidade</h2>
              {monStatus === "loading" ? (
                <p className="empty-hint">Lendo planilha…</p>
              ) : monError ? (
                <p className="empty-hint" style={{ color: "var(--danger)" }}>
                  {monError}
                </p>
              ) : mon ? (
                <>
                  <p className="insight-stat">{formatMinutes(mon.minutos)}</p>
                  <p className="empty-hint">
                    {mon.count} monitorias neste período
                  </p>
                  {mon.porFila[0] ? (
                    <p className="empty-hint" style={{ marginTop: "0.5rem" }}>
                      Top fila: {shortFila(mon.porFila[0].fila)} (
                      {formatMinutes(mon.porFila[0].minutos)})
                    </p>
                  ) : null}
                  <p style={{ marginTop: "1rem" }}>
                    <Link href="/monitorias/" className="hub-secondary-btn">
                      Detalhes
                    </Link>
                  </p>
                </>
              ) : (
                <p className="empty-hint">Sem dados.</p>
              )}
            </section>

            <section className="overview-panel">
              <h2>Atalhos</h2>
              <ul className="overview-list">
                <li>
                  <Link href="/pendencias/">Pendências abertas</Link>
                  <span className="overview-count">
                    {insights.pendenciasAbertas}
                  </span>
                </li>
                <li>
                  <Link href="/projetos/">Projetos em andamento</Link>
                  <span className="overview-count">
                    {insights.projetosEmAndamento}
                  </span>
                </li>
                <li>
                  <Link href="/pessoas/">Pessoas</Link>
                  <span className="muted">menções</span>
                </li>
                <li>
                  <Link href="/monitorias/">Monitorias</Link>
                  <span className="muted">planilha</span>
                </li>
              </ul>
            </section>
          </div>

          <div className="overview-grid" style={{ marginTop: "1rem" }}>
            <section className="overview-panel">
              <h2>Projetos movimentados</h2>
              {insights.projetosMovidos.length === 0 ? (
                <p className="empty-hint">Nenhum update no período.</p>
              ) : (
                <ul className="overview-list">
                  {insights.projetosMovidos.map((p) => (
                    <li key={p.id}>
                      <Link href="/projetos/">
                        <span>{p.titulo}</span>
                      </Link>
                      <span className="overview-count">{p.updates}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="overview-panel">
              <h2>Recentes no período</h2>
              {insights.timeline.length === 0 ? (
                <p className="empty-hint">Nada registrado neste período.</p>
              ) : (
                <ul className="overview-list">
                  {insights.timeline.map((t) => (
                    <li key={t.id}>
                      <Link href={t.href}>
                        <MentionText text={t.titulo} />
                      </Link>
                      <span className="muted">
                        {t.date}
                        {t.projetoTitulo ? ` · ${t.projetoTitulo}` : " · avulsa"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}
