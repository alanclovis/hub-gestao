"use client";

import { useEffect, useState } from "react";
import { buildClaudePersonPrompt } from "@/lib/ai";
import type { PersonHit } from "@/lib/mentions";

export function AiFeedbackDrawer({
  open,
  pessoa,
  hits,
  onClose,
}: {
  open: boolean;
  pessoa: string;
  hits: PersonHit[];
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCopied(false);
    try {
      setText(buildClaudePersonPrompt(pessoa, hits));
      setError(null);
    } catch (err) {
      setText("");
      setError(err instanceof Error ? err.message : "Falha ao montar o prompt");
    }
  }, [open, pessoa, hits]);

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

  const label = pessoa.replace(/^@+/, "");

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer" aria-label="Prompt para Claude">
        <div className="drawer-head">
          <div>
            <p className="hub-kicker">Claude</p>
            <h2>Prompt para @{label}</h2>
          </div>
          <button type="button" className="hub-ghost-btn" onClick={onClose}>
            Fechar
          </button>
        </div>
        <div className="drawer-scroll">
          <p className="empty-hint" style={{ marginBottom: "0.75rem" }}>
            Copie e cole em claude.ai. O texto já inclui {hits.length} registro
            {hits.length === 1 ? "" : "s"} sobre @{label}.
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
