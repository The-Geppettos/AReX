import React, { useEffect, useState } from "react";
import type { Book } from "@shared/types";
import "./BookList.css";
import ExtAPI from "../../api/extApi";

const BookList: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const bookList = await ExtAPI.getBookList();
        setBooks(bookList);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching books:", err);
        setError("Failed to fetch books");
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="book-list">
      <h2>Available Books</h2>
      {books.length === 0 ? (
        <p>No books available</p>
      ) : (
        <div className="books-grid">
          {books.map((book) => (
            <div key={book.id} className="book-card">
              <h3>{book.title}</h3>
              <p>By {book.author}</p>
              <p>Added on {new Date(book.created_at).toLocaleDateString()}</p>
              <a href={`/bookreader/${book.id}`}>Read</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookList;
