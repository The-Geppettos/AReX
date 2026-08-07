import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import type { BaseCheckpointSaver } from "@langchain/langgraph-checkpoint";

import type { BookSearchCollection } from "@src/component/vectordb/collections/bookSearch";
import type { BooksTable } from "@src/component/coredb/tables/books";
import type { BookChaptersTable } from "@src/component/coredb/tables/bookChapter";
import type { BookPagesTable } from "@src/component/coredb/tables/bookPage";
import type { ChatStateTable } from "@src/component/coredb/tables/chatState";

import { BotMessage, ChatState } from "@shared/chat";
import { generateId } from "@src/util";
import { createAgentTools } from "../tools";
import { createReactStyleAgentGraph } from "../reactAgentGraph";
import { getSystemPrompt } from "./prompt";

const OPENAI_CHAT_MODEL = "gpt-5.4";
const MAX_STEPS = 10;

export class AssistantAgentService {
  private bookSearchCollection: BookSearchCollection;
  private booksTable: BooksTable;
  private bookChaptersTable: BookChaptersTable;
  private bookPagesTable: BookPagesTable;
  private chatStateTable: ChatStateTable;
  private conversationCheckpointer: BaseCheckpointSaver;
  private openaiApiKey: string;

  constructor(
    openaiApiKey: string,
    bookSearchCollection: BookSearchCollection,
    booksTable: BooksTable,
    bookChaptersTable: BookChaptersTable,
    bookPagesTable: BookPagesTable,
    chatStateTable: ChatStateTable,
    conversationCheckpointer: BaseCheckpointSaver,
  ) {
    this.bookSearchCollection = bookSearchCollection;
    this.booksTable = booksTable;
    this.bookChaptersTable = bookChaptersTable;
    this.bookPagesTable = bookPagesTable;
    this.chatStateTable = chatStateTable;
    this.conversationCheckpointer = conversationCheckpointer;
    this.openaiApiKey = openaiApiKey;
  }

  async conversate(
    query: string,
    bookId: string,
    pageNumber: number,
    chatId?: string,
  ): Promise<BotMessage> {
    const threadId = chatId || generateId();
    const userMessage = new HumanMessage(`Query: ${query}`);

    let messages: BaseMessage[];
    let chatState: ChatState;

    if (chatId) {
      const retrievedChatState = await this.chatStateTable.getById(chatId);

      if (!retrievedChatState) {
        throw new Error(`Chat state with ID ${chatId} not found`);
      }

      chatState = retrievedChatState;
      messages = [userMessage];
    } else {
      const book = await this.booksTable.getById(bookId);

      if (!book) {
        throw new Error(`Book with ID ${bookId} not found`);
      }

      const chapters = await this.bookChaptersTable.getChaptersByBookId(bookId);

      const systemPrompt = getSystemPrompt(book, chapters, pageNumber);

      const createdChatState = await this.chatStateTable.insert({
        id: threadId,
        book_id: bookId,
        last_page_read: pageNumber,
        chat_type: "assistant",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (!createdChatState) {
        throw new Error("Failed to create new chat state");
      }

      chatState = createdChatState;
      messages = [new SystemMessage(systemPrompt), userMessage];
    }

    const tools = createAgentTools(
      chatState.book_id,
      this.bookPagesTable,
      this.bookSearchCollection,
      chatState.last_page_read,
    );

    const model = new ChatOpenAI({
      modelName: OPENAI_CHAT_MODEL,
      openAIApiKey: this.openaiApiKey,
    });

    const agent = createReactStyleAgentGraph(
      model,
      tools,
      this.conversationCheckpointer,
    );

    const agentResult = await agent.invoke(
      { messages },
      {
        recursionLimit: MAX_STEPS * 2,
        configurable: { thread_id: threadId },
      },
    );

    const finalMessages: BaseMessage[] = agentResult.messages;
    const lastMessage = finalMessages[finalMessages.length - 1];

    if (!lastMessage) {
      throw new Error("Agent returned no messages");
    }

    const responseMessage =
      typeof lastMessage.content === "string"
        ? lastMessage.content
        : JSON.stringify(lastMessage.content);

    return { message: responseMessage, chat_id: threadId };
  }
}
