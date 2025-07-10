export interface Book {
  id: string;
  title: string;
  author: string;
  created_at: string;
}

export interface BookDetail extends Book {
  max_offset: number;
}

export interface BookChunk {
  id: string;
  book_id: string;
  chunk: string;
  chunk_length: number;
  offset_start: number;
  offset_end: number;
  created_at: string;
}

export interface ContentAnalysis {
  characters: string[];
}
