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

const coreServerHost = process.env.CORE_SERVER_HOST || "localhost";
const coreServerPort = process.env.CORE_SERVER_PORT || "3001";
const coreServerProtocol = process.env.CORE_SERVER_PROTOCOL || "http";

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@src": resolve(__dirname, "src"),
      "@shared": resolve(__dirname, "../shared"),
    },
  },
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
        target: `${coreServerProtocol}://${coreServerHost}:${coreServerPort}`,
        changeOrigin: true,
      },
    },
  },
});
