import express, { type Express } from "express";
import cors from "cors";
import type { Server } from "http";

export class MainServer {
  private express: Express;
  private server: Server | null = null;
  private port: string;

  private stopTriggered: boolean = false;

  constructor(port: string) {
    this.port = port;
    this.server = null;
    this.express = express();
    this.express.use(cors());
    this.express.use(express.json());
  }

  get(path: string, handler: express.RequestHandler) {
    this.express.get(path, handler);
  }

  post(path: string, handler: express.RequestHandler) {
    this.express.post(path, handler);
  }

  put(path: string, handler: express.RequestHandler) {
    this.express.put(path, handler);
  }

  initialize() {
    return new Promise<void>((resolve) => {
      if (this.server) {
        throw new Error("Server is already running");
      }

      if (this.stopTriggered) {
        return;
      }

      this.server = this.express.listen(this.port, () => {
        console.log(`Server is running on port ${this.port}`);
        resolve();
      });

      this.server.on("error", (err) => {
        console.error("Server error:", err);
      });
    });
  }

  close() {
    this.stopTriggered = true;

    return new Promise<void>((resolve) => {
      if (this.server) {
        this.server.close((error) => {
          if (error) {
            console.error("Error closing server:", error);
          } else {
            console.log("Server closed successfully.");
          }
          resolve();
        });
      }
    });
  }
}
