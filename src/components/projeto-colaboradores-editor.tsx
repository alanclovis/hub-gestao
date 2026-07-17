"use client";

import { useId } from "react";
import { emptyProjetoColaborador } from "@/lib/projeto-colaboradores";
import type { ProjetoColaborador } from "@/lib/types";

export function ProjetoColaboradoresEditor({
  colaboradores,
  people,
  onChange,
}: {
  colaboradores: ProjetoColaborador[];
  people: string[];
  onChange: (colaboradores: ProjetoColaborador[]) => void;
}) {
  const listId = useId();

  const patchColaborador = (id: string, nome: string) => {
    onChange(
      colaboradores.map((c) => (c.id === id ? { ...c, nome } : c)),
    );
  };

  const removeColaborador = (id: string) => {
    onChange(colaboradores.filter((c) => c.id !== id));
  };

  const addColaborador = () => {
    onChange([...colaboradores, emptyProjetoColaborador()]);
  };

  return (
    <div className="proj-colabs">
      {colaboradores.length === 0 ? (
        <p className="empty-hint proj-colabs-empty">
          Nenhum colaborador ainda. Adicione quem participa do projeto com você.
        </p>
      ) : (
        <ul className="proj-colabs-list">
          {colaboradores.map((c) => (
            <li key={c.id} className="proj-colab-row">
              <label className="proj-colab-field">
                <span>Nome</span>
                <input
                  list={listId}
                  value={c.nome}
                  placeholder="Ex.: Ana"
                  onChange={(e) => patchColaborador(c.id, e.target.value)}
                />
              </label>
              <button
                type="button"
                className="hub-ghost-btn proj-colab-remove"
                onClick={() => removeColaborador(c.id)}
                title="Remover colaborador"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <datalist id={listId}>
        {people.map((person) => (
          <option key={person} value={person} />
        ))}
      </datalist>

      <button type="button" className="hub-secondary-btn" onClick={addColaborador}>
        + Adicionar colaborador
      </button>
    </div>
  );
}
