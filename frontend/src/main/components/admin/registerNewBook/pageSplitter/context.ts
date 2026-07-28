import { createContext } from "react";
import type { FitContentInPageFunction } from "./type";

export const PageSplitterContext = createContext({
  fitContentInPage: (async () => ({
    visibleContentLength: 0,
  })) as FitContentInPageFunction,
  dispose: () => {},
  onLoad: (() => {}) as (previewIframe: HTMLIFrameElement) => void,
  onUnload: () => {},
});
