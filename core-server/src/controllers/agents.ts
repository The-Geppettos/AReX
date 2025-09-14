import type { HTTPServer } from "@src/component/httpserver";
import type { AssistantAgentService } from "@src/services/agents/assistant";
import type { CharacterAgentService } from "@src/services/agents/character";
import { Controller, type Route } from "./abstract";

export class AgentController extends Controller {
  private assistantAgentService: AssistantAgentService;
  private characterAgentService: CharacterAgentService;

  constructor(
    httpServer: HTTPServer,
    assistantAgentService: AssistantAgentService,
    characterAgentService: CharacterAgentService,
  ) {
    super(httpServer);
    this.assistantAgentService = assistantAgentService;
    this.characterAgentService = characterAgentService;
  }

  override routes: Route[] = [
    {
      path: "/api/agent/assistant/conversate",
      method: "post",
      handler: async (req, res) => {
        try {
          const { book_id, offset, message, chat_id } = req.body;
          if (!book_id || !offset || !message) {
            return res
              .status(400)
              .json({ error: "book_id, offset, and message are required" });
          }
          if (
            typeof book_id !== "string" ||
            typeof offset !== "number" ||
            typeof message !== "string"
          ) {
            return res
              .status(400)
              .json({ error: "Parameter types are incorrect" });
          }
          if (chat_id && typeof chat_id !== "string") {
            return res.status(400).json({ error: "chat_id must be a string" });
          }

          const response = await this.assistantAgentService.conversate(
            message,
            book_id,
            offset,
            chat_id,
          );

          res.status(200).json(response);
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: "Failed to send message" });
        }
      },
    },
    {
      path: "/api/agent/character/check",
      method: "post",
      handler: async (req, res) => {
        try {
          const { book_id, offset, message } = req.body;
          if (!book_id || !offset || !message) {
            return res
              .status(400)
              .json({ error: "book_id, offset, and message are required" });
          }
          if (
            typeof book_id !== "string" ||
            typeof offset !== "number" ||
            typeof message !== "string"
          ) {
            return res
              .status(400)
              .json({ error: "Parameter types are incorrect" });
          }

          const response = await this.characterAgentService.checkCharacter(
            message,
            book_id,
            offset,
          );

          res.status(200).json(response);
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: "Failed to send message" });
        }
      },
    },
    {
      path: "/api/agent/character/conversate",
      method: "post",
      handler: async (req, res) => {
        try {
          const { book_id, message, chat_id } = req.body;
          if (!book_id || !message || !chat_id) {
            return res
              .status(400)
              .json({ error: "book_id, chat_id, and message are required" });
          }
          if (
            typeof book_id !== "string" ||
            typeof chat_id !== "string" ||
            typeof message !== "string"
          ) {
            return res
              .status(400)
              .json({ error: "Parameter types are incorrect" });
          }

          const response = await this.characterAgentService.conversate(
            message,
            book_id,
            chat_id,
          );

          res.status(200).json(response);
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: "Failed to send message" });
        }
      },
    },
  ];
}
