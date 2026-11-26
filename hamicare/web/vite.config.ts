import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// SINGLEFILE=1 gera um único HTML (JS, CSS e imagens embutidos), usado na página de teste publicada.
// O site e os apps usam o build normal (arquivos separados): gasta bem menos memória para compilar,
// o que cabe no plano do Render (512 MB), e o celular baixa só o que mudou.
const single = process.env.SINGLEFILE === '1';
export default defineConfig({
  plugins: single ? [react(), viteSingleFile()] : [react()],
  build: { target: 'es2020', chunkSizeWarningLimit: 4000 },
});
