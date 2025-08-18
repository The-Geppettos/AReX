import { CHAT_TYPES, type ChatHistory } from "@shared/chat";
import type { MainDB } from "..";
import type { BooksTable } from "./books";

import { Table } from "./abstract";

export class ChatHistoryTable extends Table<ChatHistory> {
  tableName = "chat_history";
  idField = "id" as const;

  protected schema = {
    id: "TEXT PRIMARY KEY",
    book_id: "TEXT NOT NULL",
    search_offset: "INTEGER NOT NULL",
    chat_title: "TEXT NOT NULL",
    chat_messages: "TEXT NOT NULL",
    chat_type: "TEXT NOT NULL",
    created_at: "TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP",
  };

  constructor(mainDb: MainDB, booksTable: BooksTable) {
    super(mainDb);
    this.addConstraint(
      `CHECK (${this.field("chat_type")} IN (${CHAT_TYPES.map((type) => `'${type}'`).join(", ")}))`,
    );
    this.addConstraint(
      `FOREIGN KEY (${this.field("book_id")}) REFERENCES ${booksTable.tableName}(${booksTable.field("id")}) ON DELETE CASCADE`,
    );
    this.addIndex(this.field("id"), "DESC");
  }
}
