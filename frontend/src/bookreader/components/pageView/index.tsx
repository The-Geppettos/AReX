import { useEffect, useMemo, useRef } from "react";
import { BOOK_PAGE_WIDTH } from "../../const";
import { TextProcessor } from "@src/lib";

interface BookPageViewProps {
  chapterTitle: string | null;
  content: string | null;
  firstLineIndent: boolean;
  width: number;
  ref?: React.RefObject<HTMLDivElement>;
}

export const BookPageView = ({
  content,
  chapterTitle,
  firstLineIndent,
  width,
  ref,
}: BookPageViewProps) => {
  const contentRef = useRef<HTMLDivElement>({} as HTMLDivElement);

  const paragraphs = useMemo(() => {
    if (!content) return [];
    return TextProcessor.fromText(content)
      .trim()
      .removeDuplicateSpaces()
      .splitLineBreak();
  }, [content]);

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
        {paragraphs.map((paragraph, index) => (
          <div
            data-type="content-text"
            className={`book-content-text${!firstLineIndent && index === 0 ? "" : " indented"}`}
            key={index}
          >
            {paragraph}
          </div>
        ))}
      </div>
    </div>
  );
};
