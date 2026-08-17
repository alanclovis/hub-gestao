import { defaultCollections, fileNameFor, parseCollection } from "./schema";
import { githubApiUrl } from "./github-api";
import {
  GIST_DESCRIPTION,
  SCHEMA_VERSION,
  type CollectionMap,
  type CollectionName,
} from "./types";

type GistFile = { content?: string; filename?: string };
type GistResponse = {
  id: string;
  description: string;
  files: Record<string, GistFile>;
};

/** Serializa writes no Gist — evita HTTP 409 por PATCH concorrente. */
let writeChain: Promise<void> = Promise.resolve();

function enqueueWrite<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeChain.then(fn, fn);
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function gh<T>(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const hasBody = init?.body != null;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (hasBody || (method !== "GET" && method !== "HEAD")) {
    headers["Content-Type"] = "application/json";
  }

  let res: Response;
  try {
    res = await fetch(githubApiUrl(path), {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(
        "Não foi possível falar com a API do GitHub (Failed to fetch). " +
          "Pode ser outage (githubstatus.com) ou rede/VPN. Na corporativa: npm run local",
      );
    }
    throw err;
  }

  if (!res.ok) {
    const text = await res.text();
    if (res.status >= 500) {
      throw new Error(
        `API do GitHub instável (HTTP ${res.status}). Veja https://www.githubstatus.com`,
      );
    }
    throw new Error(`GitHub API ${res.status}: ${text}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

function isConflict(err: unknown): boolean {
  return err instanceof Error && err.message.includes("GitHub API 409");
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
    atividades: readCollectionFromGist(gist, "atividades"),
    oneones: readCollectionFromGist(gist, "oneones"),
    feedbacks: readCollectionFromGist(gist, "feedbacks"),
    pendencias: readCollectionFromGist(gist, "pendencias"),
    meta: {
      ...readCollectionFromGist(gist, "meta"),
      gistId: gist.id,
    },
  };
}

async function patchGistFiles(
  token: string,
  gistId: string,
  files: Record<string, { content: string }>,
): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      await gh<GistResponse>(token, `/gists/${gistId}`, {
        method: "PATCH",
        body: JSON.stringify({ files }),
      });
      return;
    } catch (err) {
      lastError = err;
      if (!isConflict(err) || attempt === 3) break;
      await sleep(250 * (attempt + 1));
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Falha ao gravar no Gist");
}

export async function putCollection<K extends CollectionName>(
  token: string,
  name: K,
  data: CollectionMap[K],
): Promise<CollectionMap[K]> {
  return enqueueWrite(async () => {
    const gist = await ensureHubGist(token);

    if (name === "meta") {
      const stamped: CollectionMap["meta"] = {
        ...(data as CollectionMap["meta"]),
        gistId: gist.id,
        lastSync: new Date().toISOString(),
        schemaVersion: SCHEMA_VERSION,
      };
      await patchGistFiles(token, gist.id, {
        [fileNameFor("meta")]: {
          content: JSON.stringify(stamped, null, 2),
        },
      });
      return stamped as CollectionMap[K];
    }

    const meta: CollectionMap["meta"] = {
      ...readCollectionFromGist(gist, "meta"),
      gistId: gist.id,
      lastSync: new Date().toISOString(),
      schemaVersion: SCHEMA_VERSION,
    };
    await patchGistFiles(token, gist.id, {
      [fileNameFor(name)]: {
        content: JSON.stringify(data, null, 2),
      },
      [fileNameFor("meta")]: {
        content: JSON.stringify(meta, null, 2),
      },
    });
    return data;
  });
}

export async function putAllCollections(
  token: string,
  data: Omit<CollectionMap, "meta"> & { meta?: CollectionMap["meta"] },
): Promise<CollectionMap> {
  return enqueueWrite(async () => {
    const gist = await ensureHubGist(token);
    const full: CollectionMap = {
      projetos: data.projetos,
      atividades: data.atividades ?? [],
      oneones: data.oneones,
      feedbacks: data.feedbacks,
      pendencias: data.pendencias,
      meta: {
        schemaVersion: data.meta?.schemaVersion ?? SCHEMA_VERSION,
        gistId: gist.id,
        lastSync: new Date().toISOString(),
      },
    };
    await patchGistFiles(token, gist.id, buildFilesPayload(full));
    return full;
  });
}
