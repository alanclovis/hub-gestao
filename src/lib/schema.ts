import {
  SCHEMA_VERSION,
  type CollectionMap,
  type Feedback,
  type Meta,
  type OneOnOne,
  type Pendencia,
  type Projeto,
} from "./types";

export function emptyMeta(): Meta {
  return {
    schemaVersion: SCHEMA_VERSION,
    lastSync: new Date().toISOString(),
  };
}

export function defaultCollections(): CollectionMap {
  return {
    projetos: [],
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
  return Array.isArray(data) ? (data as Projeto[]) : [];
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
