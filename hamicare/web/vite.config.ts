import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Gera um único HTML (JS e CSS embutidos): fácil de publicar e de abrir no celular.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: { target: 'es2020' },
});
