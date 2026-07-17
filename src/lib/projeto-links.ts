import { nanoid } from "nanoid";
import type { ProjetoLink } from "./types";

export const PROJETO_LINK_PRESETS = [
  "Planilha",
  "App Script",
  "Base de dados",
  "Cursor",
  "Dashboard",
  "Documentação",
  "Repositório",
] as const;

export function emptyProjetoLink(partial?: Partial<ProjetoLink>): ProjetoLink {
  return {
    id: nanoid(),
    label: "",
    url: "",
    ...partial,
  };
}

function guessLabelFromUrl(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes("docs.google.com/spreadsheets")) return "Planilha";
  if (lower.includes("script.google.com")) return "App Script";
  if (lower.includes("cursor.com") || lower.includes("cursor.sh")) return "Cursor";
  if (
    lower.includes("supabase") ||
    lower.includes("database") ||
    lower.includes("databricks")
  ) {
    return "Base de dados";
  }
  if (lower.includes("github.com")) return "Repositório";
  if (lower.includes("docs.google.com/document")) return "Documentação";
  return "";
}

/** Converte links legados (string[]) e normaliza objetos parciais. */
export function normalizeProjetoLinks(raw: unknown): ProjetoLink[] {
  if (!Array.isArray(raw)) return [];

  const out: ProjetoLink[] = [];
  raw.forEach((item, index) => {
    if (typeof item === "string") {
      const url = item.trim();
      if (!url) return;
      out.push(
        emptyProjetoLink({
          label: guessLabelFromUrl(url) || `Link ${index + 1}`,
          url,
        }),
      );
      return;
    }

    if (item && typeof item === "object") {
      const o = item as Partial<ProjetoLink>;
      const url = o.url?.trim() ?? "";
      if (!url) return;
      out.push(
        emptyProjetoLink({
          id: o.id || nanoid(),
          label: o.label?.trim() || guessLabelFromUrl(url) || `Link ${index + 1}`,
          url,
        }),
      );
    }
  });

  return out;
}

export function formatProjetoLinkHref(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function sanitizeProjetoLinks(links: ProjetoLink[]): ProjetoLink[] {
  return links
    .map((link) => {
      const url = link.url.trim();
      if (!url) return null;
      return {
        ...link,
        label: link.label.trim() || guessLabelFromUrl(url) || "Link",
        url,
      };
    })
    .filter((link): link is ProjetoLink => link !== null);
}
