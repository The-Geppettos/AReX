import type { Language } from "@shared/book";

export const getSearchQueryRewritePrompts = (
  userQuery: string,
  language: Language,
  historyText?: string,
): {
  systemPrompt: string;
  userQueries: string[];
} => {
  switch (language) {
    case "ko":
      return {
        systemPrompt:
          "당신은 책에 대한 질문을 독립적인 검색 쿼리로 다시 작성하는 유용한 도우미입니다.",
        userQueries: [
          `${historyText ? "지금까지의 대화 내용과 최신 " : ""}사용자 질문을 바탕으로, 질문을 독립적인 검색 쿼리로 다시 작성해주세요.`,
          ...(historyText ? [`대화 기록: ${historyText}`] : []),
          `사용자 질문: ${userQuery}`,
        ],
      };
    case "en":
      return {
        systemPrompt:
          "You are a helpful assistant that rewrites questions about books into standalone search queries.",
        userQueries: [
          `Given the ${historyText ? "conversation so far and the latest " : ""}user question, rewrite the question into a standalone search query for our knowledge base.`,
          ...(historyText ? [`Conversation history: ${historyText}`] : []),
          `User question: \n---${userQuery}`,
        ],
      };
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
};

export const getAnswerPrompts = (
  language: Language,
  bookTitle: string,
  bookAuthor: string,
  userQuery: string,
  searchQuery: string,
  searchReqult: string,
): {
  systemPrompt: string;
  userQueries: string[];
  assistantQueries: string[];
} => {
  switch (language) {
    case "ko":
      return {
        systemPrompt: [
          "당신은 책에 대한 질문에 답하는 유용한 도우미입니다.",
          `책 제목: ${bookTitle}`,
          `책 저자: ${bookAuthor}`,
          "당신은 사용자의 질문을 바탕으로 책 내용을 검색했습니다.",
          "검색결과 만을 바탕으로 답변해주세요.",
          "검색결과는 현재 사용자가 읽은 범위 내에서만 제공됩니다.",
          "검색결과와 질문의 내용이 많이 차이나는 경우, 책에 없는 내용이거나 아직 읽지 않은 내용일 수 있습니다.",
          "이 경우, 검색결과는 무시하고 정보가 부족하다고 설명해주세요.",
        ].join("\n"),
        userQueries: [`사용자 질문: ${userQuery}`],
        assistantQueries: [
          `검색쿼리:${searchQuery}\n\n검색결과:\n${searchReqult}`,
        ],
      };
    case "en":
      return {
        systemPrompt: [
          "You are a helpful assistant that answers questions about books.",
          `Book Title: ${bookTitle}`,
          `Book Author: ${bookAuthor}`,
          "You have searched the book content based on the user's question.",
          "Please answer based only on the search results.",
          "The search results are provided only within the range the user has read.",
          "If the search results and the question content differ significantly, it may be due to content not present in the book or content not yet read.",
          "In this case, please ignore the search results and explain that the information is insufficient.",
        ].join("\n"),
        userQueries: [`User question: ${userQuery}`],
        assistantQueries: [
          `Search query: ${searchQuery}\nSearch results: ${searchReqult}`,
        ],
      };
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
};
