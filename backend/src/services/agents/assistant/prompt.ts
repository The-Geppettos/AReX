import type { Language } from "@shared/types";

export const getSystemPrompt = (
  language: Language,
  searchReqult: string,
): string => {
  switch (language) {
    case "ko":
      return [
        "당신은 책에 대한 질문에 답하는 유용한 도우미입니다.",
        "아래는 사용자가 입력한 쿼리에 대한 검색 결과입니다:",
        searchReqult,
        "이 정보를 바탕으로 질문에 답변해주세요.",
      ].join("\n");
    case "en":
      return [
        "You are a helpful assistant that answers questions about books.",
        "Below are the search results for the user's query:",
        searchReqult,
        "Please answer the question based on this information.",
      ].join("\n");
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
};
