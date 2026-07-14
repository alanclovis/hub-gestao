"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AiFeedbackDrawer } from "@/components/ai-feedback-drawer";
import { MentionText } from "@/components/mention-text";
import { SaveBadge } from "@/components/save-badge";
import { useCollection } from "@/hooks/use-collection";
import { collectPeople, findPersonHits } from "@/lib/mentions";

const kindLabel = {
  feedback: "Feedback",
  atividade: "Atividade",
  projeto: "Projeto",
  update: "Update",
} as const;

export default function PessoasPage() {
  const { data: feedbacks, status, error } = useCollection("feedbacks");
  const { data: atividades } = useCollection("atividades");
  const { data: projetos } = useCollection("projetos");
  const { data: oneones } = useCollection("oneones");
  const [pessoa, setPessoa] = useState("");
  const [busca, setBusca] = useState("");
  const [aiOpen, setAiOpen] = useState(false);

  const people = useMemo(
    () =>
      collectPeople({
        feedbacks,
        atividades,
        projetos,
        oneones,
      }),
    [feedbacks, atividades, projetos, oneones],
  );

  const filteredPeople = useMemo(() => {
    const q = busca.trim().toLowerCase().replace(/^@/, "");
    if (!q) return people;
    return people.filter((p) => p.toLowerCase().includes(q));
  }, [people, busca]);

  const personHits = useMemo(
    () =>
      pessoa
        ? findPersonHits(pessoa, {
            feedbacks,
            atividades,
            projetos,
          })
        : [],
    [pessoa, feedbacks, atividades, projetos],
  );

  const openPrompt = () => {
    if (!pessoa) {
      window.alert("Escolha uma pessoa primeiro.");
      return;
    }
    if (personHits.length === 0) {
      window.alert(`Nenhuma menção encontrada para @${pessoa}.`);
      return;
    }
    setAiOpen(true);
  };

  return (
    <>
      <header className="hub-page-head">
        <div>
          <p className="hub-kicker">Menções</p>
          <h1>Pessoas</h1>
          <p>
            Busque quem você mencionou e monte um prompt de feedback para o
            Claude.
          </p>
        </div>
        <SaveBadge status={status} error={error} />
      </header>

      <div className="list-toolbar">
        <input
          className="list-filter"
          placeholder="Buscar pessoa…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          aria-label="Buscar pessoa"
        />
        <select
          className="list-filter list-filter-sm"
          value={pessoa}
          onChange={(e) => setPessoa(e.target.value)}
          aria-label="Selecionar pessoa"
        >
          <option value="">Escolher pessoa</option>
          {filteredPeople.map((p) => (
            <option key={p} value={p}>
              @{p}
            </option>
          ))}
        </select>
      </div>

      {!pessoa ? (
        <>
          {people.length === 0 ? (
            <p className="empty-hint">
              Nenhuma pessoa ainda. Use @Nome em atividades ou updates de
              projeto.
            </p>
          ) : (
            <div className="list-stack">
              {filteredPeople.map((p) => (
                <button
                  type="button"
                  key={p}
                  className="list-item"
                  onClick={() => setPessoa(p)}
                  style={{ textAlign: "left", width: "100%" }}
                >
                  <h3>@{p}</h3>
                  <p className="meta">Ver menções</p>
                </button>
              ))}
              {filteredPeople.length === 0 ? (
                <p className="empty-hint">Ninguém encontrado para “{busca}”.</p>
              ) : null}
            </div>
          )}
        </>
      ) : (
        <section className="overview-panel">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "1rem",
              flexWrap: "wrap",
              marginBottom: "0.75rem",
            }}
          >
            <h2 style={{ margin: 0 }}>Menções de @{pessoa}</h2>
            <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className="hub-primary-btn"
                onClick={openPrompt}
                disabled={personHits.length === 0}
              >
                Gerar prompt
              </button>
              <button
                type="button"
                className="hub-ghost-btn"
                onClick={() => setPessoa("")}
              >
                Limpar
              </button>
            </div>
          </div>
          {personHits.length === 0 ? (
            <p className="empty-hint">Nada encontrado com @{pessoa}.</p>
          ) : (
            <ul className="overview-list">
              {personHits.map((h) => (
                <li key={h.id}>
                  <Link href={h.href}>
                    <span>
                      [{kindLabel[h.kind]}]{" "}
                      <MentionText text={h.titulo} />
                    </span>
                  </Link>
                  <span className="muted">
                    {h.data} · {h.detalhe}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <AiFeedbackDrawer
        open={aiOpen}
        pessoa={pessoa}
        hits={personHits}
        onClose={() => setAiOpen(false)}
      />
    </>
  );
}
