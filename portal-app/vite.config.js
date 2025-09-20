import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";

export default defineConfig({
  base: "/ulvareth-dnd-app/", // repo name, with leading+trailing slash
  plugins: [react(), tailwind()],
});
