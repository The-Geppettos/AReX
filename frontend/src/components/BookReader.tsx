import React, { useState, useEffect, useRef } from "react";
import { Box, Paper, Typography, CircularProgress } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Theme } from "@mui/material/styles";
import { Book } from "@shared/types";
import ExtAPI from "../api/extApi";

const ReaderContainer = styled(Paper)(({ theme }: { theme: Theme }) => ({
  padding: theme.spacing(3),
  height: "100vh",
  overflow: "hidden",
}));

const BookContent = styled(Box)(({ theme }: { theme: Theme }) => ({
  padding: theme.spacing(2),
  height: "100%",
  overflowY: "hidden",
  borderRight: `1px solid ${theme.palette.divider}`,
  width: "66.67%",
}));

const AIPanel = styled(Box)(({ theme }: { theme: Theme }) => ({
  padding: theme.spacing(2),
  height: "100%",
  overflowY: "auto",
  backgroundColor: theme.palette.grey[50],
  width: "33.33%",
}));

const ContentContainer = styled(Box)({
  display: "flex",
  height: "100%",
  gap: "16px",
});

interface BookReaderProps {
  bookId: string;
}

const BookReader: React.FC<BookReaderProps> = ({ bookId }) => {
  const contentElementRef = useRef<HTMLDivElement>(
    null,
  ) as React.RefObject<HTMLDivElement>;
  const contentContainerElementRef = useRef<HTMLDivElement>(
    null,
  ) as React.RefObject<HTMLDivElement>;

  const [bookInfo, setBookInfo] = useState<Book | null>(null);
  const [startOffset, setStartOffset] = useState<number | null>(null);
  const endOffsetRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contentTextRef = useRef<string>("");

  useEffect(() => {
    const fetchBookData = async () => {
      try {
        const bookInfo = await ExtAPI.getBookInfo(bookId);
        setBookInfo(bookInfo);
        // For now, we'll set offset to 0 as a placeholder
        setStartOffset(0);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching book data:", error);
        setError("Failed to load book. Please try again later.");
        setLoading(false);
      }
    };

    fetchBookData();
  }, [bookId]);

  const loadTextContent = async (bookId: string, offset: number) => {
    endOffsetRef.current = offset;
    contentTextRef.current = "";

    while (true) {
      let bookChunk;

      try {
        bookChunk = await ExtAPI.getBookChunk(bookId, endOffsetRef.current);
        if (bookChunk === "REACHED_MAX") {
          break; // No more chunks available
        }
      } catch (error) {
        break;
      }

      const content = bookChunk.chunk.slice(
        endOffsetRef.current - bookChunk.offset_start,
      );

      contentTextRef.current += content;
      contentElementRef.current.innerText = contentTextRef.current;

      const walker = document.createTreeWalker(contentElementRef.current);

      const contentContainerRect =
        contentContainerElementRef.current.getBoundingClientRect();

      let visibleLength = 0;
      let overflow = false;

      while (walker.nextNode()) {
        const node = walker.currentNode;

        if (node.nodeType === Node.TEXT_NODE) {
          const textContent = node.textContent || "";

          const range = document.createRange();
          range.selectNodeContents(node);
          const rect = range.getBoundingClientRect();

          if (rect.bottom > contentContainerRect.bottom) {
            // Overflow detected
            overflow = true;

            // Binary search to find the last visible character
            let low = 0;
            let high = textContent.length;
            while (low < high) {
              const mid = Math.floor((low + high) / 2);
              range.setStart(node, mid);
              range.setEnd(node, mid + 1);
              const midRect = range.getBoundingClientRect();

              if (midRect.bottom > contentContainerRect.bottom) {
                high = mid; // Move left
              } else {
                low = mid + 1; // Move right
              }
            }

            visibleLength += low;
            break;
          }

          visibleLength += textContent.length;
        } else if (
          node.nodeType === Node.ELEMENT_NODE &&
          node.nodeName === "BR"
        ) {
          visibleLength += 1; // Count <br> as a single character
        } else {
          console.error(
            "Unexpected node type in content element:",
            node.nodeType,
          );
        }
      }

      endOffsetRef.current += visibleLength;
      if (overflow) {
        break;
      }
    }
  };

  useEffect(() => {
    if (startOffset === null) return;
    const load = () => loadTextContent(bookId, startOffset);
    load().then(() => {
      window.addEventListener("resize", load);
    });

    return () => {
      window.removeEventListener("resize", load);
    };
  }, [bookId, startOffset]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!bookInfo) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Typography>Book not found</Typography>
      </Box>
    );
  }

  return (
    <ReaderContainer>
      <ContentContainer ref={contentContainerElementRef}>
        <BookContent>
          <Typography variant="h4" gutterBottom>
            {bookInfo.title}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            by {bookInfo.author}
          </Typography>
          <Typography
            ref={contentElementRef}
            variant="body1"
            style={{ whiteSpace: "pre-line" }}
          ></Typography>
        </BookContent>
        <AIPanel>
          <Typography variant="h6" gutterBottom>
            AI Assistance
          </Typography>
          <Typography variant="body2">Not Implemented Yet</Typography>
        </AIPanel>
      </ContentContainer>
    </ReaderContainer>
  );
};

export default BookReader;
