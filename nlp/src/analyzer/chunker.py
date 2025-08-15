from typing import List

def chunk_sentences(sentences: List[str], chunk_size: int = 5, overlap: int = 2) -> List[List[str]]:
    """
    Splits a list of sentences into overlapping chunks.

    Args:
        sentences: A list of sentences to be chunked.
        chunk_size: The number of sentences in each chunk.
        overlap: The number of sentences to overlap between consecutive chunks.

    Returns:
        A list of lists, where each inner list is a chunk of sentences.
    """
    if not sentences:
        return []

    step = chunk_size - overlap
    if step <= 0:
        raise ValueError("Overlap size must be smaller than chunk size.")

    chunks = []
    for i in range(0, len(sentences), step):
        chunk = sentences[i:i + chunk_size]
        chunks.append(chunk)
    
    return chunks
