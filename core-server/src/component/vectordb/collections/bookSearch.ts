import { generateId } from "@src/util";
import { Collection } from "./abstract";

export type BookSearchMetadata = {
  book_id: string;
  chapter_id: string;
  offset: number;
  chapter_number: number;
  page_number: number;
  chapter_title: string;
};

export class BookSearchCollection extends Collection {
  collectionName = "book_search";

  async insert(content: string, metadata: BookSearchMetadata): Promise<void> {
    if (!this.collection) {
      throw new Error("Collection is not initialized.");
    }
    const id = generateId();
    await this.collection.add({
      ids: [id],
      documents: [content],
      metadatas: [metadata],
    });
  }

  async search(
    queryTexts: string[],
    bookId: string,
    limit: number,
    pageFrom: number,
    pageTo: number,
  ) {
    if (!this.collection) {
      throw new Error("Collection is not initialized.");
    }
    const results = await this.collection.query<BookSearchMetadata>({
      queryTexts: queryTexts,
      where: {
        $and: [
          { book_id: bookId },
          { page_number: { $gte: pageFrom } },
          { page_number: { $lte: pageTo } },
        ],
      },
      nResults: limit,
    });
    return results;
  }

  async deleteAllByBookId(bookId: string): Promise<void> {
    if (!this.collection) {
      throw new Error("Collection is not initialized.");
    }

    await this.collection.delete({ where: { book_id: bookId } });
  }
}
