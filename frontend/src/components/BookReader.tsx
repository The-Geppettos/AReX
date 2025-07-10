import React, { useState, useEffect, useRef } from "react";
import { Box, Paper, Typography, CircularProgress } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Theme } from "@mui/material/styles";
import { BookDetail } from "@shared/types";
import ExtAPI from "../api/extApi";

const ReaderContainer = styled(Paper)(({ theme }: { theme: Theme }) => ({
  padding: theme.spacing(3),
  height: "100vh",
  overflow: "hidden",
}));

const BookContent = styled(Box)(({ theme }: { theme: Theme }) => ({
  padding: theme.spacing(2),
  height: "100%",
  overflow: "hidden",
  columnCount: 1,
  width: "100%",
  ["@media (min-aspect-ratio:1/1)"]: {
    columnCount: 2,
  },
}));

const ContentContainer = styled(Box)({
  display: "flex",
  height: "100%",
  gap: "16px",
});

const HeaderHover = styled(Box)(({ theme }: { theme: Theme }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  backgroundColor: theme.palette.background.default,
  zIndex: theme.zIndex.appBar,
}));

const FooterHover = styled(Box)(({ theme }: { theme: Theme }) => ({
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: theme.palette.background.default,
  zIndex: theme.zIndex.appBar,
}));

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

  const [bookInfo, setBookInfo] = useState<BookDetail | null>(null);
  const [startOffset, setStartOffset] = useState<number | null>(null);
  const endOffsetRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const loadTextContent = async (
    bookId: string,
    offset: number,
    maxOffset: number,
  ) => {
    let endOffset = offset;
    let contentText = "";

    while (true) {
      if (endOffset > maxOffset) {
        break;
      }

      let bookChunk;

      try {
        bookChunk = await ExtAPI.getBookChunk(bookId, endOffset);
        if (bookChunk === "REACHED_MAX") {
          break;
        }
      } catch (error) {
        console.error("Error fetching book chunk:", error);
        break;
      }

      const content = bookChunk.chunk.slice(endOffset - bookChunk.offset_start);

      contentText += content;
      contentElementRef.current.innerText = contentText;

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

          if (
            rect.bottom > contentContainerRect.bottom ||
            rect.right > contentContainerRect.right
          ) {
            overflow = true;

            // Binary search to find the last visible character
            let low = 0;
            let high = textContent.length;
            while (low < high) {
              const mid = Math.floor((low + high) / 2);
              range.setStart(node, mid);
              range.setEnd(node, mid + 1);
              const midRect = range.getBoundingClientRect();

              if (
                midRect.bottom > contentContainerRect.bottom ||
                midRect.right > contentContainerRect.right
              ) {
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

      endOffset = offset + visibleLength;
      if (overflow) {
        break;
      }
    }

    endOffsetRef.current = endOffset;
  };

  useEffect(() => {
    if (bookInfo === null || startOffset === null) return;
    const load = () =>
      loadTextContent(bookId, startOffset, bookInfo.max_offset);
    const p = load().then(() => {
      window.addEventListener("resize", load);
    });

    return () => {
      p.then(() => {
        window.removeEventListener("resize", load);
      });
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
      <HeaderHover>
        <Typography variant="h4">{bookInfo.title}</Typography>
        <Typography variant="subtitle1">by {bookInfo.author}</Typography>
      </HeaderHover>
      <ContentContainer>
        <BookContent ref={contentContainerElementRef}>
          <Typography
            ref={contentElementRef}
            variant="body1"
            style={{ whiteSpace: "pre-line" }}
          />
        </BookContent>
      </ContentContainer>
    </ReaderContainer>
  );
};

export default BookReader;
