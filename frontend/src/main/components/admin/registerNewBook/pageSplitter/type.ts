export type FitContentInPageParams = {
  chapterTitle: string | null;
  content: string;
  firstLineIndent: boolean;
};

export type FitContentInPageResponse = {
  visibleContentLength: number;
};

export type FitContentInPageFunction = (
  params: FitContentInPageParams,
) => Promise<FitContentInPageResponse>;
