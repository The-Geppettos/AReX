import type { BookContentVectorCollection } from "@src/component/chromadb/vectorCollections/bookContent";
import type { BooksTable } from "@src/component/maindb/tables/books";
import type { ChatHistoryTable } from "@src/component/maindb/tables/chatHistory";

import { OpenAI } from "openai";
import { getSearchQueryRewritePrompts, getAnswerPrompts } from "./prompt";
import { BotMessage, ChatMessage } from "@shared/chat";
import { generateId, searchResultToString } from "@src/util";

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
        if (chatHistory) {
          messagesStr = chatHistory.chat_messages;
          offset = chatHistory.search_offset;
        }
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

    if (rewrittenQuery === null) {
      throw new Error("No rewritten query returned from OpenAI API");
    }

    const searchResult = await this.bookContentVectorCollection.search(
      [rewrittenQuery],
      bookId,
      offset,
      7,
    );

    const searchResultStr = searchResultToString(
      searchResult,
      book.language,
    )[0];

    const messages = messagesStr
      ? (JSON.parse(messagesStr) as ChatMessage[])
      : [];

    const mainPrompts = getAnswerPrompts(
      book.language,
      book.title,
      book.author,
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

    messages.push(
      ...mainPrompts.assistantQueries.map((q) => ({
        role: "assistant" as const,
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

    if (message === null) {
      throw new Error("No message returned from OpenAI API");
    }

    messages.push({
      role: "assistant",
      content: message,
    });

    const chatId = chatHistoryId || generateId();

    if (!chatHistoryId) {
      const newChatHistory = await this.chatHistoryTable.insert({
        id: chatId,
        book_id: bookId,
        chat_title: "",
        search_offset: offset,
        chat_messages: JSON.stringify(messages),
        chat_type: "assistant",
        created_at: new Date().toISOString(),
      });
      if (!newChatHistory) {
        throw new Error("Failed to create chat history");
      }
    } else {
      this.chatHistoryTable.updateById(chatId, {
        chat_messages: JSON.stringify(messages),
      });
    }

    console.log(messages)
    return { message, chat_id: chatId };
  }
}
