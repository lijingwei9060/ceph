import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

const dashboardUrl = process.env.CEPH_DASHBOARD_URL || 'https://192.168.122.72:30275';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 4201,
    proxy: {
      '/api': { target: dashboardUrl, secure: false, changeOrigin: true },
      '/ui-api': { target: dashboardUrl, secure: false, changeOrigin: true },
      '/auth': { target: dashboardUrl, secure: false, changeOrigin: true },
      '/docs': { target: dashboardUrl, secure: false, changeOrigin: true },
    },
  },
});
