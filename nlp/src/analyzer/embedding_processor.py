import os
import uuid
from typing import List

import chromadb
import chromadb.utils.embedding_functions as embedding_functions

from .chunker import chunk_sentences


class EmbeddingProcessor:
    """
    Handles the process of chunking text, creating embeddings, and storing them in ChromaDB.
    """

    def __init__(self, openai_api_key: str, openai_model_name: str = "text-embedding-ada-002"):
        """
        Initializes the EmbeddingProcessor.

        Args:
            openai_api_key: The API key for OpenAI services.
            openai_model_name: The name of the OpenAI embedding model to use.
        """
        if not openai_api_key:
            raise ValueError("OpenAI API key is required.")

        # Set up the embedding function using the provided OpenAI API key.
        self.openai_ef = embedding_functions.OpenAIEmbeddingFunction(
            api_key=openai_api_key,
            model_name=openai_model_name
        )

        # Initialize the ChromaDB client using connection details from environment variables.
        self.chroma_client = chromadb.HttpClient(
            host=os.environ.get("CHROMA_DB_HOST", "localhost"),
            port=int(os.environ.get("CHROMA_DB_PORT", "8000"))
        )

        # Get or create the collection, ensuring it's configured to use our embedding function.
        self.collection = self.chroma_client.get_or_create_collection(
            name="book_content_embeddings",
            embedding_function=self.openai_ef
        )

    def process_and_store(self, sentences: List[str], common_metadata: dict = None):
        """
        Chunks sentences, generates embeddings using OpenAI, and stores them in ChromaDB.

        Args:
            sentences: A list of sentences to process.
            common_metadata: A dictionary with common metadata to add to each chunk (e.g., book_id).
        """
        # Use the previously created chunker to split sentences into overlapping chunks.
        chunks = chunk_sentences(sentences)

        if not chunks:
            print("No chunks were generated from the provided sentences.")
            return

        # Prepare documents, metadata, and unique IDs for ChromaDB.
        documents = [" ".join(chunk) for chunk in chunks]
        ids = [str(uuid.uuid4()) for _ in chunks]
        metadatas = []

        for i, chunk in enumerate(chunks):
            # Start with the common metadata and add chunk-specific info.
            meta = (common_metadata or {}).copy()
            meta.update({
                "chunk_index": i,
                "sentence_count": len(chunk)
            })
            metadatas.append(meta)

        # Add the data to ChromaDB. The embedding function will be called automatically.
        self.collection.add(
            ids=ids,
            documents=documents,
            metadatas=metadatas
        )

        print(f"Successfully added {len(chunks)} chunk embeddings to the '{self.collection.name}' collection.")


# Example usage (for testing or demonstration)
if __name__ == '__main__':
    # This is an example of how you might use the EmbeddingProcessor.
    # It requires the OPENAI_API_KEY environment variable to be set.
    
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("Please set the OPENAI_API_KEY environment variable to run this example.")
    else:
        # Sample sentences to process
        sample_sentences = [
            "This is the first sentence of the story.",
            "It is a tale of adventure and discovery.",
            "Our hero starts his journey in a small village.",
            "He dreams of seeing the world and finding his fortune.",
            "Little does he know, danger lurks in the shadows.",
            "A mysterious figure is watching him from afar.",
            "The journey will be long and full of challenges.",
            "But our hero is determined to succeed.",
            "He packs his bag and says goodbye to his family.",
            "And so, the adventure begins."
        ]

        # Metadata that is common to all chunks from this document
        example_metadata = {"book_id": "example_book_001", "chapter": 3}

        try:
            # Initialize the processor
            processor = EmbeddingProcessor(openai_api_key=api_key)
            
            # Process the sentences and store the embeddings
            processor.process_and_store(sample_sentences, common_metadata=example_metadata)
            
            print("\nVerification: Querying the collection for a related concept...")
            results = processor.collection.query(
                query_texts=["a story about a brave adventurer"],
                n_results=2
            )
            print("Query results:")
            print(results)

        except Exception as e:
            print(f"An error occurred: {e}")
