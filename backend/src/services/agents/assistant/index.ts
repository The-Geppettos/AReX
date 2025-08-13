import type { BookContentVectorCollection } from "@src/component/chromadb/vectorCollections/bookContent";
import type { BooksTable } from "@src/component/maindb/tables/books";
import type { ChatHistoryTable } from "@src/component/maindb/tables/chatHistory";

import { OpenAI } from "openai";
import { getSearchQueryRewritePrompts, getMainPrompts } from "./prompt";
import { BotMessage, ChatMessage } from "@shared/chat";
import { generateId } from "@src/util";

const OPENAI_CHAT_MODEL = "gpt-4o-mini";

export class AssistantAgentService {
  private bookContentVectorCollection;
  private booksTable;
  private chatHistoryTable;
  private openai;

  constructor(
    openaiApiKey: string,
    bookContentVectorCollection: BookContentVectorCollection,
    booksTable: BooksTable,
    chatHistoryTable: ChatHistoryTable,
  ) {
    this.bookContentVectorCollection = bookContentVectorCollection;
    this.booksTable = booksTable;
    this.chatHistoryTable = chatHistoryTable;

    this.openai = new OpenAI({
      apiKey: openaiApiKey,
    });
  }

  async getChatHistory(id: string) {
    const chatHistory = await this.chatHistoryTable.getById(id);
    if (!chatHistory) {
      throw new Error(`Chat history with ID ${id} not found`);
    }
    const messages = JSON.parse(chatHistory.messages) as ChatMessage[];

    return messages.filter((message) => message.role !== "system");
  }

  async conversate(
    query: string,
    bookId: string,
    offset: number,
    chatHistoryId?: string,
  ): Promise<BotMessage> {
    const book = await this.booksTable.getById(bookId);

    if (!book) {
      throw new Error(`Book with ID ${bookId} not found`);
    }

    let messagesStr: string | undefined = undefined;

    if (chatHistoryId) {
      try {
        const chatHistory = await this.chatHistoryTable.getById(chatHistoryId);
        if (chatHistory) messagesStr = chatHistory.messages;
      } catch (error) {
        console.error(
          `Failed to retrieve chat history with ID ${chatHistoryId}:`,
          error,
        );
      }
    }

    const rewritePrompts = getSearchQueryRewritePrompts(
      query,
      book.language,
      messagesStr,
    );

    const rewrite = await this.openai.chat.completions.create({
      model: OPENAI_CHAT_MODEL,
      messages: [
        {
          role: "system",
          content: rewritePrompts.systemPrompt,
        },
        ...rewritePrompts.userQueries.map((q) => ({
          role: "user" as const,
          content: q,
        })),
      ],
    });

    const rewrittenQuery = rewrite.choices[0].message.content;

    if (!rewrittenQuery) {
      throw new Error("No rewritten query returned from OpenAI API");
    }

    const searchResult = await this.bookContentVectorCollection.search(
      [rewrittenQuery],
      bookId,
      offset,
      7,
    );

    const searchResultStr = JSON.stringify(searchResult);

    const messages = messagesStr
      ? (JSON.parse(messagesStr) as {
          role: "user" | "assistant";
          content: string;
        }[])
      : [];

    const mainPrompts = getMainPrompts(
      book.language,
      book.title,
      query,
      rewrittenQuery,
      searchResultStr,
    );

    messages.push(
      ...mainPrompts.userQueries.map((q) => ({
        role: "user" as const,
        content: q,
      })),
    );

    const result = await this.openai.chat.completions.create({
      model: OPENAI_CHAT_MODEL,
      messages: [
        {
          role: "system",
          content: mainPrompts.systemPrompt,
        },
        ...messages,
      ],
    });

    const message = result.choices[0].message.content;

    if (!message) {
      throw new Error("No message returned from OpenAI API");
    }

    messages.push({
      role: "assistant",
      content: message,
    });

    const id = chatHistoryId || generateId();

    if (!chatHistoryId) {
      const newChatHistory = await this.chatHistoryTable.insert({
        id,
        messages: JSON.stringify(messages),
      });
      if (!newChatHistory) {
        throw new Error("Failed to create chat history");
      }
    } else {
      this.chatHistoryTable.updateById(id, {
        messages: JSON.stringify(messages),
      });
    }

    return { message, id };
  }
}
