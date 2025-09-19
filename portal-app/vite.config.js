import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";

export default defineConfig({
  base: "/ulvareth-dnd-app/",   // <- REQUIRED for GitHub Pages
  plugins: [react(), tailwind()],
});
