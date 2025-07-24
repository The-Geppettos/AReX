import { Fragment, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowDownward,
  ArrowUpward,
  Delete,
  CloudUpload as UploadIcon,
} from "@mui/icons-material";
import { BOOK_PAGE_HEIGHT, BOOK_PAGE_WIDTH } from "../../../bookreader/const";
import ExtAPI from "../../../api/extApi";

type BookPagenateResponse = {
  visibleContentLength: number;
};

type BookPagenateRequest = {
  chapterTitle: string | null;
  content: string;
  resolve: (value: BookPagenateResponse) => void;
  reject: (reason?: unknown) => void;
};

const BOOK_FILE_EXT = ["txt"] as const;
type BookFileExt = (typeof BOOK_FILE_EXT)[number];

const BOOK_FILE_EXT_MAP: Record<BookFileExt, string> = {
  txt: "text/plain",
};

type InputTextState = {
  value: string;
  error: string | null;
};

const RegisterBook = () => {
  const [bookTitle, setBookTitle] = useState<InputTextState>({
    value: "",
    error: null,
  });
  const [author, setAuthor] = useState<InputTextState>({
    value: "",
    error: null,
  });
  const [chapters, setChapters] = useState<{
    value: {
      title: InputTextState;
      file: File;
      length: number;
      index: number;
    }[];
    error: string | null;
  }>({ value: [], error: null });
  const [bookPaginateRequest, setBookPaginateRequest] =
    useState<BookPagenateRequest | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const chapterIndexRef = useRef(0);

  const validate = () => {
    let valid = true;
    if (!bookTitle.value.trim()) {
      setBookTitle((prev) => ({ ...prev, error: "Book title is required." }));
      valid = false;
    }
    if (!author.value.trim()) {
      setAuthor((prev) => ({ ...prev, error: "Author name is required." }));
      valid = false;
    }
    if (chapters.value.length === 0) {
      setChapters((prev) => ({
        ...prev,
        error: "At least one chapter is required.",
      }));
      valid = false;
    }
    for (const chapter of chapters.value) {
      if (!chapter.title.value.trim()) {
        setChapters((prev) => ({
          ...prev,
          error: "All chapters must have a title.",
        }));
        valid = false;
      }
    }

    return valid;
  };

  const getContentText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const bookPaginate = (chapterTitle: string | null, content: string) => {
    return new Promise<BookPagenateResponse>((resolve, reject) => {
      setBookPaginateRequest({
        chapterTitle,
        content,
        resolve,
        reject,
      });
    });
  };

  const endBookPaginate = () => {
    setBookPaginateRequest(null);
  };

  const submit = async () => {
    if (!validate()) return;

    try {
      setIsUploading(true);
      const createdBook = await ExtAPI.createBook({
        title: bookTitle.value.trim(),
        author: author.value.trim(),
      });

      let pageNumber = 1;

      for (const { chapter, idx } of chapters.value.map((chapter, idx) => ({
        chapter,
        idx,
      }))) {
        const chapterTitle = chapter.title.value.trim();

        const createdChapter = await ExtAPI.createBookChapter({
          book_id: createdBook.id,
          title: chapterTitle,
          chapter_number: idx + 1,
        });

        const content = await getContentText(chapter.file);

        let offset = 0;
        let firstPage = true;

        while (offset < content.length) {
          let pageContent = content.slice(offset);

          const response = await bookPaginate(
            firstPage ? chapterTitle : null,
            pageContent,
          );

          pageContent = pageContent
            .slice(0, response.visibleContentLength)
            .trim();

          if (pageContent.length > 0) {
            await ExtAPI.createBookPage({
              book_id: createdBook.id,
              chapter_id: createdChapter.id,
              content: pageContent,
              page_number: pageNumber++,
            });
          }

          firstPage = false;
          offset += response.visibleContentLength;
        }
      }
    } catch (error) {
      console.error("Error generating page:", error);
      alert("Failed to generate page for chapter.");
    } finally {
      endBookPaginate();
      setIsUploading(false);
      alert("Book registered successfully!");
    }
  };

  const selectFile = (file: File) => {
    const format = file.name.split(".").pop()?.toLowerCase() as BookFileExt;
    if (
      BOOK_FILE_EXT.includes(format) &&
      BOOK_FILE_EXT_MAP[format] === file.type
    ) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const title = file.name.split(".").slice(0, -1).join(".");

        const text = e.target?.result as string;
        const length = text.length;

        setChapters((prev) => ({
          value: [
            ...prev.value,
            {
              title: { value: title, error: null },
              file,
              length,
              index: chapterIndexRef.current++,
            },
          ],
          error: null,
        }));
      };
      reader.readAsText(file);
    } else {
      alert(
        `Unsupported file format: ${file.type}. Please upload a valid book file.`,
      );
    }
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 4, mt: 2 }}>
          Register Book
        </Typography>

        <Typography variant="h5">Book Information</Typography>

        <TextField
          name="book-title"
          label="Book Title"
          placeholder="Enter the title of the book"
          fullWidth
          margin="normal"
          error={!!bookTitle.error}
          helperText={bookTitle.error || "Enter the title of the book"}
          value={bookTitle.value}
          onChange={(e) => setBookTitle({ value: e.target.value, error: null })}
          disabled={isUploading}
        />
        <TextField
          name="author"
          label="Author"
          placeholder="Enter the author's name"
          fullWidth
          error={!!author.error}
          helperText={author.error || "Enter the author's name"}
          margin="normal"
          value={author.value}
          onChange={(e) => setAuthor({ value: e.target.value, error: null })}
          disabled={isUploading}
        />

        <FormControl
          sx={{
            mt: 4,
            mb: 2,
          }}
          error={!!chapters.error}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
            }}
          >
            <FormLabel component="span">
              <Typography variant="h5">Chapters</Typography>
            </FormLabel>
            <Button
              variant="contained"
              component="label"
              sx={{ ml: 2 }}
              startIcon={<UploadIcon />}
              disabled={isUploading}
            >
              Upload ({BOOK_FILE_EXT.map((ext) => `.${ext}`).join(", ")})
              <input
                type="file"
                multiple
                accept={BOOK_FILE_EXT.map((format) => `.${format}`).join(", ")}
                hidden
                onChange={(e) => {
                  for (const file of e.target.files || []) {
                    if (file) {
                      selectFile(file);
                    }
                  }
                  e.target.value = "";
                }}
              />
            </Button>
          </Box>
          <FormHelperText>{chapters.error}</FormHelperText>
        </FormControl>

        {chapters.value.length > 0 && (
          <Card>
            <List>
              {chapters.value.map((chapter, index) => (
                <Fragment key={chapter.index}>
                  <ListItem>
                    <Box sx={{ mr: 3, ml: 1 }}>
                      <Typography variant="h6" color="primary">
                        Chapter {index + 1}
                      </Typography>
                    </Box>
                    <ListItemText
                      primary={
                        <TextField
                          name={`chapter-title-${index}`}
                          label="Chapter Title"
                          placeholder="Enter the chapter title"
                          value={chapter.title.value}
                          fullWidth
                          error={!!chapter.title.error}
                          helperText={
                            chapter.title.error || "Enter the chapter title"
                          }
                          margin="normal"
                          disabled={isUploading}
                          onChange={(e) =>
                            setChapters((prev) => ({
                              value: prev.value.map((c, i) =>
                                i === index
                                  ? {
                                      ...c,
                                      title: {
                                        value: e.target.value,
                                        error: null,
                                      },
                                    }
                                  : c,
                              ),
                              error: null,
                            }))
                          }
                        />
                      }
                      secondary={`${chapter.file.name} (${chapter.length} characters)`}
                      sx={{ mr: 2 }}
                    />

                    <IconButton
                      disabled={isUploading || index === 0}
                      size="small"
                      onClick={() => {
                        setChapters((prev) => {
                          const newChapters = [...prev.value];
                          const temp = newChapters[index - 1];
                          newChapters[index - 1] = newChapters[index];
                          newChapters[index] = temp;
                          return {
                            value: newChapters,
                            error: null,
                          };
                        });
                      }}
                    >
                      <ArrowUpward />
                    </IconButton>
                    <IconButton
                      disabled={
                        isUploading || index === chapters.value.length - 1
                      }
                      size="small"
                      onClick={() => {
                        setChapters((prev) => {
                          const newChapters = [...prev.value];
                          const temp = newChapters[index + 1];
                          newChapters[index + 1] = newChapters[index];
                          newChapters[index] = temp;
                          return {
                            value: newChapters,
                            error: null,
                          };
                        });
                      }}
                    >
                      <ArrowDownward />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      disabled={isUploading}
                      onClick={() =>
                        setChapters((prev) => ({
                          value: prev.value.filter((_, i) => i !== index),
                          error: null,
                        }))
                      }
                    >
                      <Delete />
                    </IconButton>
                  </ListItem>
                  {index < chapters.value.length - 1 && <Divider />}
                </Fragment>
              ))}
            </List>
          </Card>
        )}

        <Box
          sx={{
            mt: 3,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Button
            variant="contained"
            onClick={() => {
              const confirm = window.confirm(
                "Are you sure you want to register this book?",
              );
              if (confirm) {
                submit();
              }
            }}
            size="large"
            disabled={isUploading}
            sx={{ mt: 3 }}
          >
            Register Book
          </Button>
        </Box>
      </Paper>
      <Dialog open={!!bookPaginateRequest}>
        <BookPaginatorDialog bookPagenateRequest={bookPaginateRequest} />
      </Dialog>
    </Container>
  );
};

