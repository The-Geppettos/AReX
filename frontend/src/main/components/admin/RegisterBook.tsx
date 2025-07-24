import { Fragment, useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  Container,
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
  const chapterIndexRef = useRef(0);

  const [chapters, setChapters] = useState<{
    value: {
      title: InputTextState;
      file: File;
      length: number;
      index: number;
    }[];
    error: string | null;
  }>({ value: [], error: null });

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

  const submit = async () => {
    if (!validate()) return;
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
                      disabled={index === 0}
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
                      disabled={index === chapters.value.length - 1}
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
            onClick={submit}
            size="large"
            sx={{ mt: 3 }}
          >
            Register Book
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default RegisterBook;
