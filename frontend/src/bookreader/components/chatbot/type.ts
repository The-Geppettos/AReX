import type { ChatMessage, ChatType } from "@shared/chat";

export type Chat = {
  chatId: string;
  chatType: ChatType;
  chatTitle: string;
  messageInput: string;
  messages: ChatMessage[];
  chatKey: number;
  pageNumber: number;
  isNew: boolean;
};

export type ChatController = {
  setChatId: (chatId: string) => void;
  setChatTitle: (chatTitle: string) => void;
  setChatType: (chatType: ChatType) => void;
  setPageNumber: (pageNumber: number) => void;
  setMessageInput: (messageInput: string) => void;
  appendMessage: (message: ChatMessage) => void;
} & Chat;
