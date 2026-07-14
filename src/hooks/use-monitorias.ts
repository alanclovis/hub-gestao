"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchMonitorias,
  summarizeMonitorias,
  type MonitoriaRow,
  type MonitoriasSummary,
} from "@/lib/monitorias";
import { periodRange, type InsightPeriod } from "@/lib/insights";

export function useMonitorias(period: InsightPeriod) {
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

  const { from, to } = periodRange(period);
  const summary: MonitoriasSummary | null = rows
    ? summarizeMonitorias(rows, from, to)
    : null;

  return { rows, summary, status, error, reload, from, to };
}
