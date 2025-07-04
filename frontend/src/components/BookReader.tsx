import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Theme } from '@mui/material/styles';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const ReaderContainer = styled(Paper)(({ theme }: { theme: Theme }) => ({
  padding: theme.spacing(3),
  height: '100vh',
  overflow: 'hidden',
}));

const BookContent = styled(Box)(({ theme }: { theme: Theme }) => ({
  padding: theme.spacing(2),
  height: '100%',
  overflowY: 'auto',
  borderRight: `1px solid ${theme.palette.divider}`,
  width: '66.67%',
}));

const AIPanel = styled(Box)(({ theme }: { theme: Theme }) => ({
  padding: theme.spacing(2),
  height: '100%',
  overflowY: 'auto',
  backgroundColor: theme.palette.grey[50],
  width: '33.33%',
}));

const ContentContainer = styled(Box)({
  display: 'flex',
  height: '100%',
  gap: '16px',
});

interface Book {
  id: string;
  title: string;
  author: string;
  full_text: string;
}

interface BookReaderProps {
  bookId: string;
}

const BookReader: React.FC<BookReaderProps> = ({ bookId }) => {
  const [book, setBook] = useState<Book | null>(null);
  const [aiAssistance, setAiAssistance] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookData = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/books/${bookId}`);
        setBook(response.data);
        // For now, we'll use a placeholder for AI assistance
        setAiAssistance('AI assistance will be implemented here...');
        setLoading(false);
      } catch (error) {
        console.error('Error fetching book data:', error);
        setError('Failed to load book. Please try again later.');
        setLoading(false);
      }
    };

    fetchBookData();
  }, [bookId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!book) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography>Book not found</Typography>
      </Box>
    );
  }

  return (
    <ReaderContainer>
      <ContentContainer>
        <BookContent>
          <Typography variant="h4" gutterBottom>
            {book.title}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            by {book.author}
          </Typography>
          <Typography variant="body1" style={{ whiteSpace: 'pre-line' }}>
            {book.full_text}
          </Typography>
        </BookContent>
        <AIPanel>
          <Typography variant="h6" gutterBottom>
            AI Assistance
          </Typography>
          <Typography variant="body2">{aiAssistance}</Typography>
        </AIPanel>
      </ContentContainer>
    </ReaderContainer>
  );
};

export default BookReader; 