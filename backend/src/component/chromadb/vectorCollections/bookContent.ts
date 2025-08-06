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
    await this.collection.add({
      ids: [data.book_id],
      documents: [data.content],
      metadatas: [
        {
          chapter_id: data.chapter_id,
          offset: data.offset,
          content: data.content,
        },
      ],
    });
  }
}
