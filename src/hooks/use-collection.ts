"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import {
  getAllCollections,
  getCollection,
  putCollection,
} from "@/lib/gist";
import type { CollectionMap, CollectionName } from "@/lib/types";

type Status = "idle" | "loading" | "saving" | "saved" | "error";

export function useCollection<K extends CollectionName>(name: K) {
  const { token } = useAuth();
  const [data, setData] = useState<CollectionMap[K] | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<CollectionMap[K] | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Não autenticado");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setStatus("loading");
        const json = await getCollection(token, name);
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
  }, [name, token]);

  const persist = useCallback(
    async (next: CollectionMap[K]) => {
      if (!token) return;
      setStatus("saving");
      setError(null);
      try {
        await putCollection(token, name, next);
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 1200);
      } catch (err) {
        const raw = err instanceof Error ? err.message : "Erro ao salvar";
        const friendly = raw.includes("409")
          ? "Conflito ao salvar no Gist — tente de novo em 1s"
          : raw;
        setError(friendly);
        setStatus("error");
      }
    },
    [name, token],
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

  return { data, setData: update, status, error };
}

export function useAllData() {
  const { token } = useAuth();
  const [data, setData] = useState<CollectionMap | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Não autenticado");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const json = await getAllCollections(token);
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
  }, [token]);

  return { data, status, error };
}
