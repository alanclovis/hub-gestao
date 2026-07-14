/** Planilha de tempos de monitoria de qualidade (CSV público). */
export const MONITORIAS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1t0F5B1NdinpGMLW1wTUiWMecAD6uPVChFTYOh7PR2bo/export?format=csv&gid=0";

export const MONITORIAS_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1t0F5B1NdinpGMLW1wTUiWMecAD6uPVChFTYOh7PR2bo/edit?gid=0#gid=0";

export type MonitoriasPeriod = "hoje" | "semana" | "mes" | "custom";

/** Slot dimensionado = bloco de 30 minutos (ocorrência data+horário). */
export const SLOT_MINUTES = 30;

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
  label: string;
  count: number;
  minutos: number;
  mediaPorCaso: number;
}

export interface SlotAgg {
  slot: string;
  count: number;
  minutos: number;
  /** Quantas ocorrências (dias) desse horário no período. */
  ocorrencias: number;
  /** TS médio por ocorrência (cap = 30 min). */
  mediaPorOcorrencia: number;
}

export interface MonitoriasSummary {
  from: string;
  to: string;
  count: number;
  minutos: number;
  mediaPorCaso: number;
  /** Ocorrências únicas de (data, slot). */
  slotsAtivos: number;
  /** Capacidade dimensionada: slots × 30 min. */
  capacidadeMin: number;
  /** TS / capacidade (pode passar de 100%). */
  ocupacaoPct: number;
  casosPorSlot: number;
  tsPorSlot: number;
  porFila: FilaAgg[];
  porSlot: SlotAgg[];
  recentes: MonitoriaRow[];
  geradoEm: string;
}

function parsePtNumber(raw: string): number {
  const cleaned = raw.trim().replace(/^"|"$/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function parseMonitoriasCsv(text: string): MonitoriaRow[] {
  const lines = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const rows: MonitoriaRow[] = [];
  for (let i = 1; i < lines.length; i++) {
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
      "Planilha inacessível — compartilhe como “Qualquer pessoa com o link” (leitor).",
    );
  }
  return parseMonitoriasCsv(text);
}

function inRange(date: string, from: string, to: string): boolean {
  return date >= from && date <= to;
}

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
}

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function monitoriasPeriodRange(
  period: MonitoriasPeriod,
  custom?: { from: string; to: string },
  now = new Date(),
): { from: string; to: string } {
  if (period === "custom" && custom?.from && custom?.to) {
    return { from: custom.from, to: custom.to };
  }
  const to = toYmd(now);
  if (period === "hoje") {
    return { from: to, to };
  }
  if (period === "mes") {
    return { from: toYmd(new Date(now.getFullYear(), now.getMonth(), 1)), to };
  }
  // semana = segunda → hoje (alinhado ao print Quality Insights)
  const fromDate = startOfWeek(now);
  const toDate = new Date(fromDate);
  toDate.setDate(fromDate.getDate() + 6);
  return { from: toYmd(fromDate), to: toYmd(toDate) };
}

export function summarizeMonitorias(
  rows: MonitoriaRow[],
  from: string,
  to: string,
): MonitoriasSummary {
  const filtered = rows.filter((r) => inRange(r.data, from, to));
  const byFila = new Map<string, { count: number; minutos: number }>();
  const bySlot = new Map<
    string,
    { count: number; minutos: number; datas: Set<string> }
  >();
  const ocorrencias = new Set<string>();
  let minutos = 0;

  filtered.forEach((r) => {
    minutos += r.tsMin;
    ocorrencias.add(`${r.data}|${r.slot}`);

    const f = byFila.get(r.fila) ?? { count: 0, minutos: 0 };
    f.count += 1;
    f.minutos += r.tsMin;
    byFila.set(r.fila, f);

    const s = bySlot.get(r.slot) ?? {
      count: 0,
      minutos: 0,
      datas: new Set<string>(),
    };
    s.count += 1;
    s.minutos += r.tsMin;
    s.datas.add(r.data);
    bySlot.set(r.slot, s);
  });

  const count = filtered.length;
  // Slot dimensionado = cada (data, horário), não só o rótulo 08:00 no período.
  const slotsAtivos = ocorrencias.size;
  const capacidadeMin = slotsAtivos * SLOT_MINUTES;
  const mediaPorCaso = count ? minutos / count : 0;
  const casosPorSlot = slotsAtivos ? count / slotsAtivos : 0;
  const tsPorSlot = slotsAtivos ? minutos / slotsAtivos : 0;
  const ocupacaoPct = capacidadeMin ? (minutos / capacidadeMin) * 100 : 0;

  const porFila: FilaAgg[] = [...byFila.entries()]
    .map(([fila, v]) => ({
      fila,
      label: prettyFila(fila),
      count: v.count,
      minutos: v.minutos,
      mediaPorCaso: v.count ? v.minutos / v.count : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const porSlot: SlotAgg[] = [...bySlot.entries()]
    .map(([slot, v]) => {
      const occ = v.datas.size;
      return {
        slot,
        count: v.count,
        minutos: v.minutos,
        ocorrencias: occ,
        mediaPorOcorrencia: occ ? v.minutos / occ : 0,
      };
    })
    .sort((a, b) => a.slot.localeCompare(b.slot));

  const recentes = [...filtered]
    .sort((a, b) => b.registradoEm.localeCompare(a.registradoEm))
    .slice(0, 15);

  return {
    from,
    to,
    count,
    minutos,
    mediaPorCaso,
    slotsAtivos,
    capacidadeMin,
    ocupacaoPct,
    casosPorSlot,
    tsPorSlot,
    porFila,
    porSlot,
    recentes,
    geradoEm: new Date().toLocaleString("pt-BR"),
  };
}

/** Ex.: 132.9m */
export function formatMinDec(min: number, digits = 1): string {
  return `${min.toFixed(digits)}m`;
}

export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h <= 0) return `${m} min`;
  return `${h}h ${m.toString().padStart(2, "0")}min`;
}

export function prettyFila(fila: string): string {
  const f = fila
    .replace(/^data-labeling-/, "")
    .replace(/catchandrelease/gi, "catch & release")
    .replace(/catch-and-release/gi, "catch & release")
    .replace(/-/g, " · ");
  return f;
}

export function shortFila(fila: string): string {
  return prettyFila(fila);
}

export function toInputDate(ymd: string): string {
  return ymd;
}

export function formatBrDate(ymd: string): string {
  const [y, m, d] = ymd.split("-");
  if (!y || !m || !d) return ymd;
  return `${d}/${m}/${y}`;
}
