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
      },
    },
  },
  build: {
    lib: {
      entry: "src/index.ts",
      name: "QueryEditor",
      fileName: "index"
    },
    rollupOptions: {
      // Don’t bundle peer dependencies like React
      external: [
        "react",
        "react-dom",
        "react-dom/client",
        "react-dom/server",
        "react/jsx-runtime",
        "react/jsx-dev-runtime"
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react-dom/client": "ReactDOMClient",
          "react-dom/server": "ReactDOMServer",
          "react/jsx-runtime": "jsxRuntime",
          "react/jsx-dev-runtime": "jsxDevRuntime"
        }
      }
    }
  },
});

// Used for integration into Trino
// // https://vitejs.dev/config/
// export default defineConfig({
//   base: '/query/', // This tells your app it's served from the /query/ path
//   plugins: [react()]
// });
