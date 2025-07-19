import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Box, Paper, Typography, CircularProgress } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import type { BookDetail } from "@shared/types";
import ExtAPI from "../api/extApi";

const ReaderContainer = styled(Paper)(({ theme }: { theme: Theme }) => ({
  padding: theme.spacing(3),
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  alignItems: "center",
}));

const BookContent = styled(Box)(({ theme }: { theme: Theme }) => ({
  padding: theme.spacing(2),
  overflow: "hidden",
  columnCount: 1,
  width: "100%",
  ["@media (min-aspect-ratio:1/1)"]: {
    columnCount: 2,
  },
}));

const Header = styled(Box)(({}: { theme: Theme }) => ({
  width: "100%",
}));
const Footer = styled(Box)(({}: { theme: Theme }) => ({
  width: "100%",
}));

interface BookReaderProps {
  bookId: string;
}

const BookReader: React.FC<BookReaderProps> = ({ bookId }) => {
  const elementRef = useRef<{
    readerContainer: HTMLDivElement;
    content: HTMLSpanElement;
    contentContainer: HTMLDivElement;
    header: HTMLDivElement;
    footer: HTMLDivElement;
  }>({
    readerContainer: {} as HTMLDivElement,
    content: {} as HTMLSpanElement,
    contentContainer: {} as HTMLDivElement,
    header: {} as HTMLDivElement,
    footer: {} as HTMLDivElement,
  });

  const [bookInfo, setBookInfo] = useState<BookDetail | null>(null);
  const [offsets, setOffsets] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleResize = () => {
    const computedStyle = getComputedStyle(elementRef.current.readerContainer);
    const paddingTop = parseFloat(computedStyle.paddingTop);
    const paddingBottom = parseFloat(computedStyle.paddingBottom);

    elementRef.current.contentContainer.style.height = `${
      elementRef.current.readerContainer.clientHeight -
      paddingTop -
      paddingBottom -
      elementRef.current.header.offsetHeight -
      elementRef.current.footer.offsetHeight
    }px`;
  };

  // TODO: Imrpove backward loading logic
  const loadTextContent = useCallback(
    async (
      bookId: string,
      offset: number,
      maxOffset: number,
      direction: "forward" | "backward",
    ) => {
      let newOffset = offset;
      let contentText = "";

      while (true) {
        if (newOffset > maxOffset) {
          break;
        } else if (newOffset < 0) {
          break;
        }

        let bookChunk;

        try {
          bookChunk = await ExtAPI.getBookChunk(bookId, newOffset);
        } catch (error) {
          console.error("Error fetching book chunk:", error);
          break;
        }

        let content;

        if (direction === "forward") {
          content = bookChunk.chunk.slice(newOffset - bookChunk.offset_start);
        } else {
          content = bookChunk.chunk.slice(
            0,
            bookChunk.offset_end - newOffset - 1,
          );
        }

        if (direction === "forward") {
          contentText += content;
        } else {
          contentText = content + contentText;
        }
        elementRef.current.content.innerText = contentText;

        const walker = document.createTreeWalker(elementRef.current.content);

        const contentContainerRect =
          elementRef.current.contentContainer.getBoundingClientRect();

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

        if (direction === "forward") {
          newOffset = offset + visibleLength;
        } else {
          newOffset = offset - visibleLength;
        }
        if (overflow) {
          break;
        }
      }

      if (direction === "forward") {
        newOffset -= 1;
      } else {
        newOffset += 1;
      }

      return newOffset;
    },
    [],
  );

  const load = useCallback(
    async (
      bookInfo: BookDetail,
      offset: number,
      direction: "forward" | "backward",
    ) => {
      handleResize();
      const newOffset = await loadTextContent(
        bookId,
        offset,
        bookInfo.max_offset,
        direction,
      );
      if (direction === "forward") {
        setOffsets([offset, newOffset]);
      } else {
        if (newOffset <= 0) {
          await load(bookInfo, 0, "forward");
        } else {
          setOffsets([newOffset, offset]);
        }
      }
    },
    [bookId, loadTextContent],
  );

  useEffect(() => {
    const fetchBookData = async () => {
      try {
        const bookInfo = await ExtAPI.getBookInfo(bookId);
        setBookInfo(bookInfo);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching book data:", error);
        setError("Failed to load book. Please try again later.");
        setLoading(false);
      }
    };

    fetchBookData();
  }, [bookId]);

  useEffect(() => {
    if (bookInfo === null) return;
    // TODO: load user's last read position
    load(bookInfo, 0, "forward");
  }, [bookInfo, load]);

  const readPercentage = useMemo(() => {
    if (!bookInfo || offsets === null) {
      return 0;
    }

    return Math.round((offsets[0] / bookInfo.max_offset) * 100);
  }, [offsets, bookInfo]);

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
    <ReaderContainer
      ref={(el) => {
        if (el) {
          elementRef.current.readerContainer = el as HTMLDivElement;
        }
      }}
    >
      <Header
        ref={(el) => {
          if (el) {
            elementRef.current.header = el as HTMLDivElement;
          }
        }}
      >
        <Typography variant="h5" gutterBottom>
          {bookInfo.title}
        </Typography>
        <Typography variant="subtitle1">by {bookInfo.author}</Typography>
      </Header>

      <BookContent
        ref={(el) => {
          if (el) {
            elementRef.current.contentContainer = el as HTMLDivElement;
          }
        }}
      >
        <Typography
          ref={(el) => {
            if (el) {
              elementRef.current.content = el;
            }
          }}
          variant="body1"
          style={{ whiteSpace: "pre-line" }}
        />
      </BookContent>

      <Footer
        ref={(el) => {
          if (el) {
            elementRef.current.footer = el as HTMLDivElement;
          }
        }}
      >
        <Typography variant="caption">{readPercentage}%</Typography>
        <Box display="flex" justifyContent="space-between" width="100%">
          <button
            disabled={offsets === null || offsets[0] <= 0}
            onClick={() => {
              if (offsets === null) return;

              load(bookInfo, offsets[0] - 1, "backward");
            }}
          >
            Previous Page
          </button>
          <button
            disabled={offsets === null || offsets[1] >= bookInfo.max_offset}
            onClick={() => {
              if (offsets === null) return;

              load(bookInfo, offsets[1] + 1, "forward");
            }}
          >
            Next Page
          </button>
        </Box>
      </Footer>
    </ReaderContainer>
  );
};

export default BookReader;
