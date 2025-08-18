import type { BookContentVectorCollection } from "@src/component/chromadb/vectorCollections/bookContent";
import type { BooksTable } from "@src/component/maindb/tables/books";
import type { ChatHistoryTable } from "@src/component/maindb/tables/chatHistory";

import { OpenAI } from "openai";
import {
  getCharacterChatPrompts,
  getCharacterSearchCheckPrompt,
  getCharacterTraitSearchQuery,
  getSearchQueryWritePrompts,
  getUserCharacterExtractPrompt,
  NO_CHARACTER_SPECIFIED,
} from "./prompt";
import { BotMessage, CharacterCheck, ChatMessage } from "@shared/chat";
import { generateId, searchResultToString } from "@src/util";

const OPENAI_CHAT_MODEL = "gpt-4o-mini";

export class CharacterAgentService {
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

  async checkCharacter(
    query: string,
    bookId: string,
    offset: number,
  ): Promise<CharacterCheck> {
    const book = await this.booksTable.getById(bookId);
    if (!book) {
      throw new Error(`Book with ID ${bookId} not found`);
    }

    const userCharacterExtractPrompts = getUserCharacterExtractPrompt(
      query,
      book.language,
    );

    const userCharacterInput = await this.openai.chat.completions.create({
      model: OPENAI_CHAT_MODEL,
      messages: [
        {
          role: "system",
          content: userCharacterExtractPrompts.systemPrompt,
        },
        ...userCharacterExtractPrompts.userQueries.map((q) => ({
          role: "user" as const,
          content: q,
        })),
      ],
    });

    const userCharacter = userCharacterInput.choices[0].message.content;
    if (userCharacter === null) {
      throw new Error("No character name returned from OpenAI API");
    } else if (userCharacter === "") {
      return { has_character: false };
    }

    const characterSearch = await this.bookContentVectorCollection.search(
      [userCharacter],
      bookId,
      offset,
      2,
    );

    const searchResultStr = searchResultToString(
      characterSearch,
      book.language,
    )[0];

    const characterSearchCheckPrompt = getCharacterSearchCheckPrompt(
      book.language,
      userCharacter,
      searchResultStr,
    );

    const characterSearchCheck = await this.openai.chat.completions.create({
      model: OPENAI_CHAT_MODEL,
      messages: [
        {
          role: "system",
          content: characterSearchCheckPrompt.systemPrompt,
        },
        ...characterSearchCheckPrompt.userQueries.map((q) => ({
          role: "user" as const,
          content: q,
        })),
      ],
    });

    const characterName = characterSearchCheck.choices[0].message.content;
    if (characterName === null) {
      throw new Error("No character search result returned from OpenAI API");
    } else if (characterName === "") {
      return { has_character: false };
    }

    if (characterName === NO_CHARACTER_SPECIFIED[book.language]) {
      return {
        has_character: false,
      };
    }

    const characterTraitSearchQuery = getCharacterTraitSearchQuery(
      book.language,
      characterName,
    );

    const characterTraitSearchResult =
      await this.bookContentVectorCollection.search(
        characterTraitSearchQuery,
        bookId,
        offset,
        5,
      );

    const characterTraitSearch = searchResultToString(
      characterTraitSearchResult,
      book.language,
    ).map((searchResult, idx) => ({
      searchQuery: characterTraitSearchQuery[idx],
      searchResult: searchResult,
    }));

    const characterChatPrompts = getCharacterChatPrompts(
      book.language,
      book.title,
      characterName,
      query,
      {
        characterTraitSearch,
      },
    );

    const messages: ChatMessage[] = characterChatPrompts.userQueries.map(
      (q) => ({
        role: "user" as const,
        content: q,
      }),
    );

    messages.push(
      ...characterChatPrompts.assistantQueries.map((q) => ({
        role: "assistant" as const,
        content: q,
      })),
    );

    const response = await this.openai.chat.completions.create({
      model: OPENAI_CHAT_MODEL,
      messages: [
        {
          role: "system",
          content: characterChatPrompts.systemPrompt,
        },
        ...messages,
      ],
    });

    const responseMessage = response.choices[0].message.content;

    if (responseMessage === null) {
      throw new Error("No response message returned from OpenAI API");
    }

    messages.push({
      role: "assistant",
      content: responseMessage,
    });

    const chatHistory = await this.chatHistoryTable.insert({
      id: generateId(),
      book_id: bookId,
      chat_title: characterName,
      search_offset: offset,
      chat_messages: JSON.stringify(messages),
      chat_type: "character",
      created_at: new Date().toISOString(),
    });

    if (!chatHistory) {
      throw new Error("Failed to create chat history for character check");
    }

    return {
      has_character: true,
      character_name: characterName,
      chat_id: chatHistory.id,
      message: responseMessage,
    };
  }

  async conversate(
    query: string,
    bookId: string,
    chatHistoryId: string,
  ): Promise<BotMessage> {
    const book = await this.booksTable.getById(bookId);

    if (!book) {
      throw new Error(`Book with ID ${bookId} not found`);
    }

    const chatHistory = await this.chatHistoryTable.getById(chatHistoryId);
    if (!chatHistory) {
      throw new Error(`Chat history with ID ${chatHistoryId} not found`);
    }

    const searchQueryWritePrompts = getSearchQueryWritePrompts(
      query,
      book.language,
      book.title,
      chatHistory.chat_messages,
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

    const searchResult = await this.bookContentVectorCollection.search(
      [searchQuery],
      bookId,
      chatHistory.search_offset,
      7,
    );

    const searchResultStr = searchResultToString(
      searchResult,
      book.language,
    )[0];

    const messages = chatHistory.chat_messages
      ? (JSON.parse(chatHistory.chat_messages) as ChatMessage[])
      : [];

    const characterChatPrompt = getCharacterChatPrompts(
      book.language,
      book.title,
      chatHistory.chat_title,
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

    this.chatHistoryTable.updateById(chatHistoryId, {
      chat_messages: JSON.stringify(messages),
    });

    return { message, chat_id: chatHistoryId };
  }
}
