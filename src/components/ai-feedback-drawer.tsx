"use client";

import { useEffect, useState } from "react";
import {
  generateFeedbackSummary,
  getAnthropicKey,
  toFeedbackContext,
  type FeedbackContextItem,
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
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setStatus("loading");
    setError(null);
    setText("");
    setCopied(false);

    const ctx: FeedbackContextItem[] = toFeedbackContext(
      atividades,
      projetoTitulo,
    );
    const key = getAnthropicKey();

    void generateFeedbackSummary(ctx, key)
      .then((out) => {
        if (cancelled) return;
        setText(out);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Falha ao gerar");
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
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
      <aside className="drawer" aria-label="Feedback gerado por IA">
        <div className="drawer-head">
          <div>
            <p className="hub-kicker">Claude</p>
            <h2>Feedback resumido</h2>
          </div>
          <button type="button" className="hub-ghost-btn" onClick={onClose}>
            Fechar
          </button>
        </div>
        <div className="drawer-scroll">
          <p className="empty-hint" style={{ marginBottom: "0.75rem" }}>
            Com base em {atividades.length} atividade
            {atividades.length === 1 ? "" : "s"} selecionada
            {atividades.length === 1 ? "" : "s"}. Edite antes de copiar se
            quiser.
          </p>
          {status === "loading" ? (
            <p className="empty-hint">Gerando com Claude…</p>
          ) : null}
          {status === "error" ? (
            <p className="empty-hint" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          ) : null}
          {status === "ready" || status === "error" ? (
            <div className="field">
              <label htmlFor="ai-feedback-text">Texto</label>
              <textarea
                id="ai-feedback-text"
                rows={10}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
          ) : null}
        </div>
        <div className="drawer-footer">
          <div className="drawer-actions">
            <button
              type="button"
              className="hub-primary-btn"
              onClick={() => void copy()}
              disabled={!text.trim()}
            >
              {copied ? "Copiado" : "Copiar"}
            </button>
            <button type="button" className="hub-secondary-btn" onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
