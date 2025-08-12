import { useEffect, useState } from "react";
import type { BookList } from "@shared/types";
import { BookManageAPI } from "@src/api/bookManage";
import {
  Box,
  Container,
  Divider,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from "@mui/material";
import { AutoStories, CloudDownload, CloudUpload } from "@mui/icons-material";

const ROWS_PAGE_OPTIONS = [5, 10, 25];

export const ManageBooks = () => {
  const [bookList, setBookList] = useState<BookList>({
    books: [],
    offset: 0,
    limit: ROWS_PAGE_OPTIONS[0],
    total: 0,
  });
  const [rowsPerPage, setRowsPerPage] = useState<number>(ROWS_PAGE_OPTIONS[0]);
  const [page, setPage] = useState<number>(0);

  const fetchBooks = async (rowsPerPage: number, page: number) => {
    try {
      const offset = page * rowsPerPage;
      const limit = rowsPerPage;
      const bookList = await BookManageAPI.getBookList(offset, limit);
      setBookList(bookList);
    } catch (err) {
      console.error("Error fetching books:", err);
      alert("Failed to fetch books");
    }
  };

  useEffect(() => {
    fetchBooks(rowsPerPage, page);
  }, [rowsPerPage, page]);

  return (
    <Container>
      <Box sx={{ margin: 1 }}>
        <Typography variant="h4" component="h1">
          Manage Books
        </Typography>
      </Box>
      <Divider sx={{ marginBottom: 2 }} />
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="center">Title</TableCell>
                <TableCell align="center">Author</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Created At</TableCell>
                <TableCell align="center">Last Updated</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bookList.books.map((book) => (
                <TableRow key={book.id}>
                  <TableCell align="center">{book.title}</TableCell>
                  <TableCell align="center">{book.author}</TableCell>
                  <TableCell align="center">{book.status}</TableCell>
                  <TableCell align="center">
                    {new Date(book.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="center">
                    {new Date(book.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      href={`/bookreader/read/${book.id}`}
                      title="Read Book"
                    >
                      <AutoStories />
                    </IconButton>
                    {book.status === "draft" && (
                      <IconButton
                        title="Publish"
                        color="primary"
                        onClick={async () => {
                          const confirm = window.confirm(
                            "Are you sure you want to publish this book?",
                          );
                          if (!confirm) return;
                          try {
                            await BookManageAPI.publishBook(book.id);
                            alert("Book published successfully");
                            await fetchBooks(rowsPerPage, page);
                          } catch (error) {
                            console.error("Error publishing book:", error);
                            alert("Failed to publish book");
                          }
                        }}
                      >
                        <CloudUpload />
                      </IconButton>
                    )}
                    {book.status === "published" && (
                      <IconButton
                        title="Unpublish"
                        color="error"
                        onClick={async () => {
                          const confirm = window.confirm(
                            "Are you sure you want to unpublish this book?",
                          );
                          if (!confirm) return;
                          try {
                            await BookManageAPI.unPublishBook(book.id);
                            alert("Book unpublished successfully");
                            await fetchBooks(rowsPerPage, page);
                          } catch (error) {
                            console.error("Error unpublishing book:", error);
                            alert("Failed to unpublish book");
                          }
                        }}
                      >
                        <CloudDownload />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  count={bookList.total}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={(_event, page) => setPage(page)}
                  onRowsPerPageChange={(event) => {
                    setRowsPerPage(parseInt(event.target.value, 10));
                    setPage(0);
                  }}
                  rowsPerPageOptions={ROWS_PAGE_OPTIONS}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};
