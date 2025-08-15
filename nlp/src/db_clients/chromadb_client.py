import chromadb
import os

class ChromaDBClient:
    def __init__(self):
        self.client = chromadb.HttpClient(
            host=os.environ["CHROMA_DB_HOST"],
            port=os.environ["CHROMA_DB_PORT"]
        )
        self.collection = self.client.get_or_create_collection(name="book_content_embeddings")

    def add_embeddings(self, ids, documents, metadatas):
        self.collection.add(
            ids=ids,
            documents=documents,
            metadatas=metadatas
        )

