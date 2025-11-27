import React, { createContext, useContext, useEffect, useState } from "react";

const PALETTES = ["system", "dark", "light", "ocean", "sunset"];

const ThemeContext = createContext({
  palette: "dark",
  setPalette: (p) => {},
  cyclePalette: () => {},
});

export function ThemeProvider({ children }) {
  const [palette, setPaletteState] = useState(() => {
    try {
      const stored = localStorage.getItem("palette");
      if (stored && PALETTES.includes(stored)) return stored;
    } catch (e) {}
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "dark";
  });

  useEffect(() => {
    applyPaletteClass(palette);
    try {
      localStorage.setItem("palette", palette);
    } catch (e) {}
    if (
      palette === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia
    ) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyPaletteClass("system");
      mq.addEventListener
        ? mq.addEventListener("change", handler)
        : mq.addListener(handler);
      return () =>
        mq.removeEventListener
          ? mq.removeEventListener("change", handler)
          : mq.removeListener(handler);
    }
    return undefined;
  }, [palette]);

  const setPalette = (p) => {
    if (!PALETTES.includes(p)) return;
    setPaletteState(p);
  };

  const cyclePalette = () => {
    const idx = PALETTES.indexOf(palette);
    const next = PALETTES[(idx + 1) % PALETTES.length];
    setPalette(next);
  };

  return (
    <ThemeContext.Provider value={{ palette, setPalette, cyclePalette }}>
      {children}
    </ThemeContext.Provider>
  );
}

function applyPaletteClass(name) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  Array.from(html.classList)
    .filter((c) => c.startsWith("palette-"))
    .forEach((c) => html.classList.remove(c));
  if (name === "system") {
    const isDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    html.classList.add(`palette-${isDark ? "dark" : "light"}`);
  } else {
    html.classList.add(`palette-${name}`);
  }
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

export { PALETTES };
