import type { ChatHistory } from "@shared/chat";

import { Table } from "./abstract";

export class ChatHistoryTable extends Table<ChatHistory> {
  tableName = "chat_history";
  idField = "id" as const;

  protected schema = {
    id: "TEXT PRIMARY KEY",
    messages: "TEXT NOT NULL",
  };
}
