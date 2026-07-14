import { defaultCollections, fileNameFor, parseCollection } from "./schema";
import {
  GIST_DESCRIPTION,
  type CollectionMap,
  type CollectionName,
} from "./types";

const GH_API = "https://api.github.com";

type GistFile = { content?: string; filename?: string };
type GistResponse = {
  id: string;
  description: string;
  files: Record<string, GistFile>;
};

async function gh<T>(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${GH_API}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status}: ${text}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

function buildFilesPayload(data: CollectionMap): Record<string, { content: string }> {
  const files: Record<string, { content: string }> = {};
  (Object.keys(data) as (keyof CollectionMap)[]).forEach((key) => {
    files[fileNameFor(key)] = {
      content: JSON.stringify(data[key], null, 2),
    };
  });
  return files;
}

export async function findHubGist(
  token: string,
): Promise<GistResponse | null> {
  // List first pages of gists looking for our description
  for (let page = 1; page <= 5; page++) {
    const gists = await gh<GistResponse[]>(
      token,
      `/gists?per_page=100&page=${page}`,
    );
    if (!gists.length) break;
    const match = gists.find((g) => g.description === GIST_DESCRIPTION);
    if (match) {
      return gh<GistResponse>(token, `/gists/${match.id}`);
    }
  }
  return null;
}

export async function createHubGist(token: string): Promise<GistResponse> {
  const defaults = defaultCollections();
  defaults.meta.lastSync = new Date().toISOString();
  const created = await gh<GistResponse>(token, "/gists", {
    method: "POST",
    body: JSON.stringify({
      description: GIST_DESCRIPTION,
      public: false,
      files: buildFilesPayload(defaults),
    }),
  });
  const withMeta = {
    ...defaults,
    meta: {
      ...defaults.meta,
      gistId: created.id,
      lastSync: new Date().toISOString(),
    },
  };
  return gh<GistResponse>(token, `/gists/${created.id}`, {
    method: "PATCH",
    body: JSON.stringify({ files: buildFilesPayload(withMeta) }),
  });
}

export async function ensureHubGist(token: string): Promise<GistResponse> {
  const existing = await findHubGist(token);
  if (existing) return existing;
  return createHubGist(token);
}

export function readCollectionFromGist<K extends CollectionName>(
  gist: GistResponse,
  name: K,
): CollectionMap[K] {
  const file = gist.files[fileNameFor(name)];
  return parseCollection(name, file?.content);
}

export async function getCollection<K extends CollectionName>(
  token: string,
  name: K,
): Promise<CollectionMap[K]> {
  const gist = await ensureHubGist(token);
  return readCollectionFromGist(gist, name);
}

export async function getAllCollections(
  token: string,
): Promise<CollectionMap> {
  const gist = await ensureHubGist(token);
  return {
    projetos: readCollectionFromGist(gist, "projetos"),
    oneones: readCollectionFromGist(gist, "oneones"),
    feedbacks: readCollectionFromGist(gist, "feedbacks"),
    pendencias: readCollectionFromGist(gist, "pendencias"),
    meta: {
      ...readCollectionFromGist(gist, "meta"),
      gistId: gist.id,
    },
  };
}

export async function putCollection<K extends CollectionName>(
  token: string,
  name: K,
  data: CollectionMap[K],
): Promise<CollectionMap[K]> {
  const gist = await ensureHubGist(token);
  const meta = {
    ...readCollectionFromGist(gist, "meta"),
    gistId: gist.id,
    lastSync: new Date().toISOString(),
  };
  await gh<GistResponse>(token, `/gists/${gist.id}`, {
    method: "PATCH",
    body: JSON.stringify({
      files: {
        [fileNameFor(name)]: {
          content: JSON.stringify(data, null, 2),
        },
        [fileNameFor("meta")]: {
          content: JSON.stringify(meta, null, 2),
        },
      },
    }),
  });
  return data;
}

export async function putAllCollections(
  token: string,
  data: Omit<CollectionMap, "meta"> & { meta?: CollectionMap["meta"] },
): Promise<CollectionMap> {
  const gist = await ensureHubGist(token);
  const full: CollectionMap = {
    projetos: data.projetos,
    oneones: data.oneones,
    feedbacks: data.feedbacks,
    pendencias: data.pendencias,
    meta: {
      schemaVersion: data.meta?.schemaVersion ?? 1,
      gistId: gist.id,
      lastSync: new Date().toISOString(),
    },
  };
  await gh<GistResponse>(token, `/gists/${gist.id}`, {
    method: "PATCH",
    body: JSON.stringify({ files: buildFilesPayload(full) }),
  });
  return full;
}
