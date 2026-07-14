export type ThemeId = "teal" | "ocean" | "forest" | "slate" | "copper";

export type ThemePreset = {
  id: ThemeId;
  label: string;
  swatch: string;
  vars: Record<string, string>;
};

export const THEME_STORAGE_KEY = "hub-gestao-theme";

const highlightDefaults = {
  "--highlight": "#d4a017",
  "--highlight-deep": "#a67c00",
  "--highlight-soft": "#ffe9a8",
  "--highlight-ink": "#5c4300",
  "--mention-bg": "#ffe08a",
  "--mention-fg": "#5c4300",
};

export const THEMES: ThemePreset[] = [
  {
    id: "teal",
    label: "Teal",
    swatch: "#0f6a72",
    vars: {
      "--ink": "#122027",
      "--ink-muted": "#5d6f78",
      "--paper": "#e7eef0",
      "--paper-deep": "#d5e2e5",
      "--surface": "#f7fbfb",
      "--rail": "#0a3d42",
      "--rail-soft": "#0c4a50",
      "--teal": "#0f6a72",
      "--teal-deep": "#0a4d54",
      "--teal-soft": "#d2ecee",
      "--accent": "#1f7a8c",
      ...highlightDefaults,
    },
  },
  {
    id: "ocean",
    label: "Oceano",
    swatch: "#1d5f9c",
    vars: {
      "--ink": "#132033",
      "--ink-muted": "#5a6d82",
      "--paper": "#e6eef6",
      "--paper-deep": "#d3deeb",
      "--surface": "#f6f9fc",
      "--rail": "#14375c",
      "--rail-soft": "#18456f",
      "--teal": "#1d5f9c",
      "--teal-deep": "#154676",
      "--teal-soft": "#d3e4f5",
      "--accent": "#2b7db8",
      ...highlightDefaults,
      "--highlight": "#e0a800",
    },
  },
  {
    id: "forest",
    label: "Floresta",
    swatch: "#2f6b45",
    vars: {
      "--ink": "#15241b",
      "--ink-muted": "#5c6f62",
      "--paper": "#e8efea",
      "--paper-deep": "#d5e1d8",
      "--surface": "#f6faf7",
      "--rail": "#1e3f2b",
      "--rail-soft": "#275238",
      "--teal": "#2f6b45",
      "--teal-deep": "#235235",
      "--teal-soft": "#d6eadc",
      "--accent": "#3f8558",
      ...highlightDefaults,
      "--highlight": "#c9a227",
    },
  },
  {
    id: "slate",
    label: "Ardósia",
    swatch: "#4a5563",
    vars: {
      "--ink": "#1a1f26",
      "--ink-muted": "#66707c",
      "--paper": "#e9ebef",
      "--paper-deep": "#d8dce3",
      "--surface": "#f7f8fa",
      "--rail": "#2d333c",
      "--rail-soft": "#3a424d",
      "--teal": "#4a5563",
      "--teal-deep": "#363e49",
      "--teal-soft": "#e0e4ea",
      "--accent": "#5b6878",
      ...highlightDefaults,
    },
  },
  {
    id: "copper",
    label: "Cobre",
    swatch: "#9a5230",
    vars: {
      "--ink": "#241816",
      "--ink-muted": "#746058",
      "--paper": "#efe9e4",
      "--paper-deep": "#e0d5cb",
      "--surface": "#faf7f4",
      "--rail": "#5c2f1d",
      "--rail-soft": "#6f3a24",
      "--teal": "#9a5230",
      "--teal-deep": "#7a3f24",
      "--teal-soft": "#f0ddd0",
      "--accent": "#b5673c",
      ...highlightDefaults,
      "--highlight": "#e6b422",
    },
  },
];

export function getTheme(id: string | null | undefined): ThemePreset {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function applyThemeVars(theme: ThemePreset) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  root.dataset.theme = theme.id;
}

export function readStoredThemeId(): ThemeId {
  if (typeof window === "undefined") return "teal";
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (THEMES.some((t) => t.id === raw)) return raw as ThemeId;
  } catch {
    /* ignore */
  }
  return "teal";
}
