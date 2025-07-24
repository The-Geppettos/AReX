import { useEffect, useRef, useState } from "react";
import BookPageView from "./BookPageView";
import { BOOK_PAGE_WIDTH } from "./const";

type PreviewMessage = {
  content: string | null;
  chapterTitle: string | null;
  source: MessageEventSource | null;
};

const BookPagePreview = () => {
  const [previewMessage, setPreviewMessage] = useState<PreviewMessage | null>(
    null,
  );
  const ref = useRef<HTMLDivElement>({} as HTMLDivElement);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "book-page-preview-start") {
        setPreviewMessage({
          content:
            typeof event.data.content === "string" ? event.data.content : null,
          chapterTitle:
            typeof event.data.chapter_title === "string"
              ? event.data.chapter_title
              : null,
          source: event.source,
        });
      }
    };

    window.addEventListener("message", handleMessage);
    parent.postMessage(
      {
        type: "book-page-preview-load",
      },
      "*",
    );

    return () => {
      parent.postMessage(
        {
          type: "book-page-preview-unload",
        },
        "*",
      );
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  useEffect(() => {
    if (!previewMessage?.source) return;

    let visibleContentLegnth = 0;
    const pageRect = ref.current.getBoundingClientRect();
    const paddingBottom = parseFloat(
      getComputedStyle(ref.current).paddingBottom,
    );
    const borderBottom = parseFloat(
      getComputedStyle(ref.current).borderBottomWidth,
    );

    const pageBottom = pageRect.bottom - paddingBottom - borderBottom;

    const paddingRight = parseFloat(getComputedStyle(ref.current).paddingRight);
    const borderRight = parseFloat(
      getComputedStyle(ref.current).borderRightWidth,
    );

    const pageRight = pageRect.right - paddingRight - borderRight;

    for (const node of ref.current.childNodes) {
      if (node.nodeType === Node.ELEMENT_NODE && node instanceof HTMLElement) {
        if (node.dataset.type === "content-text") {
          const textNode = node.childNodes[0];
          if (textNode && textNode.nodeType === Node.TEXT_NODE) {
            const contentText = node.textContent || "";

            const range = document.createRange();

            let low = 0;
            let high = contentText.length;
            while (low < high) {
              const mid = Math.floor((low + high) / 2);
              range.setStart(textNode, mid);
              range.setEnd(textNode, mid + 1);
              const midRect = range.getBoundingClientRect();

              if (midRect.bottom > pageBottom || midRect.right > pageRight) {
                high = mid;
              } else {
                low = mid + 1;
              }
            }
            visibleContentLegnth = low;
          }
        }
      }
    }

    previewMessage.source.postMessage({
      type: "book-page-preview-completed",
      visible_content_length: visibleContentLegnth,
    });
    return;
  }, [previewMessage]);

  return (
    <BookPageView
      width={BOOK_PAGE_WIDTH}
      content={previewMessage?.content || null}
      chapterTitle={previewMessage?.chapterTitle || null}
      ref={ref}
    />
  );
};

export default BookPagePreview;
