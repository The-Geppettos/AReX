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
          const { book_id, offset, page_number, message, chat_id } = req.body;
          if (!book_id || !offset || !page_number || !message) {
            return res.status(400).json({
              error: "book_id, offset, page_number, and message are required",
            });
          }
          if (
            typeof book_id !== "string" ||
            typeof offset !== "number" ||
            typeof page_number !== "number" ||
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
            page_number,
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
      path: "/api/agent/character/conversate",
      method: "post",
      handler: async (req, res) => {
        try {
          const {
            book_id,
            message,
            chat_id,
            offset,
            page_number,
            character_name,
          } = req.body;
          if (!book_id || !message || !offset || !page_number) {
            return res
              .status(400)
              .json({ error: "book_id, offset, and message are required" });
          }
          if (
            typeof book_id !== "string" ||
            typeof offset !== "number" ||
            typeof page_number !== "number" ||
            typeof message !== "string"
          ) {
            return res
              .status(400)
              .json({ error: "Parameter types are incorrect" });
          }

          if (!character_name && !chat_id) {
            return res.status(400).json({
              error: "Either character_name or chat_id must be provided",
            });
          }

          if (character_name && typeof character_name !== "string") {
            return res
              .status(400)
              .json({ error: "character_name must be a string" });
          }

          if (chat_id && typeof chat_id !== "string") {
            return res.status(400).json({ error: "chat_id must be a string" });
          }

          const response = await this.characterAgentService.conversate(
            message,
            book_id,
            offset,
            page_number,
            chat_id,
            character_name,
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
