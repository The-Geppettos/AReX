import type { BotMessage, CharacterCheck, UserMessage } from "@shared/chat";
import { axiosInstance } from "./axios";

export class AgentAPI {
  static async askAssistant(userMessage: UserMessage): Promise<BotMessage> {
    const response = await axiosInstance.post(
      `/api/agent/assistant/conversate`,
      userMessage,
    );
    return response.data;
  }

  static async checkCharacter(
    userMessage: UserMessage,
  ): Promise<CharacterCheck> {
    const response = await axiosInstance.post(
      `/api/agent/character/check`,
      userMessage,
    );
    return response.data;
  }

  static async chatCharacter(userMessage: UserMessage): Promise<BotMessage> {
    const response = await axiosInstance.post(
      `/api/agent/character/conversate`,
      userMessage,
    );
    return response.data;
  }
}
