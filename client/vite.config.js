import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: 'localhost',
    https: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5001/api',
        changeOrigin: true,
        secure: false
      }
    }
  },
  optimizeDeps: {
    // Force Vite's esbuild scanner to pre-bundle these up front instead of
    // discovering them lazily. @emotion/styled and @emotion/react are deep,
    // indirect dependencies of @mui/material/@mui/system (nothing in our own
    // source imports them directly), so Vite's scanner can miss them on the
    // first pass and bundle them inconsistently, which surfaces as
    // "styled_default is not a function" at runtime.
    include: [
      'react',
      'react-dom',
      '@emotion/react',
      '@emotion/styled',
      '@mui/material',
      '@mui/material/styles',
      '@mui/system',
      '@mui/icons-material',
      '@mui/x-charts/BarChart',
      '@mui/x-charts/PieChart',
      '@mui/x-charts/LineChart'
    ]
  }
});
