import { nanoid } from "nanoid";
import type { Atividade, Projeto, ProjetoUpdate } from "./types";

export function atividadeToUpdate(a: Atividade, updateId: string): ProjetoUpdate {
  return {
    id: updateId,
    date: a.date,
    oQueFiz: a.titulo,
    decisao: a.decisao ?? "",
    evidencia: a.evidencia ?? "",
    resultado: a.resultado ?? "",
  };
}

export function updateToAtividadePatch(
  update: ProjetoUpdate,
): Pick<Atividade, "titulo" | "date" | "decisao" | "evidencia" | "resultado"> {
  return {
    titulo: update.oQueFiz,
    date: update.date,
    decisao: update.decisao,
    evidencia: update.evidencia,
    resultado: update.resultado,
  };
}

/** Aplica atividade nos projetos: upsert/remove update espelhado. */
export function syncAtividadeIntoProjetos(
  projetos: Projeto[],
  atividade: Atividade,
  previous?: Atividade | null,
): { projetos: Projeto[]; atividade: Atividade } {
  let next = projetos.map((p) => ({ ...p, updates: [...p.updates] }));

  // Remove espelho antigo se mudou de projeto ou desvinculou
  const oldUpdateId = previous?.linkedUpdateId ?? atividade.linkedUpdateId;
  const oldProjetoId = previous?.projetoId;
  if (oldUpdateId && oldProjetoId && oldProjetoId !== atividade.projetoId) {
    next = next.map((p) =>
      p.id === oldProjetoId
        ? {
            ...p,
            updates: p.updates.filter((u) => u.id !== oldUpdateId),
            updatedAt: new Date().toISOString(),
          }
        : p,
    );
  }

  if (!atividade.projetoId) {
    if (oldUpdateId && oldProjetoId) {
      next = next.map((p) =>
        p.id === oldProjetoId
          ? {
              ...p,
              updates: p.updates.filter((u) => u.id !== oldUpdateId),
              updatedAt: new Date().toISOString(),
            }
          : p,
      );
    }
    return {
      projetos: next,
      atividade: { ...atividade, linkedUpdateId: undefined },
    };
  }

  const updateId = atividade.linkedUpdateId || oldUpdateId || nanoid();
  const mirror = atividadeToUpdate(atividade, updateId);

  next = next.map((p) => {
    if (p.id !== atividade.projetoId) return p;
    const exists = p.updates.some((u) => u.id === updateId);
    const updates = exists
      ? p.updates.map((u) => (u.id === updateId ? mirror : u))
      : [mirror, ...p.updates];
    return { ...p, updates, updatedAt: new Date().toISOString() };
  });

  return {
    projetos: next,
    atividade: { ...atividade, linkedUpdateId: updateId },
  };
}

export function removeAtividadeMirror(
  projetos: Projeto[],
  atividade: Atividade,
): Projeto[] {
  if (!atividade.linkedUpdateId || !atividade.projetoId) return projetos;
  return projetos.map((p) =>
    p.id === atividade.projetoId
      ? {
          ...p,
          updates: p.updates.filter((u) => u.id !== atividade.linkedUpdateId),
          updatedAt: new Date().toISOString(),
        }
      : p,
  );
}

/** Quando um update é editado/excluído no projeto, espelha na atividade. */
export function syncUpdateIntoAtividades(
  atividades: Atividade[],
  payload: {
    action: "upsert" | "delete";
    update?: ProjetoUpdate;
    updateId?: string;
  },
): Atividade[] {
  if (payload.action === "delete") {
    const id = payload.updateId;
    if (!id) return atividades;
    return atividades.map((a) =>
      a.linkedUpdateId === id
        ? {
            ...a,
            linkedUpdateId: undefined,
            projetoId: undefined,
            updatedAt: new Date().toISOString(),
          }
        : a,
    );
  }

  const update = payload.update;
  if (!update) return atividades;
  const patch = updateToAtividadePatch(update);
  return atividades.map((a) =>
    a.linkedUpdateId === update.id
      ? { ...a, ...patch, updatedAt: new Date().toISOString() }
      : a,
  );
}
