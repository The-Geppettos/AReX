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

const noAdmin = process.env.NO_ADMIN === "true";

const frontendPort = noAdmin
  ? process.env.FRONTEND_NO_ADMIN_PORT
    ? parseInt(process.env.FRONTEND_NO_ADMIN_PORT, 10)
    : 3000
  : process.env.FRONTEND_PORT
    ? parseInt(process.env.FRONTEND_PORT, 10)
    : 13000;

const coreServerPort = noAdmin
  ? process.env.CORE_SERVER_NO_ADMIN_PORT || "3001"
  : process.env.CORE_SERVER_PORT || "13001";
const coreServerHost = noAdmin
  ? process.env.CORE_SERVER_NO_ADMIN_HOST || "localhost"
  : process.env.CORE_SERVER_HOST || "localhost";
const coreServerProtocol = process.env.CORE_SERVER_PROTOCOL || "http";

// https://vite.dev/config/
export default defineConfig({
  define: {
    __NO_ADMIN__: JSON.stringify(process.env.NO_ADMIN || "false"),
  },
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
    port: frontendPort,
    proxy: {
      "/api": {
        target: `${coreServerProtocol}://${coreServerHost}:${coreServerPort}`,
        changeOrigin: true,
      },
    },
  },
});
