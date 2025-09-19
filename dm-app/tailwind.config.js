/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        ink:       "#1b1b1d",
        iron:      "#2b2f36",
        steel:     "#4a5561",
        brass:     "#b38b59",
        aether:    "#2aa6a5",
        ember:     "#d26a3a",
        parchment: "#f6f1e7",
        night:     "#0e1116",
      },
      borderRadius: { xl2: "1rem" },
      boxShadow: { card: "0 6px 18px rgba(0,0,0,0.12)" },
      fontFamily: {
        ui: ['Segoe UI', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Consolas', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
}


