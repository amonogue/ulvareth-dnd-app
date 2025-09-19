import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";

export default defineConfig({
  // IMPORTANT: path where your DM app is served on GitHub Pages
  base: "/ulvareth-dnd-app/dm/",
  plugins: [react(), tailwind()],
});
