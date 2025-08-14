import os
import openai
import itertools
from ..db_clients.maindb_client import MainDBClient
from ..db_clients.chromadb_client import ChromaDBClient
from .abstract import Analyzer
from .korean import KoreanAnalyzer
from .english import EnglishAnalyzer

# Initialize OpenAI client
openai.api_key = os.environ.get("OPENAI_API_KEY")

analyzers = {
    "ko": KoreanAnalyzer,
    "en": EnglishAnalyzer
}

def get_analyzer(language: str) -> Analyzer:
    if language not in analyzers:
        raise ValueError(f"Unsupported language: {language}")
    return analyzers[language]()

def sliding_window(iterable, size, step):
    it = iter(iterable)
    window = list(itertools.islice(it, size))
    if len(window) == size:
        yield window
    for i in range(step - (len(window) % step)):
         next(it, None) # advance the iterator
    for elem in it:
        window = window[step:] + [elem]
        yield window

def analyze(content: str, prev_content: str | None, language: str, book_page_id: str):
    maindb = None
    try:
        # --- 1. Sentence Splitting (existing logic) ---
        analyzer = get_analyzer(language)
        combined_content = prev_content + content if prev_content is not None else content
        current_content_start_offset = len(prev_content) if prev_content is not None else 0

        sentence_boundaries = []
        offset = 0
        for paragraph in combined_content.split("\n"):
            sb = analyzer.get_sentence_boundaries(paragraph)
            for s, e in sb:
                start = s + offset
                end = e + offset
                if start >= current_content_start_offset:
                    sentence_boundaries.append([start - current_content_start_offset, end - current_content_start_offset])
                elif end > current_content_start_offset:
                    sentence_boundaries.append([start - current_content_start_offset, end - current_content_start_offset])
            offset += len(paragraph) + 1

        # --- 2. Store Sentence Boundaries in MainDB ---
        print(f"Storing {len(sentence_boundaries)} sentence boundaries for page {book_page_id}...")
        maindb = MainDBClient()
        # This assumes a table named 'page_sentence_boundaries' exists.
        # A more robust solution would check for the table and create it if it doesn't exist.
        # For now, we assume the backend has created it.
        for start, end in sentence_boundaries:
            maindb.execute(
                "INSERT INTO page_sentence_boundaries (book_page_id, start_offset, end_offset) VALUES (%s, %s, %s)",
                (book_page_id, start, end)
            )
        print("Successfully stored sentence boundaries.")

        # --- 3. Chunking (5 sentences with 2-sentence overlap) ---
        sentences = [content[s:e] for s, e in sentence_boundaries]
        chunk_size = 5
        overlap_size = 2
        step_size = chunk_size - overlap_size

        chunks = list(sliding_window(sentences, chunk_size, step_size))
        print(f"Created {len(chunks)} chunks.")

        # --- 4. & 5. Embedding and Storing in VectorDB ---
        if chunks:
            print(f"Embedding and storing {len(chunks)} chunks...")
            chromadb = ChromaDBClient()
            
            chunk_docs = [" ".join(chunk) for chunk in chunks]
            
            # Get embeddings from OpenAI
            embedding_response = openai.Embedding.create(
                input=chunk_docs,
                model=os.environ.get("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
            )
            embeddings = [item.embedding for item in embedding_response.data]

            # Prepare data for ChromaDB
            ids = [f"{book_page_id}-{i}" for i in range(len(chunks))]
            metadatas = [{"book_page_id": book_page_id, "chunk_index": i, "source": "book_content"} for i in range(len(chunks))]

            # Add to ChromaDB
            chromadb.collection.add(ids=ids, embeddings=embeddings, documents=chunk_docs, metadatas=metadatas)
            print("Successfully stored embeddings.")

        return {
            "sentences_found": len(sentence_boundaries),
            "chunks_embedded": len(chunks)
        }

    except Exception as e:
        print(f"An error occurred during analysis: {e}")
        # Re-raise the exception to notify the caller in main.py
        raise e
    finally:
        if maindb:
            maindb.close()