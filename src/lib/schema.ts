import {
  SCHEMA_VERSION,
  type Atividade,
  type CollectionMap,
  type Feedback,
  type Meta,
  type OneOnOne,
  type Pendencia,
  type Projeto,
} from "./types";
import { normalizeProjetoLinks } from "./projeto-links";
import { normalizeProjetoColaboradores } from "./projeto-colaboradores";

export function emptyMeta(): Meta {
  return {
    schemaVersion: SCHEMA_VERSION,
    lastSync: new Date().toISOString(),
  };
}

export function defaultCollections(): CollectionMap {
  return {
    projetos: [],
    atividades: [],
    oneones: [],
    feedbacks: [],
    pendencias: [],
    meta: emptyMeta(),
  };
}

export function parseCollection<K extends keyof CollectionMap>(
  name: K,
  raw: string | undefined,
): CollectionMap[K] {
  if (!raw) {
    return defaultCollections()[name];
  }
  try {
    return JSON.parse(raw) as CollectionMap[K];
  } catch {
    return defaultCollections()[name];
  }
}

export function fileNameFor(collection: keyof CollectionMap): string {
  return `${collection}.json`;
}

export function ensureProjetos(data: unknown): Projeto[] {
  if (!Array.isArray(data)) return [];
  return data.map((item) => {
    const p = item as Projeto;
    return {
      ...p,
      links: normalizeProjetoLinks(p.links),
      colaboradores: normalizeProjetoColaboradores(p.colaboradores),
    };
  });
}

export function ensureAtividades(data: unknown): Atividade[] {
  return Array.isArray(data) ? (data as Atividade[]) : [];
}

export function ensureOneOnes(data: unknown): OneOnOne[] {
  return Array.isArray(data) ? (data as OneOnOne[]) : [];
}

export function ensureFeedbacks(data: unknown): Feedback[] {
  return Array.isArray(data) ? (data as Feedback[]) : [];
}

export function ensurePendencias(data: unknown): Pendencia[] {
  return Array.isArray(data) ? (data as Pendencia[]) : [];
}
