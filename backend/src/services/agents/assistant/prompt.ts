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

export const getMainPrompts = (
  language: Language,
  bookTitle: string,
  userQuery: string,
  searchQuery: string,
  searchReqult: string,
) => {
  switch (language) {
    case "ko":
      return {
        systemPrompt: [
          "당신은 책에 대한 질문에 답하는 유용한 도우미입니다.",
          `책 제목: ${bookTitle}`,
          "사용자는 질문과 함께 책 내용을 검색했습니다.",
          "검색결과 만을 바탕으로 답변해주세요.",
          "검색결과는 현재 사용자가 읽은 범위 내에서만 제공됩니다.",
          "질문을 답하기에 검색결과가 충분하지 않을 수 있습니다.",
          "이는 책에 없는 내용이거나 아직 읽지 않은 내용일 수 있습니다.",
          "없는 내용에 대해서는 답변하지 말고, 정보가 부족하다고 설명해주세요.",
        ].join("\n"),
        userQueries: [
          `사용자 질문: ${userQuery}`,
          `검색쿼리:${searchQuery}\n검색결과: ${searchReqult}`,
        ],
      };
    case "en":
      return {
        systemPrompt: [
          "You are a helpful assistant that answers questions about books.",
          `Book Title: ${bookTitle}`,
          "The user has searched the book content with their question.",
          "Please answer based only on the search results.",
          "The search results are provided only within the range the user has read.",
          "The search results may not be sufficient to answer the question.",
          "This could be due to content not present in the book or content not yet read.",
          "Do not answer about non-existent content, and explain that the information is insufficient.",
        ].join("\n"),
        userQueries: [
          `User question: ${userQuery}`,
          `Search query: ${searchQuery}\nSearch results: ${searchReqult}`,
        ],
      };
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
};
