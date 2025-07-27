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
  Add,
  ArrowDownward,
  ArrowUpward,
  Delete,
  CloudUpload,
} from "@mui/icons-material";
import { BOOK_PAGE_HEIGHT, BOOK_PAGE_WIDTH } from "../../../bookreader/const";
import ExtAPI from "../../../api/extApi";

type BookPagenateResponse = {
  visibleContentLength: number;
};

type BookPagenateRequest = {
  chapterTitle: string | null;
  content: string;
  firstLineIndent: boolean;
  token: string;
  resolve: (value: BookPagenateResponse) => void;
  reject: (reason?: unknown) => void;
};

const BOOK_FILE_EXT = ["txt"] as const;
type BookFileExt = (typeof BOOK_FILE_EXT)[number];
const PREVIEW_WIDTH = 450;

const BOOK_FILE_EXT_MAP: Record<BookFileExt, string> = {
  txt: "text/plain",
};

type InputTextState = {
  value: string;
  error: string | null;
};

const RegisterNewBook = () => {
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

  const bookPaginate = (
    chapterTitle: string | null,
    content: string,
    firstLineIndent: boolean,
    token: string,
  ) => {
    return new Promise<BookPagenateResponse>((resolve, reject) => {
      setBookPaginateRequest({
        chapterTitle,
        content,
        firstLineIndent,
        resolve,
        reject,
        token,
      });
    });
  };

  const endBookPaginate = () => {
    setBookPaginateRequest(null);
  };

  const submit = async () => {
    if (!validate()) return;

    const confirm = window.confirm(
      "Are you sure you want to register this book?",
    );

    if (!confirm) {
      return;
    }

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

        let content = await getContentText(chapter.file);
        content = content.trim().split(/\n+/).join("\n");

        const tokenPrefix = `book-${createdBook.id}-chapter-${createdChapter.id}`;

        let firstPage = true;

        let paragraphContinues = false;

        while (content.length) {
          const response = await bookPaginate(
            firstPage ? chapterTitle : null,
            content,
            !paragraphContinues,
            `${tokenPrefix}-${pageNumber}`,
          );

          const pageContent = content.slice(0, response.visibleContentLength);

          await ExtAPI.createBookPage({
            book_id: createdBook.id,
            chapter_id: createdChapter.id,
            content: pageContent.trim(),
            page_number: pageNumber++,
            paragraph_continues: paragraphContinues,
          });

          content = content.slice(response.visibleContentLength);

          paragraphContinues =
            !content.startsWith("\n") && !pageContent.endsWith("\n");

          content = content.trim();

          firstPage = false;
        }
      }
      alert(
        "Success!! Book is registered as a draft. Go to Manage Books menu to publish it.",
      );
    } catch (error) {
      console.error("Error generating page:", error);
      alert("Failed to generate page for chapter.");
    } finally {
      endBookPaginate();
      setIsUploading(false);
    }
  };

  const selectFile = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() as BookFileExt;
    if (!BOOK_FILE_EXT.includes(ext)) {
      alert(
        `Unsupported file format: ${ext}. Please upload a valid book file.`,
      );
      return;
    }
    if (BOOK_FILE_EXT_MAP[ext] !== file.type) {
      alert(
        `File type mismatch: expected ${BOOK_FILE_EXT_MAP[ext]}, got ${file.type}. Please upload a valid book file.`,
      );
      return;
    }

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
  };

  return (
    <Container maxWidth="lg">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Box sx={{ margin: 1 }}>
          <Typography variant="h4" component="h1">
            Register New Book
          </Typography>
        </Box>
        <Divider sx={{ marginBottom: 2 }} />
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <FormLabel component="span">
            <Typography variant="h5" component="div">
              Book Information
            </Typography>
          </FormLabel>

          <TextField
            name="book-title"
            label="Book Title"
            placeholder="Enter the title of the book"
            fullWidth
            margin="normal"
            error={!!bookTitle.error}
            helperText={bookTitle.error || "Enter the title of the book"}
            value={bookTitle.value}
            onChange={(e) =>
              setBookTitle({ value: e.target.value, error: null })
            }
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

          <Divider sx={{ mt: 3 }} />

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
                alignItems: "center",
              }}
            >
              <FormLabel component="span">
                <Typography variant="h5" component="div">
                  Chapters
                </Typography>
              </FormLabel>
              <label>
                <IconButton component="label">
                  <input
                    type="file"
                    multiple
                    accept={BOOK_FILE_EXT.map((format) => `.${format}`).join(
                      ", ",
                    )}
                    hidden
                    onChange={(e) => {
                      for (const file of e.target.files || []) {
                        selectFile(file);
                      }
                      e.target.value = "";
                    }}
                  />
                  <Add />
                </IconButton>
              </label>
            </Box>
            <FormHelperText>{chapters.error}</FormHelperText>
          </FormControl>

          {chapters.value.length > 0 ? (
            <Card>
              <List>
                {chapters.value.map((chapter, index) => (
                  <Fragment key={chapter.index}>
                    <ListItem>
                      <Box sx={{ mr: 3, ml: 1 }}>
                        <Typography
                          variant="h6"
                          component="div"
                          color="primary"
                        >
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
                        title="Move Up"
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
                        title="Move Down"
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
                        title="Delete Chapter"
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
          ) : (
            <Typography variant="body1" sx={{ mt: 2 }}>
              No chapters added yet. Click the add icon to upload a chapter
              file.
            </Typography>
          )}

          <Divider sx={{ mt: 5 }} />

          <Box
            sx={{
              mt: 5,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Button
              variant="contained"
              type="submit"
              size="large"
              disabled={isUploading}
              startIcon={<CloudUpload />}
            >
              Submit
            </Button>
          </Box>
        </Paper>
      </form>
      <Dialog open={!!bookPaginateRequest} maxWidth={false}>
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
  const tokenRef = useRef<string | null>(null);

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
    if (!bookPagenateRequest) return;

    if (!isReady) {
      if (tokenRef.current) {
        console.warn(
          "Book Preview is unloaded during pagination request. Waiting for reload...",
        );
        tokenRef.current = tokenRef.current + "-retry";
      }
      return;
    }

    if (tokenRef.current) {
    } else {
      tokenRef.current = bookPagenateRequest.token;
    }

    const reqToken = tokenRef.current;

    const handleResponse = (event: MessageEvent) => {
      if (event.source === previewRef.current?.contentWindow) {
        if (event.data.type === "book-page-preview-completed") {
          const resToken = event.data.token;
          if (!resToken) {
            console.warn("Received response without token. Ignoring.");
            return;
          }
          if (reqToken !== resToken) {
            console.warn(
              `Received response with token ${resToken}, expected ${reqToken}. Ignoring.`,
            );
            return;
          }
          const visibleContentLength = event.data.visible_content_length;
          if (typeof visibleContentLength !== "number") {
            bookPagenateRequest.reject(
              "Invalid response from preview: visible_content_length is not a number.",
            );
            return;
          }
          tokenRef.current = null;
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
        first_line_indent: bookPagenateRequest.firstLineIndent,
        width: PREVIEW_WIDTH,
        token: reqToken,
      },
      "*",
    );

    return () => {
      window.removeEventListener("message", handleResponse);
    };
  }, [isReady, bookPagenateRequest]);

  return (
    <>
      <DialogTitle>Book Page Preview</DialogTitle>
      <DialogContent>
        <iframe
          style={{ border: "none" }}
          width={PREVIEW_WIDTH}
          height={PREVIEW_WIDTH * (BOOK_PAGE_HEIGHT / BOOK_PAGE_WIDTH)}
          ref={previewRef}
          src="/bookreader/page-preview"
        />
      </DialogContent>
    </>
  );
};

export default RegisterNewBook;
