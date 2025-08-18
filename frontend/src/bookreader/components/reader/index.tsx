import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Book, BookPageDetail } from "@shared/book";
import { ReadBookAPI } from "@src/api/readBook";
import { BookPageView } from "../pageView";
import {
  BOOK_PAGE_WIDTH,
  BREAK_ASPECT_RATIO,
  SINGLE_PAGE_ASPECT_RATIO,
} from "../../const";
import { indentFirstLine } from "@src/lib";
import { ControlOverlay } from "./ControlOverlay";
import { Scrollbar } from "./Scrollbar";

type Orientation = "portrait" | "landscape";

interface BookReaderProps {
  bookId: string;
}

const RESIZE_TROTTLE_TIME = 100;

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
  const resizeOrientation = useRef<Orientation | null>(null);

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
          resizeThrottleOccupied.current = false;
          return; // Avoid division by zero
        }

        const aspectRatio = availableWidth / avaliableHeight;

        let pageWidth;

        if (!resizeOrientation.current) {
          resizeOrientation.current =
            aspectRatio > BREAK_ASPECT_RATIO ? "landscape" : "portrait";
        }

        if (resizeOrientation.current === "landscape") {
          readerRef.current.setAttribute("data-orientation", "landscape");

          if (aspectRatio > 2 * SINGLE_PAGE_ASPECT_RATIO) {
            pageWidth = avaliableHeight * SINGLE_PAGE_ASPECT_RATIO;
          } else {
            pageWidth = availableWidth / 2;
          }
          headerRef.current.style.setProperty("width", `${pageWidth * 2}px`);
          setShowSinglePage(false);
        } else {
          readerRef.current.setAttribute("data-orientation", "portrait");

          if (aspectRatio > SINGLE_PAGE_ASPECT_RATIO) {
            pageWidth = avaliableHeight * SINGLE_PAGE_ASPECT_RATIO;
          } else {
            pageWidth = availableWidth;
          }
          headerRef.current.style.setProperty("width", `${pageWidth}px`);
          setShowSinglePage(true);
        }

        const ratio = pageWidth / BOOK_PAGE_WIDTH;
        headerRef.current.style.setProperty("font-size", `${ratio * 70}%`);
        footerRef.current.style.setProperty("font-size", `${ratio * 70}%`);

        setPageWidth(pageWidth);

        resizeThrottleOccupied.current = false;
      }, RESIZE_TROTTLE_TIME);
    };

    handleResize();

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(readerRef.current);
    resizeObserver.observe(headerRef.current);
    resizeObserver.observe(footerRef.current);

    const windowResize = () => {
      resizeOrientation.current = null;
    };

    window.addEventListener("resize", windowResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", windowResize);
    };
  }, []);

  const colorStyle = useMemo(() => {
    const opacity1 = "10";
    const opacity2 = "05";

    if (showSinglePage) {
      if (isLeftPage) {
        return leftPage
          ? {
              background: `linear-gradient(to right, ${leftPage.color_code}${opacity1}, ${leftPage.color_code}${opacity2}, ${leftPage.color_code}${opacity1})`,
            }
          : {};
      } else {
        return rightPage
          ? {
              background: `linear-gradient(to right, ${rightPage.color_code}${opacity1}, ${rightPage.color_code}${opacity2}, ${rightPage.color_code}${opacity1})`,
            }
          : {};
      }
    }

    if (!leftPage) {
      return {};
    }

    if (!rightPage) {
      return {
        background: `linear-gradient(to right, ${leftPage.color_code}${opacity1}, ${leftPage.color_code}${opacity2}, ${leftPage.color_code}${opacity1})`,
      };
    }

    return {
      background: `linear-gradient(to right, ${leftPage.color_code}${opacity1}, ${leftPage.color_code}${opacity2}, ${rightPage.color_code}${opacity2}, ${rightPage.color_code}${opacity1})`,
    };
  }, [showSinglePage, isLeftPage, leftPage, rightPage]);

  return (
    <div
      ref={readerRef}
      className="book-reader"
      onClick={() => {
        setOpenControlOverlay((prev) => !prev);
      }}
      style={colorStyle}
    >
      <div ref={headerRef} className="book-reader-header">
        <div className="book-title">
          {bookInfo ? bookInfo.title : "Loading..."}
        </div>
        <div className="book-author">
          {bookInfo ? bookInfo.author : "Loading..."}
        </div>
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
                chapterTitle={
                  leftPage
                    ? leftPage.page_transition_type === "new_chapter"
                      ? leftPage.chapter_title
                      : null
                    : null
                }
              />
            ) : (
              <BookPageView
                width={pageWidth}
                content={rightPage?.content || null}
                firstLineIndent={indentFirstLine(
                  rightPage?.page_transition_type,
                )}
                chapterTitle={
                  rightPage
                    ? rightPage.page_transition_type === "new_chapter"
                      ? rightPage.chapter_title
                      : null
                    : null
                }
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
                chapterTitle={
                  leftPage
                    ? leftPage.page_transition_type === "new_chapter"
                      ? leftPage.chapter_title
                      : null
                    : null
                }
              />
              <BookPageView
                width={pageWidth}
                content={rightPage?.content || null}
                firstLineIndent={indentFirstLine(
                  rightPage?.page_transition_type,
                )}
                chapterTitle={
                  rightPage
                    ? rightPage.page_transition_type === "new_chapter"
                      ? rightPage.chapter_title
                      : null
                    : null
                }
              />
            </>
          )}
        </div>
      )}
      <div ref={footerRef} className="book-reader-footer">
        <Scrollbar
          totalPages={bookInfo?.total_pages || 0}
          page={pageNumber || 1}
          onChange={(page) => {
            setPageNumber(page);
          }}
        />
        <div>
          Page {currentPageStr} of {bookInfo?.total_pages || 0}
        </div>
        <div>
          {showSinglePage
            ? isLeftPage
              ? `챕터 ${leftPage?.chapter_number}: ${leftPage?.chapter_title || "N/A"}`
              : `챕터 ${rightPage?.chapter_number}: ${rightPage?.chapter_title || "N/A"}`
            : `챕터 ${leftPage?.chapter_number}: ${leftPage?.chapter_title || "N/A"}`}
        </div>
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
          pageNumber={
            showSinglePage && isLeftPage
              ? leftPage?.page_number || 0
              : rightPage?.page_number || leftPage?.page_number || 0
          }
          totalPages={bookInfo?.total_pages || 0}
          prevPage={prevPage}
          nextPage={nextPage}
        />
      )}
    </div>
  );
};
