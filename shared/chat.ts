export type UserMessage = {
  chat_id?: string;
  character_name?: string;
  message: string;
  book_id: string;
  offset: number;
  page_number: number;
};

export type BotMessage = {
  chat_id: string;
  message: string;
};

export type ChatHistory = {
  id: string;
  book_id: string;
  search_offset: number;
  search_page_number: number;
  chat_title: string;
  chat_messages: string;
  chat_type: (typeof CHAT_TYPES)[number];
  created_at: string;
};

export const CHAT_TYPES = ["assistant", "character"] as const;
export type ChatType = (typeof CHAT_TYPES)[number];

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};
