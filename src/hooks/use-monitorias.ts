"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchMonitorias,
  monitoriasPeriodRange,
  summarizeMonitorias,
  type MonitoriaRow,
  type MonitoriasPeriod,
  type MonitoriasSummary,
} from "@/lib/monitorias";

export function useMonitorias(
  period: MonitoriasPeriod,
  customRange?: { from: string; to: string },
) {
  const [rows, setRows] = useState<MonitoriaRow[] | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "ready">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const data = await fetchMonitorias();
      setRows(data);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const { from, to } = useMemo(
    () => monitoriasPeriodRange(period, customRange),
    [period, customRange],
  );

  const summary: MonitoriasSummary | null = useMemo(
    () => (rows ? summarizeMonitorias(rows, from, to) : null),
    [rows, from, to],
  );

  return { rows, summary, status, error, reload, from, to };
}
