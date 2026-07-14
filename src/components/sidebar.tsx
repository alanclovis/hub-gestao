"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

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
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  return (
    <aside className={`hub-sidebar${navOpen ? " is-nav-open" : ""}`}>
      <div className="hub-sidebar-top">
        <div className="hub-brand">
          <span className="hub-brand-mark">HG</span>
          <div>
            <p className="hub-brand-title">Hub Gestão</p>
            <p className="hub-brand-sub">pessoal</p>
          </div>
        </div>
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

      <nav id="hub-nav" className="hub-nav">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/" || pathname === ""
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`hub-nav-link${active ? " is-active" : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="hub-sidebar-foot">
        <p className="hub-user">{user?.name || user?.login || "Você"}</p>
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
  );
}
