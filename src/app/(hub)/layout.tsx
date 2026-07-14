"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { useAuth } from "@/components/auth-provider";

export default function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ready, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !token) {
      router.replace("/login");
    }
  }, [ready, token, router]);

  if (!ready) {
    return (
      <div className="login-screen">
        <p className="empty-hint">Carregando…</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="login-screen">
        <p className="empty-hint">Redirecionando para login…</p>
      </div>
    );
  }

  return (
    <div className="hub-shell">
      <Sidebar />
      <main className="hub-main">{children}</main>
    </div>
  );
}
