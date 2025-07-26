import type { Collection } from "chromadb";
import type ChromaDB from "..";

export default abstract class VectorCollection {
  abstract collectionName: string;

  protected collection: Collection | undefined;

  initialize(collection: Collection): void {
    if (this.collection) {
      throw new Error(
        `Collection ${this.collectionName} is already initialized.`,
      );
    }
    this.collection = collection;
  }

  constructor(chromaDb: ChromaDB) {
    chromaDb.addVectorCollection(this);
  }
}
