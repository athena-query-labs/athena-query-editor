import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Used for local debugging against the Athena backend running on localhost at port 8081:
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
        headers: process.env.VITE_DEV_USER_EMAIL
          ? { 'X-Email': process.env.VITE_DEV_USER_EMAIL }
          : undefined,
      },
    },
  },
});
