import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";

import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import { BOOK_PAGE_HEIGHT, BOOK_PAGE_WIDTH } from "@src/bookreader/const";

const PREVIEW_WIDTH = 450;

type FitContentInPageParams = {
  chapterTitle: string | null;
  content: string;
  firstLineIndent: boolean;
};

type FitContentInPageResponse = {
  visibleContentLength: number;
};

type FitContentInPageFunction = (
  params: FitContentInPageParams,
) => Promise<FitContentInPageResponse>;

type PageSplitParams = FitContentInPageParams & {
  resolve: (value: FitContentInPageResponse) => void;
};

const PageSplitterContext = createContext({
  fitContentInPage: (async () => ({
    visibleContentLength: 0,
  })) as FitContentInPageFunction,
  dispose: () => {},
  onLoad: (() => {}) as (previewIframe: HTMLIFrameElement) => void,
  onUnload: () => {},
});

export const usePageSplitter = () => {
  const { dispose, fitContentInPage } = useContext(PageSplitterContext);

  return { dispose, fitContentInPage };
};

export const PageSplitterProvider = ({ children }: PropsWithChildren) => {
  const [openPreview, setOpenPreview] = useState(false);
  const previewRef = useRef<HTMLIFrameElement>(null);

  const pageSplitQueueRef = useRef<PageSplitParams[]>([]);
  const currentTokenRef = useRef<string | null>(null);

  const onUnload = () => {
    previewRef.current = null;
  };

  const onLoad = (previewIframe: HTMLIFrameElement) => {
    previewRef.current = previewIframe;
    runQueue(true);
  };

  const startPageSplit = (token: string) => {
    return new Promise<boolean>(async (resolveTaskGroup) => {
      while (pageSplitQueueRef.current.length > 0) {
        const completed = await new Promise<boolean>(async (resolveTask) => {
          if (token !== currentTokenRef.current) {
            console.warn("Token has changed. Stopping page split.");
            resolveTask(false);
            return;
          }
          if (previewRef.current === null) {
            console.warn("Preview iframe is unloaded. Stopping page split.");
            resolveTask(false);
            return;
          }

          const pageSplitRequest = pageSplitQueueRef.current[0];

          const {
            chapterTitle,
            content,
            firstLineIndent,
            resolve: resolvePageSplit,
          } = pageSplitRequest;

          const handleResponse = (event: MessageEvent) => {
            if (event.data.type === "book-page-preview-completed") {
              const resToken = event.data.token;
              const visibleContentLength = event.data.visible_content_length;
              if (!resToken || typeof visibleContentLength !== "number") {
                console.error(
                  "Invalid response from preview: missing token or visible_content_length.",
                );
                return;
              }

              if (currentTokenRef.current !== resToken) {
                console.warn("Token has changed. Ignoring response.");
                resolveTask(false);
              } else {
                pageSplitQueueRef.current.shift();
                resolveTask(true);
                resolvePageSplit({
                  visibleContentLength: visibleContentLength,
                });
              }

              window.removeEventListener("message", handleResponse);
            }
          };

          window.addEventListener("message", handleResponse);

          previewRef.current.contentWindow?.postMessage(
            {
              type: "book-page-preview-start",
              chapter_title: chapterTitle,
              content: content,
              first_line_indent: firstLineIndent,
              width: PREVIEW_WIDTH,
              token: token,
            },
            "*",
          );
        });
        if (!completed) {
          resolveTaskGroup(false);
          return;
        }
      }
      resolveTaskGroup(true);
    });
  };

  const runQueue = useCallback(async (force: boolean = false) => {
    if (!force && (currentTokenRef.current || !previewRef.current)) {
      return;
    }

    if (pageSplitQueueRef.current.length === 0) {
      return;
    }

    currentTokenRef.current = Date.now().toString();
    const token = currentTokenRef.current;

    while (pageSplitQueueRef.current.length > 0) {
      const completed = await startPageSplit(token);
      if (!completed) {
        console.warn(
          "Page split queue stopped due to unloading preview iframe while processing. It will resume when the preview iframe is loaded again.",
        );
        return;
      }
    }

    currentTokenRef.current = null;
  }, []);

  const fitContentInPage = useCallback(
    async ({
      content,
      chapterTitle,
      firstLineIndent,
    }: FitContentInPageParams) => {
      const promise = new Promise<FitContentInPageResponse>(async (resolve) => {
        setOpenPreview(true);
        pageSplitQueueRef.current.push({
          chapterTitle,
          content,
          firstLineIndent,
          resolve,
        });
        runQueue();
      });

      return await promise;
    },
    [runQueue],
  );

  return (
    <PageSplitterContext.Provider
      value={{
        dispose: () => {
          setOpenPreview(false);
        },
        fitContentInPage,
        onLoad,
        onUnload,
      }}
    >
      {children}

      <Dialog open={openPreview} maxWidth={false}>
        <PageSplitterDialog />
      </Dialog>
    </PageSplitterContext.Provider>
  );
};

const PageSplitterDialog = () => {
  const { onLoad, onUnload } = useContext(PageSplitterContext);

  const ref = useRef<HTMLIFrameElement>({} as HTMLIFrameElement);
  const isReadyRef = useRef(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.source === ref.current?.contentWindow) {
        if (event.data.type === "book-page-preview-load") {
          isReadyRef.current = true;
          onLoad(ref.current);
        }
        if (event.data.type === "book-page-preview-unload") {
          isReadyRef.current = false;
          onUnload();
        }
      }
    };

    window.addEventListener("message", handleMessage);
    if (isReadyRef.current) {
      onLoad(ref.current);
    }

    return () => {
      window.removeEventListener("message", handleMessage);
      onUnload();
    };
  }, [onLoad, onUnload]);

  return (
    <>
      <DialogTitle>Book Page Preview</DialogTitle>
      <DialogContent>
        <iframe
          style={{ border: "none" }}
          width={PREVIEW_WIDTH}
          height={PREVIEW_WIDTH * (BOOK_PAGE_HEIGHT / BOOK_PAGE_WIDTH)}
          ref={ref}
          src="/bookreader/page-preview"
        />
      </DialogContent>
    </>
  );
};
