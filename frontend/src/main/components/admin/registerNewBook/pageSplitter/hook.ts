import { useContext } from "react";
import { PageSplitterContext } from "./context";

export const usePageSplitter = () => {
  const { dispose, fitContentInPage } = useContext(PageSplitterContext);

  return { dispose, fitContentInPage };
};
