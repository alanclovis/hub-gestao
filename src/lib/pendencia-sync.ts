import { nanoid } from "nanoid";
import type { Pendencia, Projeto, ProjetoUpdate } from "./types";

/** Ao concluir uma pendência vinculada, registra update no projeto. */
export function appendPendenciaConcluidaUpdate(
  projetos: Projeto[],
  pendencia: Pendencia,
): Projeto[] {
  if (!pendencia.projetoId) return projetos;
  const day = new Date().toISOString().slice(0, 10);
  const update: ProjetoUpdate = {
    id: nanoid(),
    date: day,
    oQueFiz: `Pendência concluída: ${pendencia.titulo.trim() || "Sem título"}`,
    decisao: "",
    evidencia: "",
    resultado: pendencia.notas?.trim() || "Concluída",
  };
  return projetos.map((p) =>
    p.id === pendencia.projetoId
      ? {
          ...p,
          updates: [update, ...p.updates],
          updatedAt: new Date().toISOString(),
        }
      : p,
  );
}
