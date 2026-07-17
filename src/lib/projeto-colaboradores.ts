import { nanoid } from "nanoid";
import { normalizePerson } from "./mentions";
import type { ProjetoColaborador } from "./types";

export function emptyProjetoColaborador(
  partial?: Partial<ProjetoColaborador>,
): ProjetoColaborador {
  return {
    id: nanoid(),
    nome: "",
    ...partial,
  };
}

/** Converte colaboradores legados (string[]) e normaliza objetos parciais. */
export function normalizeProjetoColaboradores(raw: unknown): ProjetoColaborador[] {
  if (!Array.isArray(raw)) return [];

  const out: ProjetoColaborador[] = [];
  raw.forEach((item) => {
    if (typeof item === "string") {
      const nome = item.trim().replace(/^@+/, "");
      if (!nome) return;
      out.push(emptyProjetoColaborador({ nome }));
      return;
    }

    if (item && typeof item === "object") {
      const o = item as Partial<ProjetoColaborador>;
      const nome = o.nome?.trim().replace(/^@+/, "") ?? "";
      if (!nome) return;
      out.push(emptyProjetoColaborador({ id: o.id || nanoid(), nome }));
    }
  });

  return out;
}

export function sanitizeProjetoColaboradores(
  colaboradores: ProjetoColaborador[],
): ProjetoColaborador[] {
  const seen = new Set<string>();
  const out: ProjetoColaborador[] = [];

  for (const c of colaboradores) {
    const nome = c.nome.trim().replace(/^@+/, "");
    if (!nome) continue;
    const key = normalizePerson(nome);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...c, nome });
  }

  return out;
}

export function formatColaboradorDisplay(nome: string): string {
  const bare = nome.trim().replace(/^@+/, "");
  return bare ? `@${bare}` : "";
}

export function colaboradoresSummary(
  colaboradores: ProjetoColaborador[] | undefined,
  max = 2,
): string {
  const names = (colaboradores ?? [])
    .map((c) => c.nome.trim())
    .filter(Boolean);
  if (!names.length) return "";
  if (names.length <= max) return names.map(formatColaboradorDisplay).join(", ");
  const shown = names.slice(0, max).map(formatColaboradorDisplay).join(", ");
  return `${shown} +${names.length - max}`;
}
