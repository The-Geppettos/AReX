import type { BookSearchCollection } from "@src/component/vectordb/collections/bookSearch";
import type { BooksTable } from "@src/component/coredb/tables/books";
import type { ChatHistoryTable } from "@src/component/coredb/tables/chatHistory";

import { OpenAI } from "openai";
import { getCharacterChatPrompts, getSearchQueryWritePrompts } from "./prompt";
import { BotMessage, ChatHistory, ChatMessage } from "@shared/chat";
import { generateId, searchResultToString } from "@src/util";
import { BookPagesTable } from "@src/component/coredb/tables/bookPage";

const OPENAI_CHAT_MODEL = "gpt-4o-mini";

export class CharacterAgentService {
  private bookSearchCollection;
  private booksTable;
  private chatHistoryTable;
  private bookPagesTable;
  private openai;

  constructor(
    openaiApiKey: string,
    bookSearchCollection: BookSearchCollection,
    booksTable: BooksTable,
    bookPagesTable: BookPagesTable,
    chatHistoryTable: ChatHistoryTable,
  ) {
    this.bookSearchCollection = bookSearchCollection;
    this.booksTable = booksTable;
    this.bookPagesTable = bookPagesTable;
    this.chatHistoryTable = chatHistoryTable;

    this.openai = new OpenAI({
      apiKey: openaiApiKey,
    });
  }

  async conversate(
    query: string,
    bookId: string,
    offset: number,
    pageNumber: number,
    chatHistoryId?: string,
    characterName?: string,
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
          pageNumber = chatHistory.search_page_number;
          characterName = chatHistory.chat_title;
        }
      } catch (error) {
        console.error(
          `Failed to retrieve chat history with ID ${chatHistoryId}:`,
          error,
        );
      }
    }

    const bookPage = await this.bookPagesTable.getByBookIdAndPageNumber(
      bookId,
      pageNumber,
    );

    if (!bookPage) {
      throw new Error(
        `Book page not found for book ID ${bookId} and page number ${pageNumber}`,
      );
    }

    const characterInfo = JSON.parse(bookPage.characters_info).find(
      (c: { name: string }) =>
        c.name.toLowerCase() === characterName?.toLowerCase(),
    );

    if (!characterInfo) {
      throw new Error(
        `Character with name ${characterName} not found on page ${pageNumber} of book ID ${bookId}`,
      );
    }

    const searchQueryWritePrompts = getSearchQueryWritePrompts(
      query,
      book.language,
      characterInfo.name,
      messagesStr,
    );

    const searchQueryResult = await this.openai.chat.completions.create({
      model: OPENAI_CHAT_MODEL,
      messages: [
        {
          role: "system",
          content: searchQueryWritePrompts.systemPrompt,
        },
        ...searchQueryWritePrompts.userQueries.map((q) => ({
          role: "user" as const,
          content: q,
        })),
      ],
    });

    const searchQuery = searchQueryResult.choices[0].message.content;

    if (!searchQuery) {
      throw new Error("No search query returned from OpenAI API");
    }

    const searchResult = await this.bookSearchCollection.search(
      [searchQuery],
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

    const characterChatPrompt = getCharacterChatPrompts(
      book.language,
      book.title,
      characterInfo,
      query,
      { search: { searchQuery, searchResult: searchResultStr } },
    );

    messages.push(
      ...characterChatPrompt.userQueries.map((q) => ({
        role: "user" as const,
        content: q,
      })),
    );

    messages.push(
      ...characterChatPrompt.assistantQueries.map((q) => ({
        role: "assistant" as const,
        content: q,
      })),
    );

    const result = await this.openai.chat.completions.create({
      model: OPENAI_CHAT_MODEL,
      messages: [
        {
          role: "system",
          content: characterChatPrompt.systemPrompt,
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

    const chatId = chatHistoryId || generateId();

    if (!chatHistoryId) {
      const newChatHistory = await this.chatHistoryTable.insert({
        id: chatId,
        book_id: bookId,
        chat_title: characterInfo.name,
        search_offset: offset,
        search_page_number: pageNumber,
        chat_messages: JSON.stringify(messages),
        chat_type: "character",
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

    return { message, chat_id: chatId };
  }
}
