"use client";

import { useTheme } from "@/components/theme-provider";
import type { ThemeId } from "@/lib/theme";

export function SettingsPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { themeId, themes, setThemeId } = useTheme();

  if (!open) return null;

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
        </div>
        <div className="drawer-footer">
          <div className="drawer-actions">
            <button type="button" className="hub-primary-btn" onClick={onClose}>
              Pronto
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
