import { CHAT_TYPES, type ChatState } from "@shared/chat";
import type { CoreDB } from "..";
import type { BooksTable } from "./books";

import { Table } from "./abstract";

export class ChatStateTable extends Table<ChatState> {
  tableName = "chat_state";
  idField = "id" as const;

  protected schema = {
    id: "TEXT PRIMARY KEY",
    book_id: "TEXT NOT NULL",
    last_page_read: "INTEGER NOT NULL",
    chat_type: "TEXT NOT NULL",
    created_at: "TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP",
    updated_at: "TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP",
  };

  constructor(coreDb: CoreDB, booksTable: BooksTable) {
    super(coreDb);
    this.addConstraint(
      `CHECK (${this.field("chat_type")} IN (${CHAT_TYPES.map((type) => `'${type}'`).join(", ")}))`,
    );
    this.addConstraint(
      `FOREIGN KEY (${this.field("book_id")}) REFERENCES ${booksTable.tableName}(${booksTable.field("id")}) ON DELETE CASCADE`,
    );
    this.addIndex(this.field("id"), "DESC");
  }
}
