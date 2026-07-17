"use client";

import {
  emptyProjetoLink,
  formatProjetoLinkHref,
  PROJETO_LINK_PRESETS,
} from "@/lib/projeto-links";
import type { ProjetoLink } from "@/lib/types";

export function ProjetoLinksEditor({
  links,
  onChange,
}: {
  links: ProjetoLink[];
  onChange: (links: ProjetoLink[]) => void;
}) {
  const patchLink = (id: string, partial: Partial<ProjetoLink>) => {
    onChange(
      links.map((link) => (link.id === id ? { ...link, ...partial } : link)),
    );
  };

  const removeLink = (id: string) => {
    onChange(links.filter((link) => link.id !== id));
  };

  const addLink = () => {
    onChange([...links, emptyProjetoLink()]);
  };

  return (
    <div className="proj-links">
      {links.length === 0 ? (
        <p className="empty-hint proj-links-empty">
          Nenhum link ainda. Adicione planilha, App Script, Cursor etc.
        </p>
      ) : (
        <ul className="proj-links-list">
          {links.map((link) => (
            <li key={link.id} className="proj-link-row">
              <label className="proj-link-field">
                <span>Nome</span>
                <input
                  list="proj-link-presets"
                  value={link.label}
                  placeholder="Ex.: Planilha"
                  onChange={(e) => patchLink(link.id, { label: e.target.value })}
                />
              </label>
              <label className="proj-link-field proj-link-field--url">
                <span>URL</span>
                <input
                  type="url"
                  value={link.url}
                  placeholder="https://..."
                  onChange={(e) => patchLink(link.id, { url: e.target.value })}
                />
              </label>
              {link.url.trim() ? (
                <a
                  href={formatProjetoLinkHref(link.url)}
                  target="_blank"
                  rel="noreferrer"
                  className="hub-ghost-btn proj-link-open"
                  title="Abrir link"
                  onClick={(e) => e.stopPropagation()}
                >
                  Abrir
                </a>
              ) : (
                <span className="proj-link-open-spacer" aria-hidden />
              )}
              <button
                type="button"
                className="hub-ghost-btn proj-link-remove"
                onClick={() => removeLink(link.id)}
                title="Remover link"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <datalist id="proj-link-presets">
        {PROJETO_LINK_PRESETS.map((preset) => (
          <option key={preset} value={preset} />
        ))}
      </datalist>

      <button type="button" className="hub-secondary-btn" onClick={addLink}>
        + Adicionar link
      </button>
    </div>
  );
}
