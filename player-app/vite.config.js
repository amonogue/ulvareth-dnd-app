import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/ulvareth-dnd-app/player/',   // 👈 important for GitHub Pages
  plugins: [react(), tailwindcss()],
})
