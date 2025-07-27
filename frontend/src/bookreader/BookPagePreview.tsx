import { useEffect, useRef, useState } from "react";
import BookPageView from "./BookPageView";
import { BOOK_PAGE_WIDTH } from "./const";

type PreviewMessage = {
  content: string | null;
  firstLineIndent: boolean;
  chapterTitle: string | null;
  width: number;
  source: MessageEventSource | null;
  token: string;
};

const BookPagePreview = () => {
  const [previewMessage, setPreviewMessage] = useState<PreviewMessage | null>(
    null,
  );
  const ref = useRef<HTMLDivElement>({} as HTMLDivElement);

  const loadPromiseRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "book-page-preview-start") {
        setPreviewMessage({
          content:
            typeof event.data.content === "string" ? event.data.content : null,
          firstLineIndent:
            typeof event.data.first_line_indent === "boolean"
              ? event.data.first_line_indent
              : true,
          chapterTitle:
            typeof event.data.chapter_title === "string"
              ? event.data.chapter_title
              : null,
          width:
            typeof event.data.width === "number"
              ? event.data.width
              : BOOK_PAGE_WIDTH,
          source: event.source,
          token: event.data.token || "",
        });
      }
    };

    loadPromiseRef.current = loadPromiseRef.current
      .then(() => document.fonts.ready)
      .then(() => {
        window.addEventListener("message", handleMessage);
        parent.postMessage(
          {
            type: "book-page-preview-load",
          },
          "*",
        );
      });

    return () => {
      loadPromiseRef.current = loadPromiseRef.current.then(() => {
        parent.postMessage(
          {
            type: "book-page-preview-unload",
          },
          "*",
        );
        window.removeEventListener("message", handleMessage);
      });
    };
  }, []);

  useEffect(() => {
    if (!previewMessage?.source) return;

    let visibleContentLength = 0;
    let isOverflow = false;
    let isFirstParagraph = true;

    const pageRect = ref.current.getBoundingClientRect();
    const paddingBottom = parseFloat(
      getComputedStyle(ref.current).paddingBottom,
    );
    const borderBottom = parseFloat(
      getComputedStyle(ref.current).borderBottomWidth,
    );

    const pageBottom = pageRect.bottom - paddingBottom - borderBottom;

    for (const node of ref.current.childNodes) {
      if (node.nodeType === Node.ELEMENT_NODE && node instanceof HTMLElement) {
        if (node.dataset.type === "content-text") {
          if (isOverflow) continue;

          if (!isFirstParagraph) {
            visibleContentLength += 1;
          }
          isFirstParagraph = false;

          const textNode = node.childNodes[0];
          if (textNode && textNode.nodeType === Node.TEXT_NODE) {
            const contentText = node.textContent || "";

            const range = document.createRange();

            // set to the end to check if it overflows
            range.setStart(textNode, contentText.length - 1);
            range.setEnd(textNode, contentText.length);
            const endRect = range.getBoundingClientRect();

            if (endRect.bottom > pageBottom) {
              isOverflow = true;

              let low = 0;
              let high = contentText.length;
              while (low < high) {
                const mid = Math.floor((low + high) / 2);
                range.setStart(textNode, mid);
                range.setEnd(textNode, mid + 1);
                const midRect = range.getBoundingClientRect();

                if (midRect.bottom > pageBottom) {
                  high = mid;
                } else {
                  low = mid + 1;
                }
              }
              visibleContentLength += low;
            } else {
              visibleContentLength += contentText.length;
            }
          }
        }
      }
    }

    previewMessage.source.postMessage({
      type: "book-page-preview-completed",
      visible_content_length: visibleContentLength,
      token: previewMessage.token,
    });
  }, [previewMessage]);

  return (
    <BookPageView
      width={previewMessage?.width || BOOK_PAGE_WIDTH}
      content={previewMessage?.content || null}
      firstLineIndent={
        previewMessage?.firstLineIndent === undefined
          ? true
          : previewMessage.firstLineIndent
      }
      chapterTitle={previewMessage?.chapterTitle || null}
      ref={ref}
    />
  );
};

export default BookPagePreview;
