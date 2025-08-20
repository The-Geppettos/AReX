import type { Collection as ChromaCollection } from "chromadb";
import type { VectorDB } from "..";

export abstract class Collection {
  abstract collectionName: string;

  protected collection: ChromaCollection | undefined;

  initialize(collection: ChromaCollection): void {
    if (this.collection) {
      throw new Error(
        `Collection ${this.collectionName} is already initialized.`,
      );
    }
    this.collection = collection;
  }

  constructor(vectorDb: VectorDB) {
    vectorDb.addCollection(this);
  }
}
