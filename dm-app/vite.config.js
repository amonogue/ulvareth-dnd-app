import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // publish GM under /gm/
  base: "/ulvareth-dnd-app/gm/",
  plugins: [react()],
});
