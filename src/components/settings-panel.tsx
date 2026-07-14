"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { getAnthropicKey, setAnthropicKey } from "@/lib/ai";
import type { ThemeId } from "@/lib/theme";

export function SettingsPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { themeId, themes, setThemeId } = useTheme();
  const [anthropicKey, setAnthropicKeyDraft] = useState("");

  useEffect(() => {
    if (open) setAnthropicKeyDraft(getAnthropicKey());
  }, [open]);

  if (!open) return null;

  const saveKey = () => {
    setAnthropicKey(anthropicKey);
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer settings-drawer" aria-label="Configurações">
        <div className="drawer-head">
          <div>
            <p className="hub-kicker">Preferências</p>
            <h2>Configurações</h2>
          </div>
          <button type="button" className="hub-ghost-btn" onClick={onClose}>
            Fechar
          </button>
        </div>
        <div className="drawer-scroll">
          <section className="settings-section">
            <h3>Cores do hub</h3>
            <p className="empty-hint">
              Escolha uma paleta. A cor de marca-texto das @menções acompanha o
              tema.
            </p>
            <div className="theme-grid">
              {themes.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  className={`theme-card${themeId === t.id ? " is-active" : ""}`}
                  onClick={() => setThemeId(t.id as ThemeId)}
                  aria-pressed={themeId === t.id}
                >
                  <span
                    className="theme-swatch"
                    style={{ background: t.swatch }}
                    aria-hidden
                  />
                  <span className="theme-label">{t.label}</span>
                  <span
                    className="theme-mention-preview mention-mark"
                    style={{
                      background: t.vars["--mention-bg"],
                      color: t.vars["--mention-fg"],
                    }}
                  >
                    @Nome
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="settings-section">
            <h3>Claude (Anthropic)</h3>
            <p className="empty-hint">
              Chave usada para gerar feedback a partir de atividades
              selecionadas. Fica só neste browser.
            </p>
            <div className="field">
              <label htmlFor="anthropic-key">API key</label>
              <input
                id="anthropic-key"
                type="password"
                autoComplete="off"
                placeholder="sk-ant-…"
                value={anthropicKey}
                onChange={(e) => setAnthropicKeyDraft(e.target.value)}
                onBlur={saveKey}
              />
            </div>
            <button
              type="button"
              className="hub-secondary-btn"
              onClick={saveKey}
              style={{ marginTop: "0.5rem" }}
            >
              Salvar chave
            </button>
          </section>
        </div>
        <div className="drawer-footer">
          <div className="drawer-actions">
            <button
              type="button"
              className="hub-primary-btn"
              onClick={() => {
                saveKey();
                onClose();
              }}
            >
              Pronto
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
