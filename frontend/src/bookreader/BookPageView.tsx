import { useEffect, useRef } from "react";
import { BOOK_PAGE_WIDTH } from "./const";

interface BookPageViewProps {
  chapterTitle: string | null;
  content: string | null;
  width: number;
  ref?: React.RefObject<HTMLDivElement>;
}

const BookPageView = ({
  content,
  chapterTitle,
  width,
  ref,
}: BookPageViewProps) => {
  const contentRef = useRef<HTMLDivElement>({} as HTMLDivElement);

  useEffect(() => {
    if (ref) {
      ref.current = contentRef.current;
    }
  }, [ref]);

  useEffect(() => {
    const scale = width / BOOK_PAGE_WIDTH;
    contentRef.current.style.setProperty("transform", `scale(${scale})`);
  }, [width]);

  return (
    <div className="book-page-view" style={{ width }}>
      <div ref={contentRef} className="book-page-content">
        {chapterTitle && (
          <span data-type="chapter-title" className="book-chapter-title">
            {chapterTitle}
          </span>
        )}
        {content && (
          <span data-type="content-text" className="book-content-text">
            {content}
          </span>
        )}
      </div>
    </div>
  );
};

export default BookPageView;
