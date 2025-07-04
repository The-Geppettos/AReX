import React, { useEffect, useState } from 'react';
import { Book } from '@shared/types';
import axios from 'axios';
import './BookList.css';
import { Link } from 'react-router-dom';

const BookList: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        console.log('Fetching books...');
        const response = await axios.get<Book[]>('http://localhost:3001/api/books');
        console.log('Received books:', response.data);
        setBooks(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching books:', err);
        setError('Failed to fetch books');
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  console.log('Rendering books:', books);

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
              <Link to={`/book/${book.id}`}>Read</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookList; 