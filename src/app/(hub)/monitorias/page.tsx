"use client";

import { useState } from "react";
import Link from "next/link";
import { SaveBadge } from "@/components/save-badge";
import { useMonitorias } from "@/hooks/use-monitorias";
import type { InsightPeriod } from "@/lib/insights";
import {
  formatMinutes,
  MONITORIAS_SHEET_URL,
  shortFila,
} from "@/lib/monitorias";

export default function MonitoriasPage() {
  const [period, setPeriod] = useState<InsightPeriod>("semana");
  const { summary, status, error, reload, rows } = useMonitorias(period);

  const badgeStatus =
    status === "loading"
      ? "loading"
      : status === "error"
        ? "error"
        : status === "ready"
          ? "saved"
          : "idle";

  return (
    <>
      <header className="hub-page-head">
        <div>
          <h1>Monitorias</h1>
          <p>Tempos operacionais da planilha de qualidade.</p>
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
          <button type="button" className="hub-secondary-btn" onClick={() => void reload()}>
            Atualizar
          </button>
          <SaveBadge status={badgeStatus} error={error} />
        </div>
      </header>

      {!summary ? (
        <p className="empty-hint">
          {status === "loading" ? "Carregando planilha…" : "Sem dados."}
        </p>
      ) : (
        <>
          <div className="overview-grid">
            <section className="overview-panel">
              <h2>Tempo no período</h2>
              <p className="insight-stat">{formatMinutes(summary.minutos)}</p>
              <p className="empty-hint">
                {summary.count} monitorias · {summary.from} → {summary.to}
              </p>
              <p className="empty-hint" style={{ marginTop: "0.75rem" }}>
                Total na planilha: {rows?.length ?? 0} registros
              </p>
              <p style={{ marginTop: "1rem" }}>
                <a
                  href={MONITORIAS_SHEET_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="hub-secondary-btn"
                >
                  Abrir planilha
                </a>
              </p>
            </section>

            <section className="overview-panel">
              <h2>Por fila</h2>
              {summary.porFila.length === 0 ? (
                <p className="empty-hint">Nada neste período.</p>
              ) : (
                <ul className="overview-list">
                  {summary.porFila.map((f) => (
                    <li key={f.fila}>
                      <span title={f.fila}>{shortFila(f.fila)}</span>
                      <span className="muted">
                        {f.count} · {formatMinutes(f.minutos)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="overview-panel">
              <h2>Recentes</h2>
              {summary.recentes.length === 0 ? (
                <p className="empty-hint">Nenhuma neste período.</p>
              ) : (
                <ul className="overview-list">
                  {summary.recentes.map((r, i) => (
                    <li key={`${r.registradoEm}-${i}`}>
                      <span title={r.fila}>
                        {r.data} {r.slot} · {shortFila(r.fila)}
                      </span>
                      <span className="muted">{formatMinutes(r.tsMin)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <p style={{ marginTop: "1.25rem" }}>
            <Link href="/" className="hub-ghost-btn">
              ← Voltar à Home
            </Link>
          </p>
        </>
      )}
    </>
  );
}
