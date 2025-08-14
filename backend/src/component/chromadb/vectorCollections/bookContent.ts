import { generateId } from "@src/util";
import { VectorCollection } from "./abstract";

export class BookContentVectorCollection extends VectorCollection {
  collectionName = "book_content";

  async insert(data: {
    book_id: string;
    chapter_id: string;
    offset: number;
    content: string;
  }): Promise<void> {
    if (!this.collection) {
      throw new Error("Collection is not initialized.");
    }
    const id = generateId();
    await this.collection.add({
      ids: [id],
      documents: [data.content],
      metadatas: [
        {
          book_id: data.book_id,
          chapter_id: data.chapter_id,
          offset: data.offset,
        },
      ],
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
    const results = await this.collection.query({
      queryTexts: queryTexts,
      where: { $and: [{ book_id: bookId }, { offset: { $lt: offset } }] },
      nResults: limit,
    });
    return results.documents;
  }

  async deleteAllByBookId(bookId: string): Promise<void> {
    if (!this.collection) {
      throw new Error("Collection is not initialized.");
    }

    await this.collection.delete({ where: { book_id: bookId } });
  }
}
