import { OpenAI } from "openai";
import { ChatCompletionMessageParam } from "openai/resources";

import type { BookSearchCollection } from "@src/component/vectordb/collections/bookSearch";
import type { BooksTable } from "@src/component/coredb/tables/books";
import type { BookChaptersTable } from "@src/component/coredb/tables/bookChapter";
import type { BookPagesTable } from "@src/component/coredb/tables/bookPage";
import type { ChatHistoryTable } from "@src/component/coredb/tables/chatHistory";

import { BotMessage, ChatHistory } from "@shared/chat";
import { generateId } from "@src/util";
import { ToolManager } from "../tools";
import { getSystemPrompt } from "./prompt";

const OPENAI_CHAT_MODEL = "gpt-5.4";

const MAX_STEPS = 10;

export class AssistantAgentService {
  private bookSearchCollection;
  private booksTable;
  private bookChaptersTable;
  private bookPagesTable;
  private chatHistoryTable;
  private openai;

  constructor(
    openaiApiKey: string,
    bookSearchCollection: BookSearchCollection,
    booksTable: BooksTable,
    bookChaptersTable: BookChaptersTable,
    bookPagesTable: BookPagesTable,
    chatHistoryTable: ChatHistoryTable,
  ) {
    this.bookSearchCollection = bookSearchCollection;
    this.booksTable = booksTable;
    this.bookChaptersTable = bookChaptersTable;
    this.bookPagesTable = bookPagesTable;
    this.chatHistoryTable = chatHistoryTable;

    this.openai = new OpenAI({
      apiKey: openaiApiKey,
    });
  }

  async conversate(
    query: string,
    bookId: string,
    pageNumber: number,
    chatHistoryId?: string,
  ): Promise<BotMessage> {
    let chatHistory: ChatHistory | null = null;

    if (chatHistoryId) {
      chatHistory = await this.chatHistoryTable.getById(chatHistoryId);

      if (!chatHistory) {
        throw new Error(`Chat history with ID ${chatHistoryId} not found`);
      }
    }

    let messages: ChatCompletionMessageParam[] = [];

    let lastPageRead;

    if (chatHistory) {
      messages = JSON.parse(chatHistory.chat_messages);

      bookId = chatHistory.book_id;
      lastPageRead = chatHistory.last_page_read;
    } else {
      const book = await this.booksTable.getById(bookId);

      if (!book) {
        throw new Error(`Book with ID ${bookId} not found`);
      }

      const chapters = await this.bookChaptersTable.getChaptersByBookId(bookId);

      bookId = book.id;
      lastPageRead = pageNumber;

      const systemPrompt = getSystemPrompt(book, chapters, lastPageRead);

      messages = [
        {
          role: "system",
          content: systemPrompt,
        },
      ];
    }

    messages.push({
      role: "user",
      content: `Query: ${query}`,
    });

    const toolManager = ToolManager.create(
      bookId,
      this.bookPagesTable,
      this.bookSearchCollection,
      lastPageRead,
    );

    let responseMessage: string | null = null;

    for (let step = 0; step < MAX_STEPS; step++) {
      const response = await this.openai.chat.completions.create({
        model: OPENAI_CHAT_MODEL,
        tools: toolManager.toolDefinitions,
        messages: messages,
      });

      const choice = response.choices[0];

      if (choice.finish_reason === "tool_calls") {
        const tool_calls = choice.message?.tool_calls || [];

        messages.push({
          role: "assistant",
          content: choice.message.content,
          tool_calls: choice.message.tool_calls,
        });

        for (const tool_call of tool_calls) {
          if (tool_call.type === "function") {
            const toolResponse = await toolManager.callTool(
              tool_call.function.name,
              tool_call.function.arguments,
            );
            messages.push({
              role: "tool",
              content: toolResponse,
              tool_call_id: tool_call.id,
            });
          }
        }
      } else if (choice.finish_reason === "stop") {
        messages.push({
          role: "assistant",
          content: choice.message?.content || "",
        });
        responseMessage = choice.message?.content || "";
        break;
      } else {
        throw new Error(`Unexpected finish reason: ${choice.finish_reason}`);
      }
    }

    if (!responseMessage) {
      messages.push({
        role: "assistant",
        content:
          "I have reached the maximum number of steps and now I will provide my final response based on the information I have gathered.",
      });
      const response = await this.openai.chat.completions.create({
        model: OPENAI_CHAT_MODEL,
        messages: messages,
      });

      const choice = response.choices[0];
      responseMessage = choice.message?.content || "";
    }

    if (!chatHistory) {
      const newChatHistory: ChatHistory = {
        id: generateId(),
        book_id: bookId,
        last_page_read: pageNumber,
        chat_title: `Assistant Chat`,
        chat_messages: JSON.stringify(messages),
        chat_type: "assistant",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      chatHistory = await this.chatHistoryTable.insert(newChatHistory);

      if (!chatHistory) {
        throw new Error("Failed to create new chat history");
      }
    } else {
      this.chatHistoryTable.updateById(chatHistory.id, {
        chat_messages: JSON.stringify(messages),
        updated_at: new Date().toISOString(),
      });
    }

    return { message: responseMessage, chat_id: chatHistory.id };
  }
}
