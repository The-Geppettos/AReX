import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Book, BookPageDetail } from "@shared/types";
import { ReadBookAPI } from "@src/api/readBook";
import { BookPageView } from "../pageView";
import { BREAK_ASPECT_RATIO, SINGLE_PAGE_ASPECT_RATIO } from "../../const";
import { indentFirstLine } from "@src/lib";
import { ControlOverlay } from "./ControlOverlay";

interface BookReaderProps {
  bookId: string;
}

const TROTTLE_TIME = 100;

export const BookReader = ({ bookId }: BookReaderProps) => {
  const readerRef = React.useRef<HTMLDivElement>({} as HTMLDivElement);
  const headerRef = React.useRef<HTMLDivElement>({} as HTMLDivElement);
  const footerRef = React.useRef<HTMLDivElement>({} as HTMLDivElement);

  const [bookInfo, setBookInfo] = useState<Book | null>(null);
  const [pageNumber, setPageNumber] = useState<number | null>(null);
  const [leftPage, setLeftPage] = useState<BookPageDetail | null>(null);
  const [rightPage, setRightPage] = useState<BookPageDetail | null>(null);
  const [showSinglePage, setShowSinglePage] = useState<boolean>(false);
  const [pageWidth, setPageWidth] = useState<number | null>(null);

  const [openControlOverlay, setOpenControlOverlay] = useState<boolean>(false);

  const isLeftPage = useMemo(() => {
    return pageNumber !== null && pageNumber % 2 === 1;
  }, [pageNumber]);

  const resizeThrottleOccupied = useRef<boolean>(false);

  const lastPage = useMemo(() => {
    if (!bookInfo) return 0;
    if (showSinglePage) {
      return bookInfo.total_pages;
    } else {
      return Math.floor((bookInfo.total_pages - 1) / 2) * 2 + 1;
    }
  }, [bookInfo, showSinglePage]);

  const currentPageStr = useMemo(() => {
    if (!bookInfo || pageNumber === null) return "N/A";
    if (showSinglePage) {
      return `${pageNumber}`;
    } else {
      let leftPage;
      let rightPage;
      if (isLeftPage) {
        leftPage = pageNumber;
        rightPage = pageNumber + 1;
      } else {
        leftPage = pageNumber - 1;
        rightPage = pageNumber;
      }
      if (bookInfo.total_pages < rightPage) {
        return `${leftPage}`;
      }
      return `${leftPage} - ${rightPage}`;
    }
  }, [bookInfo, pageNumber, showSinglePage, isLeftPage]);

  const showPrevPageControl = useMemo(() => {
    if (!pageNumber) return false;
    return showSinglePage ? pageNumber > 1 : pageNumber > 2;
  }, [pageNumber, showSinglePage]);

  const prevPage = useCallback(() => {
    if (!pageNumber) return;
    if (showSinglePage) {
      if (pageNumber <= 1) return;
      setPageNumber(pageNumber - 1);
    } else {
      if (pageNumber <= 2) return;
      if (isLeftPage) {
        setPageNumber(pageNumber - 2);
      } else {
        setPageNumber(pageNumber - 3);
      }
    }
  }, [pageNumber, showSinglePage, isLeftPage]);

  const showNextPageControl = useMemo(() => {
    if (!pageNumber) return false;
    return pageNumber < lastPage;
  }, [pageNumber, lastPage]);

  const nextPage = useCallback(() => {
    if (!pageNumber) return;
    if (pageNumber >= lastPage) return;

    if (showSinglePage) {
      setPageNumber(pageNumber + 1);
      return;
    } else {
      if (isLeftPage) {
        setPageNumber(pageNumber + 2);
      } else {
        setPageNumber(pageNumber + 3);
      }
    }
  }, [pageNumber, lastPage, showSinglePage, isLeftPage]);

  useEffect(() => {
    const fetchBookData = async () => {
      try {
        const bookInfo = await ReadBookAPI.getBookInfo(bookId);
        setBookInfo(bookInfo);
        setPageNumber(1);
      } catch (error) {
        console.error("Error fetching book data:", error);
        alert("Failed to load book data. Please try again later.");
      }
    };

    fetchBookData();
  }, [bookId]);

  useEffect(() => {
    if (bookInfo && pageNumber !== null) {
      const fetchPageContent = async () => {
        try {
          setLeftPage(null);
          setRightPage(null);

          const leftPageNumber = Math.floor((pageNumber - 1) / 2) * 2 + 1;

          if (leftPageNumber < 1 || leftPageNumber > bookInfo.total_pages) {
            console.error("Page number out of bounds");
            return;
          }
          const leftPageContent = await ReadBookAPI.getBookPage(
            bookId,
            leftPageNumber,
          );
          setLeftPage(leftPageContent);

          const rightPageNumber = leftPageNumber + 1;
          if (rightPageNumber <= bookInfo.total_pages) {
            const rightPageContent = await ReadBookAPI.getBookPage(
              bookId,
              rightPageNumber,
            );
            setRightPage(rightPageContent);
          }
        } catch (error) {
          console.error("Error fetching page content:", error);
          alert("Failed to load page content. Please try again later.");
        }
      };

      fetchPageContent();
    }
  }, [bookInfo, pageNumber, bookId]);

  useEffect(() => {
    const handleResize = () => {
      if (resizeThrottleOccupied.current) return;

      resizeThrottleOccupied.current = true;

      setTimeout(() => {
        const readerWidth = readerRef.current.clientWidth;
        const readerHeight = readerRef.current.clientHeight;

        const headerHeight = headerRef.current.offsetHeight;
        const footerHeight = footerRef.current.offsetHeight;

        const availableWidth = readerWidth;
        const avaliableHeight = readerHeight - headerHeight - footerHeight;

        if (availableWidth === 0 || avaliableHeight === 0) {
          return; // Avoid division by zero
        }

        const aspectRatio = availableWidth / avaliableHeight;

        if (aspectRatio > BREAK_ASPECT_RATIO) {
          readerRef.current.setAttribute("data-orientation", "landscape");

          if (aspectRatio > 2 * SINGLE_PAGE_ASPECT_RATIO) {
            setPageWidth(avaliableHeight * SINGLE_PAGE_ASPECT_RATIO);
          } else {
            setPageWidth(availableWidth / 2);
          }
          setShowSinglePage(false);
        } else {
          readerRef.current.setAttribute("data-orientation", "portrait");

          if (aspectRatio > SINGLE_PAGE_ASPECT_RATIO) {
            setPageWidth(avaliableHeight * SINGLE_PAGE_ASPECT_RATIO);
          } else {
            setPageWidth(availableWidth);
          }
          setShowSinglePage(true);
        }

        resizeThrottleOccupied.current = false;
      }, TROTTLE_TIME);
    };

    handleResize();

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(readerRef.current);
    resizeObserver.observe(headerRef.current);
    resizeObserver.observe(footerRef.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={readerRef}
      className="book-reader"
      onClick={() => {
        setOpenControlOverlay((prev) => !prev);
      }}
    >
      <div ref={headerRef} className="book-reader-header">
        Header
      </div>
      {pageWidth && (
        <div className="book-page-wrapper">
          {showSinglePage ? (
            isLeftPage ? (
              <BookPageView
                width={pageWidth}
                content={leftPage?.content || null}
                firstLineIndent={indentFirstLine(
                  leftPage?.page_transition_type,
                )}
                chapterTitle={leftPage?.chapter_title || null}
              />
            ) : (
              <BookPageView
                width={pageWidth}
                content={rightPage?.content || null}
                firstLineIndent={indentFirstLine(
                  rightPage?.page_transition_type,
                )}
                chapterTitle={rightPage?.chapter_title || null}
              />
            )
          ) : (
            <>
              <BookPageView
                width={pageWidth}
                content={leftPage?.content || null}
                firstLineIndent={indentFirstLine(
                  leftPage?.page_transition_type,
                )}
                chapterTitle={leftPage?.chapter_title || null}
              />
              <BookPageView
                width={pageWidth}
                content={rightPage?.content || null}
                firstLineIndent={indentFirstLine(
                  rightPage?.page_transition_type,
                )}
                chapterTitle={rightPage?.chapter_title || null}
              />
            </>
          )}
        </div>
      )}
      <div ref={footerRef} className="book-reader-footer">
        <span>
          Page {currentPageStr} of {bookInfo?.total_pages || 0}
        </span>
      </div>
      {openControlOverlay && (
        <ControlOverlay
          showPrevPageControl={showPrevPageControl}
          showNextPageControl={showNextPageControl}
          bookId={bookId}
          offset={
            showSinglePage && isLeftPage
              ? leftPage?.offset_end || 0
              : rightPage?.offset_end || leftPage?.offset_end || 0
          }
          prevPage={prevPage}
          nextPage={nextPage}
        />
      )}
    </div>
  );
};
