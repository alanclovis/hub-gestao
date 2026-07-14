"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/projetos", label: "Projetos" },
  { href: "/one-ones", label: "1:1s" },
  { href: "/feedbacks", label: "Feedbacks" },
  { href: "/pendencias", label: "Pendências" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <aside className="hub-sidebar">
      <div className="hub-brand">
        <span className="hub-brand-mark">HG</span>
        <div>
          <p className="hub-brand-title">Hub Gestão</p>
          <p className="hub-brand-sub">pessoal</p>
        </div>
      </div>

      <nav className="hub-nav">
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
