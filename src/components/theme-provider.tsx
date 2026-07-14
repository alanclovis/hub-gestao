"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  THEME_STORAGE_KEY,
  THEMES,
  applyThemeVars,
  getTheme,
  readStoredThemeId,
  type ThemeId,
  type ThemePreset,
} from "@/lib/theme";

type ThemeContextValue = {
  themeId: ThemeId;
  theme: ThemePreset;
  themes: ThemePreset[];
  setThemeId: (id: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>("teal");

  useEffect(() => {
    const id = readStoredThemeId();
    setThemeIdState(id);
    applyThemeVars(getTheme(id));
  }, []);

  const setThemeId = useCallback((id: ThemeId) => {
    setThemeIdState(id);
    const theme = getTheme(id);
    applyThemeVars(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({
      themeId,
      theme: getTheme(themeId),
      themes: THEMES,
      setThemeId,
    }),
    [themeId, setThemeId],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
