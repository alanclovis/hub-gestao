"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { SettingsPanel } from "@/components/settings-panel";
import { useCollection } from "@/hooks/use-collection";
import { countDueOpenPendencias } from "@/lib/pendencia-sync";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/projetos", label: "Projetos" },
  { href: "/atividades", label: "Atividades" },
  { href: "/monitorias", label: "Monitorias" },
  { href: "/one-ones", label: "1:1s" },
  { href: "/feedbacks", label: "Feedbacks" },
  { href: "/pendencias", label: "Pendências" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data: pendencias } = useCollection("pendencias");
  const [navOpen, setNavOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const pendenciaBadge = useMemo(
    () => countDueOpenPendencias(pendencias),
    [pendencias],
  );

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  return (
    <>
      <aside className={`hub-sidebar${navOpen ? " is-nav-open" : ""}`}>
        <div className="hub-sidebar-top">
          <div className="hub-brand">
            <span className="hub-brand-mark">BF</span>
            <div>
              <p className="hub-brand-title">BF</p>
              <p className="hub-brand-sub">best friend</p>
            </div>
          </div>
          <div className="hub-sidebar-top-actions">
            <button
              type="button"
              className="hub-icon-btn"
              aria-label="Configurações"
              title="Configurações"
              onClick={() => setSettingsOpen(true)}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M19.4 13a7.7 7.7 0 0 0 .05-1l1.7-1.33-1.6-2.77-2.03.56a7.3 7.3 0 0 0-1.73-1L15.5 4h-3.2l-.3 2.1a7.3 7.3 0 0 0-1.72 1l-2.03-.56L6.65 9.3 8.35 10.6a7.7 7.7 0 0 0 0 2L6.65 13.9l1.6 2.77 2.03-.56c.53.42 1.1.76 1.72 1l.3 2.1h3.2l.3-2.1c.62-.24 1.2-.58 1.73-1l2.03.56 1.6-2.77L19.4 13Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className="hub-nav-toggle"
              aria-expanded={navOpen}
              aria-controls="hub-nav"
              aria-label={navOpen ? "Fechar menu" : "Abrir menu"}
              onClick={() => setNavOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        <nav id="hub-nav" className="hub-nav">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/" || pathname === ""
                : pathname.startsWith(item.href);
            const showBadge =
              item.href === "/pendencias" && pendenciaBadge > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`hub-nav-link${active ? " is-active" : ""}`}
              >
                <span>{item.label}</span>
                {showBadge ? (
                  <span
                    className="nav-badge"
                    aria-label={`${pendenciaBadge} pendências em aberto`}
                  >
                    {pendenciaBadge > 99 ? "99+" : pendenciaBadge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="hub-sidebar-foot">
          <p className="hub-user">{user?.name || user?.login || "Você"}</p>
          <button
            type="button"
            className="hub-ghost-btn"
            onClick={() => setSettingsOpen(true)}
          >
            Configurações
          </button>
          <button
            type="button"
            className="hub-ghost-btn"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
          >
            Sair
          </button>
        </div>
      </aside>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
