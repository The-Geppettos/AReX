import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Box, Button, Container, Paper, Typography } from "@mui/material";
import { CloudUpload as UploadIcon } from "@mui/icons-material";
import type { TextItem } from "pdfjs-dist/types/src/display/api";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const BOOK_FILE_EXT = ["pdf", "txt"] as const;
type BookFileExt = (typeof BOOK_FILE_EXT)[number];

const BOOK_FILE_EXT_MAP: Record<BookFileExt, string> = {
  pdf: "application/pdf",
  txt: "text/plain",
};

type STATE =
  | {
      status: "idle";
      selectedFile: null;
      fileFormat: null;
    }
  | {
      status: "file_selected";
      selectedFile: File;
      fileFormat: BookFileExt;
    }
  | {
      status: "uploading";
      selectedFile: File;
      fileFormat: BookFileExt;
    };

const BookManage = () => {
  const [state, setState] = useState<STATE>({
    status: "idle",
    selectedFile: null,
    fileFormat: null,
  });

  const selectFile = (file: File) => {
    const format = file.name.split(".").pop()?.toLowerCase() as BookFileExt;
    if (
      BOOK_FILE_EXT.includes(format) &&
      BOOK_FILE_EXT_MAP[format] === file.type
    ) {
      setState({
        status: "file_selected",
        selectedFile: file,
        fileFormat: format,
      });
    } else {
      alert(
        `Unsupported file format: ${file.type}. Please upload a valid book file.`,
      );
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom sx={{ mb: 4, mt: 2 }}>
        Book Upload Management
      </Typography>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Upload New Book
        </Typography>

        <Box sx={{ mb: 3 }}>
          <label>
            <input
              type="file"
              accept={BOOK_FILE_EXT.map((format) => `.${format}`).join(", ")}
              disabled={!["idle", "file_selected"].includes(state.status)}
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  selectFile(file);
                }
              }}
            />
            <Button
              variant="outlined"
              component="span"
              disabled={!["idle", "file_selected"].includes(state.status)}
              startIcon={<UploadIcon />}
              fullWidth
              sx={{ py: 2, mb: 2 }}
              className="file-upload-button"
            >
              {state.selectedFile
                ? state.selectedFile.name
                : "Choose Book File"}
            </Button>
          </label>
          {state.selectedFile && (
            <Typography variant="body2" color="text.secondary">
              File size: {formatFileSize(state.selectedFile.size)}
            </Typography>
          )}
        </Box>

        <Button
          variant="contained"
          onClick={async () => {
            if (state.status === "file_selected") {
              switch (state.fileFormat) {
                case "pdf":
                  setState({
                    ...state,
                    status: "uploading",
                  });
                  try {
                    const arrayBuffer = await state.selectedFile.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument({
                      data: arrayBuffer,
                    }).promise;
                    let allText = "";

                    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                      const page = await pdf.getPage(pageNum);
                      const content = await page.getTextContent();
                      const strings = content.items.map((item) => {
                        let str = (item as TextItem).str;
                        if ((item as TextItem).hasEOL) {
                          str += "\n";
                        }
                        return str;
                      });
                      allText += strings.join("");
                    }

                    console.log(allText);
                  } catch (error) {
                    alert(error);
                  } finally {
                    setState({
                      ...state,
                      status: "file_selected",
                    });
                  }
                  break;
                default:
                  alert(`Unsupported file format: ${state.fileFormat}`);
              }
            }
          }}
          disabled={state.status !== "file_selected"}
          fullWidth
          startIcon={<UploadIcon />}
        >
          Upload Book
        </Button>
      </Paper>
    </Container>
  );
};

export default BookManage;
