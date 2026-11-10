/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./app/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          light: "#f6fbf8",
          dark: "#081112",
        },
        surface: {
          light: "#ffffff",
          dark: "#0e1a1b",
        },
        "surface-card": {
          light: "rgba(255, 255, 255, 0.85)",
          dark: "rgba(14, 26, 27, 0.75)",
        },
        "paper-note": "#fbf7ef",
        "paper-text": "#2d241e",
        "paper-muted": "#6b5d52",
        "paper-border": "#e8dec8",
        brand: {
          green: "#10b981",
          emerald: "#059669",
          teal: "#0d9488",
          cyan: "#06b6d4",
          mint: "#34d399",
          lime: "#22c55e",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        heading: ["var(--font-heading)", "Georgia", "serif"],
        serif: ["var(--font-heading)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
