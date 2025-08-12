import { useEffect, useState } from "react";
import type { BookList } from "@shared/types";
import { BookManageAPI } from "@src/api/bookManage";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  Divider,
  IconButton,
  styled,
  Typography,
} from "@mui/material";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";

const BOOKS_PER_PAGE = 16;

export const BookListView = () => {
  const [bookList, setBookList] = useState<BookList>({
    books: [],
    offset: 0,
    limit: BOOKS_PER_PAGE,
    total: 0,
  });
  const [page, setPage] = useState<number>(0);

  const fetchBooks = async (page: number) => {
    try {
      const offset = page * BOOKS_PER_PAGE;
      const limit = BOOKS_PER_PAGE;
      const bookList = await BookManageAPI.getBookList(offset, limit);
      setBookList(bookList);
    } catch (err) {
      console.error("Error fetching books:", err);
      alert("Failed to fetch books");
    }
  };

  useEffect(() => {
    fetchBooks(page);
  }, [page]);

  return (
    <Container>
      <Box sx={{ margin: 1 }}>
        <Typography variant="h4" component="h1">
          Avaliable Books
        </Typography>
      </Box>
      <Divider sx={{ marginBottom: 2 }} />
      {bookList.books.length === 0 ? (
        <Typography>No books available</Typography>
      ) : (
        <BookListGrid>
          {bookList.books.map((book) => (
            <Card key={book.id}>
              <CardContent>
                <Typography variant="h5" component="div">
                  {book.title}
                </Typography>
                <Typography color="text.secondary">By {book.author}</Typography>
              </CardContent>
              <CardActions>
                <Button href={`/bookreader/read/${book.id}`}>Read</Button>
              </CardActions>
            </Card>
          ))}
        </BookListGrid>
      )}
      <Box
        sx={{
          mt: 4,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <IconButton disabled={page === 0} onClick={() => setPage(page - 1)}>
          <ArrowBackIos />
        </IconButton>
        <Typography sx={{ mx: 2 }}>
          Page {page + 1} of {Math.ceil(bookList.total / BOOKS_PER_PAGE)}
        </Typography>
        <IconButton
          disabled={bookList.offset + BOOKS_PER_PAGE >= bookList.total}
          onClick={() => setPage(page + 1)}
        >
          <ArrowForwardIos />
        </IconButton>
      </Box>
    </Container>
  );
};

const BookListGrid = styled(Box)`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 16px;
  ${({ theme }) => theme.breakpoints.down("md")} {
    grid-template-columns: 1fr 1fr;
  }
  ${({ theme }) => theme.breakpoints.down("sm")} {
    grid-template-columns: 1fr;
  }
`;
