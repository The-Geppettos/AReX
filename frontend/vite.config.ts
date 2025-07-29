import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({
  path: "../.env",
});

const frontendDevPort = process.env.FRONTEND_DEV_PORT
  ? parseInt(process.env.FRONTEND_DEV_PORT, 10)
  : 3000;

const backendHost = process.env.BACKEND_HOST || "http://localhost";
const backendPort = process.env.BACKEND_PORT || "3001";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "AReX-routing",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith("/bookreader/")) {
            const htmlPath = resolve(__dirname, "bookreader.html");
            const html = readFileSync(htmlPath, "utf-8");
            res.setHeader("Content-Type", "text/html");
            res.statusCode = 200;
            res.end(html);
            return;
          }
          next();
        });
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        bookreader: resolve(__dirname, "bookreader.html"),
      },
    },
  },
  server: {
    port: frontendDevPort,
    proxy: {
      "/api": {
        target: `${backendHost}:${backendPort}`,
        changeOrigin: true,
      },
    },
  },
});
