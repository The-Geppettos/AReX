import { generateId } from "@src/util";
import { VectorCollection } from "./abstract";

export type BookContentMetadata = {
  book_id: string;
  chapter_id: string;
  offset: number;
  chapter_number: number;
  page_number: number;
  chapter_title: string;
};

export class BookContentVectorCollection extends VectorCollection {
  collectionName = "book_content";

  async insert(content: string, metadata: BookContentMetadata): Promise<void> {
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
    offset: number,
    limit: number,
  ) {
    if (!this.collection) {
      throw new Error("Collection is not initialized.");
    }
    const results = await this.collection.query<BookContentMetadata>({
      queryTexts: queryTexts,
      where: { $and: [{ book_id: bookId }, { offset: { $lt: offset } }] },
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
