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
  setToken,
  validateToken,
} from "@/lib/token";

type AuthState = {
  ready: boolean;
  token: string | null;
  user: { login: string; name: string | null; avatar: string | null } | null;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<AuthState["user"]>(null);

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
      })
      .catch(() => {
        clearToken();
      })
      .finally(() => setReady(true));
  }, []);

  const loginWithToken = useCallback(async (raw: string) => {
    const u = await validateToken(raw.trim());
    setToken(raw.trim());
    setTokenState(raw.trim());
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ ready, token, user, loginWithToken, logout }),
    [ready, token, user, loginWithToken, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth fora do AuthProvider");
  return ctx;
}
