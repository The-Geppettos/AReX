export interface Book {
  id: string;
  title: string;
  author: string;
  created_at: string;
}

export interface BookWithChunkList extends Book {
  chunk_list: string[];
}

export interface BookChunk {
  id: string;
  book_id: string;
  content: string;
  word_count: number;
  word_count_cumulative: number;
  created_at: string;
}

export interface ContentAnalysis {
  characters: string[];
}