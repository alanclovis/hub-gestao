/** Planilha de tempos de monitoria de qualidade (CSV público). */
export const MONITORIAS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1t0F5B1NdinpGMLW1wTUiWMecAD6uPVChFTYOh7PR2bo/export?format=csv&gid=0";

export const MONITORIAS_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1t0F5B1NdinpGMLW1wTUiWMecAD6uPVChFTYOh7PR2bo/edit?gid=0#gid=0";

export interface MonitoriaRow {
  data: string;
  slot: string;
  fila: string;
  duracaoSeg: number;
  tsMin: number;
  registradoEm: string;
}

export interface FilaAgg {
  fila: string;
  count: number;
  minutos: number;
}

export interface MonitoriasSummary {
  from: string;
  to: string;
  count: number;
  minutos: number;
  horas: number;
  porFila: FilaAgg[];
  recentes: MonitoriaRow[];
}

function parsePtNumber(raw: string): number {
  const cleaned = raw.trim().replace(/^"|"$/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/** CSV simples (campos sem quebra de linha; aspas opcionais). */
export function parseMonitoriasCsv(text: string): MonitoriaRow[] {
  const lines = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const rows: MonitoriaRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    // ts_min pode vir como "17,45" (aspas) — parser com grupos
    const match = lines[i].match(
      /^([^,]*),([^,]*),([^,]*),([^,]*),("(?:[^"]*)"|[^,]*),(.*)$/,
    );
    if (!match) continue;
    const [, data, slot, fila, duracaoRaw, tsRaw, registrado] = match;
    const duracaoSeg = parsePtNumber(duracaoRaw);
    let tsMin = parsePtNumber(tsRaw);
    if (!tsMin && duracaoSeg) tsMin = duracaoSeg / 60;
    rows.push({
      data: data.trim(),
      slot: slot.trim(),
      fila: fila.trim(),
      duracaoSeg,
      tsMin,
      registradoEm: registrado.trim().replace(/^"|"$/g, ""),
    });
  }
  return rows;
}

export async function fetchMonitorias(
  url = MONITORIAS_CSV_URL,
): Promise<MonitoriaRow[]> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Falha ao ler planilha (${res.status})`);
  }
  const text = await res.text();
  if (text.includes("Sign in") && text.includes("accounts.google")) {
    throw new Error(
      "Planilha inacessível — compartilhe como “Qualquer pessoa com o link” (leitor) ou publique o CSV.",
    );
  }
  return parseMonitoriasCsv(text);
}

function inRange(date: string, from: string, to: string): boolean {
  return date >= from && date <= to;
}

export function summarizeMonitorias(
  rows: MonitoriaRow[],
  from: string,
  to: string,
): MonitoriasSummary {
  const filtered = rows.filter((r) => inRange(r.data, from, to));
  const byFila = new Map<string, FilaAgg>();
  let minutos = 0;

  filtered.forEach((r) => {
    minutos += r.tsMin;
    const cur = byFila.get(r.fila) ?? {
      fila: r.fila,
      count: 0,
      minutos: 0,
    };
    cur.count += 1;
    cur.minutos += r.tsMin;
    byFila.set(r.fila, cur);
  });

  const porFila = [...byFila.values()].sort((a, b) => b.minutos - a.minutos);
  const recentes = [...filtered]
    .sort((a, b) => b.registradoEm.localeCompare(a.registradoEm))
    .slice(0, 15);

  return {
    from,
    to,
    count: filtered.length,
    minutos,
    horas: minutos / 60,
    porFila,
    recentes,
  };
}

export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h <= 0) return `${m} min`;
  return `${h}h ${m.toString().padStart(2, "0")}min`;
}

export function shortFila(fila: string): string {
  return fila
    .replace(/^data-labeling-/, "")
    .replace(/^hsp-id-/, "hsp/")
    .replace(/^id-/, "id/");
}
