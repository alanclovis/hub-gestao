"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SaveBadge } from "@/components/save-badge";
import { useAllData } from "@/hooks/use-collection";
import { buildInsights, type InsightPeriod } from "@/lib/insights";

export default function HomePage() {
  const { data, status, error } = useAllData();
  const [period, setPeriod] = useState<InsightPeriod>("semana");

  const insights = useMemo(
    () => (data ? buildInsights(data, period) : null),
    [data, period],
  );

  return (
    <>
      <header className="hub-page-head">
        <div>
          <h1>Hoje</h1>
          <p>Insights do que você fez — dentro e fora dos projetos.</p>
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

      {!insights ? (
        <p className="empty-hint">Carregando insights…</p>
      ) : (
        <>
          <div className="overview-grid">
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
              <h2>O que você fez</h2>
              {insights.timeline.length === 0 ? (
                <p className="empty-hint">Nada registrado neste período.</p>
              ) : (
                <ul className="overview-list">
                  {insights.timeline.map((t) => (
                    <li key={t.id}>
                      <Link href={t.href}>
                        <span>{t.titulo}</span>
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
                      <span className="muted">{p.updates} update(s)</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="overview-grid" style={{ marginTop: "1rem" }}>
            <section className="overview-panel">
              <h2>Atalhos</h2>
              <ul className="overview-list">
                <li>
                  <Link href="/pendencias/">Pendências abertas</Link>
                  <span className="muted">{insights.pendenciasAbertas}</span>
                </li>
                <li>
                  <Link href="/projetos/">Projetos em andamento</Link>
                  <span className="muted">{insights.projetosEmAndamento}</span>
                </li>
                <li>
                  <Link href="/one-ones/">1:1s</Link>
                  <span className="muted">abrir</span>
                </li>
                <li>
                  <Link href="/feedbacks/">Feedbacks</Link>
                  <span className="muted">abrir</span>
                </li>
              </ul>
            </section>
          </div>
        </>
      )}
    </>
  );
}
