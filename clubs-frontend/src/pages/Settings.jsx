import React from "react";
import { useTheme, PALETTES } from "../contexts/ThemeContext";
import Navbar from "../components/Navbar";

const LABELS = {
  dark: "Dark",
  light: "Light",
  ocean: "Ocean",
  sunset: "Sunset",
};

export default function Settings() {
  const { palette, setPalette } = useTheme();

  return (
    <div className="page-container">
      <Navbar />
      <div className="content-wrapper" style={{ padding: 20 }}>
        <h2>Appearance</h2>
        <p>Choose a color palette for the app.</p>
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          {PALETTES.map((p) => (
            <button
              key={p}
              onClick={() => setPalette(p)}
              style={{
                padding: 12,
                borderRadius: 8,
                border:
                  palette === p
                    ? "2px solid var(--accent)"
                    : "1px solid var(--muted)",
                background: "var(--surface)",
                color: "var(--on-background)",
                cursor: "pointer",
                minWidth: 120,
              }}
            >
              <div style={{ fontWeight: 700 }}>{LABELS[p]}</div>
              <div
                style={{ fontSize: 12, marginTop: 6, color: "var(--muted)" }}
              >
                {p}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
