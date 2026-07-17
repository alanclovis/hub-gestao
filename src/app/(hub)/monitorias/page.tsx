"use client";

import { useEffect, useMemo, useState } from "react";
import { SaveBadge } from "@/components/save-badge";
import { useCollection } from "@/hooks/use-collection";
import { useMonitorias } from "@/hooks/use-monitorias";
import {
  buildMonitoriasMetaInsights,
  getMetaCasosSemana,
  isWeekViewPeriod,
  weekStartKey,
} from "@/lib/monitorias-meta";
import {
  formatBrDate,
  formatMinDec,
  formatMinutes,
  MONITORIAS_SHEET_URL,
  SLOT_MINUTES,
  type MonitoriasPeriod,
} from "@/lib/monitorias";

export default function MonitoriasPage() {
  const [period, setPeriod] = useState<MonitoriasPeriod>("semana");
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [custom, setCustom] = useState<{ from: string; to: string } | undefined>();
  const [draftMeta, setDraftMeta] = useState("");

  const { summary, status, error, reload, from, to } = useMonitorias(
    period,
    period === "custom" ? custom : undefined,
  );
  const {
    data: meta,
    setData: setMeta,
    status: metaStatus,
    error: metaError,
  } = useCollection("meta");

  useEffect(() => {
    setDraftFrom(from);
    setDraftTo(to);
  }, [from, to]);

  const showWeekMeta = summary ? isWeekViewPeriod(period, from, to) : false;
  const weekStart = summary ? weekStartKey(summary.from) : "";
  const savedMeta = getMetaCasosSemana(meta, weekStart);

  useEffect(() => {
    if (!showWeekMeta) return;
    setDraftMeta(savedMeta !== undefined ? String(savedMeta) : "");
  }, [showWeekMeta, weekStart, savedMeta]);

  const metaInsights = useMemo(
    () =>
      summary && showWeekMeta
        ? buildMonitoriasMetaInsights(summary, savedMeta)
        : null,
    [summary, showWeekMeta, savedMeta],
  );

  const maxFilaCount = summary?.porFila.reduce((m, f) => Math.max(m, f.count), 0) ?? 1;

  const applyCustom = () => {
    if (!draftFrom || !draftTo) return;
    setCustom({ from: draftFrom, to: draftTo });
    setPeriod("custom");
  };

  const saveMeta = () => {
    if (!weekStart) return;
    const n = Number(draftMeta);
    if (!Number.isFinite(n) || n <= 0) {
      window.alert("Informe um número válido maior que zero.");
      return;
    }
    setMeta((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        monitoriasMetaCasosPorSemana: {
          ...prev.monitoriasMetaCasosPorSemana,
          [weekStart]: Math.round(n),
        },
      };
    });
  };

  return (
    <>
      <header className="hub-page-head">
        <div>
          <p className="hub-kicker">Qualidade</p>
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

      {summary && !showWeekMeta ? (
        <p className="empty-hint qi-meta-hint">
          Selecione Semana para ver meta e insights da semana.
        </p>
      ) : null}

      {summary && showWeekMeta && metaInsights ? (
        <section
          className={`qi-meta qi-meta--${metaInsights.status}`}
          aria-labelledby="qi-meta-title"
        >
          <div className="qi-meta-head">
            <div>
              <h2 id="qi-meta-title">Meta da semana</h2>
              <p className="empty-hint">
                {formatBrDate(metaInsights.weekStart)} –{" "}
                {formatBrDate(metaInsights.weekEnd)}
              </p>
            </div>
            <SaveBadge status={metaStatus} error={metaError} />
          </div>

          <div className="qi-meta-form">
            <label className="qi-meta-field">
              <span>Meta de casos</span>
              <input
                type="number"
                min={1}
                step={1}
                value={draftMeta}
                placeholder="Ex.: 300"
                onChange={(e) => setDraftMeta(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="hub-secondary-btn"
              onClick={saveMeta}
              disabled={meta === null || metaStatus === "loading"}
            >
              Salvar meta
            </button>
          </div>

          {savedMeta !== undefined ? (
            <>
              <div className="qi-meta-progress">
                <div className="qi-meta-bar-track">
                  <div
                    className="qi-meta-bar-fill"
                    style={{
                      width: `${Math.max(4, metaInsights.progressPct ?? 0)}%`,
                    }}
                  />
                </div>
                <p className="qi-meta-progress-label">
                  {metaInsights.atual} / {savedMeta} casos
                  {metaInsights.progressPct !== undefined
                    ? ` (${metaInsights.progressPct}%)`
                    : ""}
                </p>
              </div>
              <ul className="qi-meta-insights">
                {metaInsights.messages.map((msg) => (
                  <li key={msg}>{msg}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="empty-hint">
              Defina a meta da semana para acompanhar progresso, ritmo e
              projeção.
              {metaInsights.atual > 0
                ? ` ${metaInsights.atual} casos registrados até agora.`
                : ""}
            </p>
          )}
        </section>
      ) : null}

      {summary ? (
        <>
          <div className="qi-kpis">
            <div className="qi-kpi is-accent">
              <span className="qi-kpi-label">Casos</span>
              <span className="qi-kpi-value">{summary.count}</span>
              <span className="qi-kpi-sub">
                {savedMeta !== undefined && showWeekMeta
                  ? `${summary.count} / ${savedMeta} meta`
                  : "registros"}
              </span>
            </div>
            <div className="qi-kpi">
              <span className="qi-kpi-label">TS total</span>
              <span className="qi-kpi-value">
                {formatMinutes(summary.minutos)}
              </span>
              <span className="qi-kpi-sub">em horas</span>
            </div>
            <div className="qi-kpi">
              <span className="qi-kpi-label">Média/caso</span>
              <span className="qi-kpi-value">
                {formatMinDec(summary.mediaPorCaso)}
              </span>
              <span className="qi-kpi-sub">minutos</span>
            </div>
            <div className="qi-kpi">
              <span className="qi-kpi-label">Slots</span>
              <span className="qi-kpi-value">{summary.slotsAtivos}</span>
              <span className="qi-kpi-sub">
                ocorrências de {SLOT_MINUTES} min
              </span>
            </div>
            <div className="qi-kpi">
              <span className="qi-kpi-label">Capacidade</span>
              <span className="qi-kpi-value">
                {formatMinutes(summary.capacidadeMin)}
              </span>
              <span className="qi-kpi-sub">
                slots × {SLOT_MINUTES} min
              </span>
            </div>
            <div className="qi-kpi">
              <span className="qi-kpi-label">Ocupação</span>
              <span className="qi-kpi-value">
                {summary.ocupacaoPct.toFixed(0)}%
              </span>
              <span className="qi-kpi-sub">
                {formatMinDec(summary.tsPorSlot)}/slot ·{" "}
                {summary.casosPorSlot.toFixed(1)} casos
              </span>
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
              <h2>Distribuição por horário</h2>
              <p className="empty-hint" style={{ marginTop: "-0.35rem" }}>
                Média de TS por ocorrência (cap. {SLOT_MINUTES} min).
              </p>
              {summary.porSlot.length === 0 ? (
                <p className="empty-hint">Sem casos no período.</p>
              ) : (
                <ul className="qi-bars">
                  {summary.porSlot.map((s) => {
                    const occPct = Math.min(
                      100,
                      (s.mediaPorOcorrencia / SLOT_MINUTES) * 100,
                    );
                    return (
                      <li key={s.slot}>
                        <div className="qi-bar-head">
                          <span>{s.slot}</span>
                          <span className="muted">
                            {s.count} casos · {formatMinDec(s.mediaPorOcorrencia)}
                            /slot · {occPct.toFixed(0)}%
                          </span>
                        </div>
                        <div className="qi-bar-track">
                          <div
                            className="qi-bar-fill is-slot"
                            style={{
                              width: `${Math.max(6, occPct)}%`,
                            }}
                          />
                        </div>
                      </li>
                    );
                  })}
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
