import express from "express";
import path from "path";
import { createProxyMiddleware } from "http-proxy-middleware";
import { fileURLToPath } from "url";

import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: "../.env",
});

const noAdmin = process.env.VITE_NO_ADMIN === "true";

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

const app = express();

app.use(
  "/api",
  createProxyMiddleware({
    target: `${coreServerProtocol}://${coreServerHost}:${coreServerPort}/api`,
    changeOrigin: true,
  }),
);

app.get("/bookreader*", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "bookreader.html"));
});

app.use(express.static(path.join(__dirname, "dist")));

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const server = app.listen(frontendPort, () => {
  console.info(`Frontend server is running on port ${frontendPort}`);
});

const gracefulShutdown = (signal) => {
  if (signal) {
    console.info(`Received ${signal}, shutting down server...`);
  } else {
    console.info("Shutting down server...");
  }

  server.close((error) => {
    if (error) {
      console.error("Error during server shutdown:", error);
    } else {
      console.info("Server closed successfully");
    }
    process.exit(0);
  });
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  gracefulShutdown();
});
