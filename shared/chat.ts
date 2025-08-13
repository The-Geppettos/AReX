export type UserMessage = {
  id?: string;
  message: string;
  book_id: string;
  offset: number;
};

export type BotMessage = {
  id: string;
  message: string;
};

export type ChatHistory = {
  id: string;
  messages: string;
};

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};
