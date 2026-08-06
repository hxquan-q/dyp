import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // 与 mock 后端期望的文件名保持一致：app-Buzwood0.js / app-CVK6h-fN.css
    rollupOptions: {
      output: {
        entryFileNames: 'assets/app-Buzwood0.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: (info) => {
          if (info.name?.endsWith('.css')) return 'assets/app-CVK6h-fN.css';
          return 'assets/[name][extname]';
        },
      },
    },
  },
});
