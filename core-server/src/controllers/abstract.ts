import type { HTTPServer } from "@src/component/httpserver";
import type { RequestHandler } from "express";

export type Route = {
  path: string;
  method: "get" | "post" | "put" | "delete";
  handler: RequestHandler;
};

export abstract class Controller {
  protected routes: Route[] = [];
  private httpServer: HTTPServer;

  constructor(httpServer: HTTPServer) {
    this.httpServer = httpServer;
  }

  public registerRoutes() {
    for (const route of this.routes) {
      switch (route.method.toLowerCase()) {
        case "get":
          this.httpServer.get(route.path, route.handler);
          break;
        case "post":
          this.httpServer.post(route.path, route.handler);
          break;
        case "put":
          this.httpServer.put(route.path, route.handler);
          break;
        case "delete":
          this.httpServer.delete(route.path, route.handler);
          break;
        // Add other HTTP methods as needed
        default:
          throw new Error(`Unsupported method: ${route.method}`);
      }
    }
  }
}
