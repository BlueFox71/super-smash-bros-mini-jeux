import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Pour GitHub Pages : https://<user>.github.io/<repo>/
const repoName = 'super-smash-bros-mini-jeux'
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? `/${repoName}/` : '/',
  server: {
    port: 5190,
  },
  preview: {
    port: 5190,
  },
})