const BookPaginatorDialog = ({
  bookPagenateRequest,
}: {
  bookPagenateRequest: BookPagenateRequest | null;
}) => {
  const previewRef = useRef<HTMLIFrameElement>({} as HTMLIFrameElement);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source === previewRef.current?.contentWindow) {
        if (event.data.type === "book-page-preview-load") {
          setIsReady(true);
        }
        if (event.data.type === "book-page-preview-unload") {
          setIsReady(false);
        }
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  useEffect(() => {
    if (isReady && bookPagenateRequest) {
      const handleResponse = (event: MessageEvent) => {
        if (event.source === previewRef.current?.contentWindow) {
          if (event.data.type === "book-page-preview-completed") {
            const visibleContentLength = event.data.visible_content_length;
            if (typeof visibleContentLength !== "number") {
              bookPagenateRequest.reject(
                "Invalid response from preview: visible_content_length is not a number.",
              );
              return;
            }
            bookPagenateRequest.resolve({ visibleContentLength });

            window.removeEventListener("message", handleResponse);
          }
        }
      };

      window.addEventListener("message", handleResponse);

      previewRef.current.contentWindow?.postMessage(
        {
          type: "book-page-preview-start",
          chapter_title: bookPagenateRequest.chapterTitle,
          content: bookPagenateRequest.content,
        },
        "*",
      );
    }
  }, [isReady, bookPagenateRequest]);

  return (
    <>
      <DialogTitle>Book Page Preview</DialogTitle>
      <DialogContent>
        <iframe
          width={BOOK_PAGE_WIDTH}
          height={BOOK_PAGE_HEIGHT}
          ref={previewRef}
          src="/bookreader/page-preview"
        />
      </DialogContent>
    </>
  );
};

export default RegisterBook;
