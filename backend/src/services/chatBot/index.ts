import type { BookContentVectorCollection } from "@src/component/chromadb/vectorCollections/bookContent";
import type { BooksTable } from "@src/component/maindb/tables/books";

export class ChatBotService {
  private openaiApiKey;
  private openaiChatModel;
  private bookContentVectorCollection;
  private booksTable;

  constructor(
    openaiApiKey: string,
    openaiChatModel: string,
    bookContentVectorCollection: BookContentVectorCollection,
    booksTable: BooksTable,
  ) {
    this.openaiApiKey = openaiApiKey;
    this.openaiChatModel = openaiChatModel;
    this.bookContentVectorCollection = bookContentVectorCollection;
    this.booksTable = booksTable;
  }

  async conversate(query: string, bookId: string, offset: number) {
    const result = await this.bookContentVectorCollection.search(
      [query],
      bookId,
      offset,
      5,
    );

    return result;
  }
}
