"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  clearToken,
  getToken,
  sanitizeToken,
  setToken,
  TokenValidationError,
  validateToken,
} from "@/lib/token";

type AuthState = {
  ready: boolean;
  token: string | null;
  user: { login: string; name: string | null; avatar: string | null } | null;
  /** Erro transitório ao validar sessão (rede/outage) — token mantido. */
  sessionWarning: string | null;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<AuthState["user"]>(null);
  const [sessionWarning, setSessionWarning] = useState<string | null>(null);

  useEffect(() => {
    const existing = getToken();
    if (!existing) {
      setReady(true);
      return;
    }
    validateToken(existing)
      .then((u) => {
        setTokenState(existing);
        setUser(u);
        setSessionWarning(null);
      })
      .catch((err) => {
        // Só apaga token se for inválido/revogado. Rede/outage mantém a sessão.
        if (err instanceof TokenValidationError && err.kind === "invalid") {
          clearToken();
          setTokenState(null);
          setUser(null);
          setSessionWarning(null);
          return;
        }
        setTokenState(existing);
        setUser(null);
        setSessionWarning(
          err instanceof Error
            ? err.message
            : "Não foi possível validar a sessão agora. Token mantido.",
        );
      })
      .finally(() => setReady(true));
  }, []);

  const loginWithToken = useCallback(async (raw: string) => {
    const cleaned = sanitizeToken(raw);
    const u = await validateToken(cleaned);
    setToken(cleaned);
    setTokenState(cleaned);
    setUser(u);
    setSessionWarning(null);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUser(null);
    setSessionWarning(null);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      token,
      user,
      sessionWarning,
      loginWithToken,
      logout,
    }),
    [ready, token, user, sessionWarning, loginWithToken, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth fora do AuthProvider");
  return ctx;
}
