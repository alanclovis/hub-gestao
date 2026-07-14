"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CollectionMap, CollectionName } from "@/lib/types";

type Status = "idle" | "loading" | "saving" | "saved" | "error";

export function useCollection<K extends CollectionName>(name: K) {
  const [data, setData] = useState<CollectionMap[K] | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<CollectionMap[K] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setStatus("loading");
        const res = await fetch(`/api/data/${name}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        const json = (await res.json()) as CollectionMap[K];
        if (!cancelled) {
          setData(json);
          latest.current = json;
          setStatus("idle");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erro");
          setStatus("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [name]);

  const persist = useCallback(
    async (next: CollectionMap[K]) => {
      setStatus("saving");
      setError(null);
      try {
        const res = await fetch(`/api/data/${name}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 1200);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar");
        setStatus("error");
      }
    },
    [name],
  );

  const update = useCallback(
    (updater: (prev: CollectionMap[K]) => CollectionMap[K]) => {
      setData((prev) => {
        if (prev === null) return prev;
        const next = updater(prev);
        latest.current = next;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          if (latest.current !== null) {
            void persist(latest.current);
          }
        }, 500);
        return next;
      });
    },
    [persist],
  );

  const saveNow = useCallback(async () => {
    if (latest.current !== null) {
      if (timer.current) clearTimeout(timer.current);
      await persist(latest.current);
    }
  }, [persist]);

  return { data, setData: update, status, error, saveNow };
}

export function useAllData() {
  const [data, setData] = useState<CollectionMap | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/data/all");
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        const json = (await res.json()) as CollectionMap;
        if (!cancelled) {
          setData(json);
          setStatus("idle");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erro");
          setStatus("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, status, error };
}
