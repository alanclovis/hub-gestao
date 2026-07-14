"use client";

import { useEffect, useState } from "react";
import {
  buildClaudeFeedbackPrompt,
  toFeedbackContext,
} from "@/lib/ai";
import type { Atividade } from "@/lib/types";

export function AiFeedbackDrawer({
  open,
  atividades,
  projetoTitulo,
  onClose,
}: {
  open: boolean;
  atividades: Atividade[];
  projetoTitulo: (id?: string) => string;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCopied(false);
    try {
      const prompt = buildClaudeFeedbackPrompt(
        toFeedbackContext(atividades, projetoTitulo),
      );
      setText(prompt);
      setError(null);
    } catch (err) {
      setText("");
      setError(err instanceof Error ? err.message : "Falha ao montar o prompt");
    }
  }, [open, atividades, projetoTitulo]);

  if (!open) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      window.alert("Não foi possível copiar. Selecione o texto manualmente.");
    }
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer" aria-label="Prompt para Claude">
        <div className="drawer-head">
          <div>
            <p className="hub-kicker">Claude</p>
            <h2>Prompt pronto</h2>
          </div>
          <button type="button" className="hub-ghost-btn" onClick={onClose}>
            Fechar
          </button>
        </div>
        <div className="drawer-scroll">
          <p className="empty-hint" style={{ marginBottom: "0.75rem" }}>
            Copie e cole em claude.ai (ou no app). O texto já inclui as{" "}
            {atividades.length} atividade
            {atividades.length === 1 ? "" : "s"} selecionada
            {atividades.length === 1 ? "" : "s"}.
          </p>
          {error ? (
            <p className="empty-hint" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          ) : (
            <div className="field">
              <label htmlFor="ai-feedback-prompt">Prompt</label>
              <textarea
                id="ai-feedback-prompt"
                rows={14}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="drawer-footer">
          <div className="drawer-actions">
            <button
              type="button"
              className="hub-primary-btn"
              onClick={() => void copy()}
              disabled={!text.trim()}
            >
              {copied ? "Copiado" : "Copiar prompt"}
            </button>
            <a
              className="hub-secondary-btn"
              href="https://claude.ai/new"
              target="_blank"
              rel="noreferrer"
            >
              Abrir Claude
            </a>
            <button type="button" className="hub-ghost-btn" onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
