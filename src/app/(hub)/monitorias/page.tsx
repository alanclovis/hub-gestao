"use client";

import { useEffect, useState } from "react";
import { useMonitorias } from "@/hooks/use-monitorias";
import {
  formatBrDate,
  formatMinDec,
  MONITORIAS_SHEET_URL,
  type MonitoriasPeriod,
} from "@/lib/monitorias";

export default function MonitoriasPage() {
  const [period, setPeriod] = useState<MonitoriasPeriod>("semana");
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [custom, setCustom] = useState<{ from: string; to: string } | undefined>();

  const { summary, status, error, reload, from, to } = useMonitorias(
    period,
    period === "custom" ? custom : undefined,
  );

  useEffect(() => {
    setDraftFrom(from);
    setDraftTo(to);
  }, [from, to]);

  const maxSlotCount = summary?.porSlot.reduce((m, s) => Math.max(m, s.count), 0) ?? 1;
  const maxFilaCount = summary?.porFila.reduce((m, f) => Math.max(m, f.count), 0) ?? 1;

  const applyCustom = () => {
    if (!draftFrom || !draftTo) return;
    setCustom({ from: draftFrom, to: draftTo });
    setPeriod("custom");
  };

  return (
    <>
      <header className="hub-page-head">
        <div>
          <h1>Quality Insights</h1>
          <p>Monitorias de qualidade — KPIs operacionais da planilha.</p>
        </div>
        <div className="hub-page-actions">
          <button
            type="button"
            className="hub-secondary-btn"
            onClick={() => void reload()}
          >
            Atualizar
          </button>
          <a
            href={MONITORIAS_SHEET_URL}
            target="_blank"
            rel="noreferrer"
            className="hub-ghost-btn"
          >
            Planilha
          </a>
        </div>
      </header>

      <div className="qi-toolbar">
        <div className="period-toggle" role="group" aria-label="Período">
          {(
            [
              ["hoje", "Hoje"],
              ["semana", "Semana"],
              ["mes", "Mês"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={period === id ? "is-active" : ""}
              onClick={() => setPeriod(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="qi-dates">
          <input
            type="date"
            value={draftFrom}
            onChange={(e) => setDraftFrom(e.target.value)}
          />
          <span className="empty-hint">→</span>
          <input
            type="date"
            value={draftTo}
            onChange={(e) => setDraftTo(e.target.value)}
          />
          <button type="button" className="hub-primary-btn" onClick={applyCustom}>
            analisar
          </button>
        </div>
      </div>

      {summary ? (
        <p className="qi-range-badge">
          {summary.from} → {summary.to}
        </p>
      ) : null}

      {status === "loading" && !summary ? (
        <p className="empty-hint">Carregando planilha…</p>
      ) : null}
      {error ? (
        <p className="empty-hint" style={{ color: "var(--danger)" }}>
          {error}
        </p>
      ) : null}

      {summary ? (
        <>
          <div className="qi-kpis">
            <div className="qi-kpi is-accent">
              <span className="qi-kpi-label">Casos</span>
              <span className="qi-kpi-value">{summary.count}</span>
              <span className="qi-kpi-sub">registros</span>
            </div>
            <div className="qi-kpi">
              <span className="qi-kpi-label">TS total</span>
              <span className="qi-kpi-value">
                {formatMinDec(summary.minutos)}
              </span>
              <span className="qi-kpi-sub">minutos</span>
            </div>
            <div className="qi-kpi">
              <span className="qi-kpi-label">Média/caso</span>
              <span className="qi-kpi-value">
                {formatMinDec(summary.mediaPorCaso)}
              </span>
              <span className="qi-kpi-sub">minutos</span>
            </div>
            <div className="qi-kpi">
              <span className="qi-kpi-label">Slots ativos</span>
              <span className="qi-kpi-value">{summary.slotsAtivos}</span>
              <span className="qi-kpi-sub">períodos 30min</span>
            </div>
            <div className="qi-kpi">
              <span className="qi-kpi-label">Casos/slot</span>
              <span className="qi-kpi-value">
                {summary.casosPorSlot.toFixed(1)}
              </span>
              <span className="qi-kpi-sub">média</span>
            </div>
            <div className="qi-kpi">
              <span className="qi-kpi-label">TS/slot</span>
              <span className="qi-kpi-value">
                {formatMinDec(summary.tsPorSlot)}
              </span>
              <span className="qi-kpi-sub">média</span>
            </div>
          </div>

          <div className="qi-charts">
            <section className="overview-panel">
              <h2>Por fila</h2>
              {summary.porFila.length === 0 ? (
                <p className="empty-hint">Sem casos no período.</p>
              ) : (
                <ul className="qi-bars">
                  {summary.porFila.map((f) => (
                    <li key={f.fila}>
                      <div className="qi-bar-head">
                        <span title={f.fila}>{f.label}</span>
                        <span className="muted">
                          {f.count} casos · {formatMinDec(f.mediaPorCaso)}
                          /caso
                        </span>
                      </div>
                      <div className="qi-bar-track">
                        <div
                          className="qi-bar-fill is-fila"
                          style={{
                            width: `${Math.max(6, (f.count / maxFilaCount) * 100)}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="overview-panel">
              <h2>Distribuição por slot</h2>
              {summary.porSlot.length === 0 ? (
                <p className="empty-hint">Sem casos no período.</p>
              ) : (
                <ul className="qi-bars">
                  {summary.porSlot.map((s) => (
                    <li key={s.slot}>
                      <div className="qi-bar-head">
                        <span>{s.slot}</span>
                        <span className="muted">{s.count} casos</span>
                      </div>
                      <div className="qi-bar-track">
                        <div
                          className="qi-bar-fill is-slot"
                          style={{
                            width: `${Math.max(6, (s.count / maxSlotCount) * 100)}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <p className="qi-footer">
            gerado em {summary.geradoEm} · intervalo {formatBrDate(summary.from)}{" "}
            – {formatBrDate(summary.to)}
          </p>
        </>
      ) : null}
    </>
  );
}
