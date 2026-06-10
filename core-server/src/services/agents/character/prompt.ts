import type { Language } from "@shared/book";

export const getCharacterChatPrompts = (
  language: Language,
  bookTitle: string,
  characterInfo: { name: string; description: string },
  userQuery: string,
  {
    search,
    characterTraitSearch,
  }: {
    search?: { searchQuery: string; searchResult: string };
    characterTraitSearch?: { searchQuery: string; searchResult: string }[];
  },
): {
  systemPrompt: string;
  userQueries: string[];
  assistantQueries: string[];
} => {
  switch (language) {
    case "ko":
      return {
        systemPrompt: [
          "당신은 책에 등장하는 등장인물로 빙의되어 사용자의 질문에 답변하는 유용한 도우미입니다.",
          `책 제목: ${bookTitle}`,
          `등장인물 이름: ${characterInfo.name}`,
          `등장인물 설명: ${characterInfo.description}`,
          "답변할 때는, 등장인물의 성격, 말투, 행동 등을 고려하여 답변해주세요.",
          "또한 당신은 사용자에게 답변하기 위해 필요한 추가적인 정보를 검색하였습니다. 해당 검색결과 또한 참고하여 답변해주세요.",
        ].join("\n"),
        userQueries: [`사용자 질문: ${userQuery}`],
        assistantQueries: [
          ...(characterTraitSearch
            ? [
                `등장인물 특징 검색 결과\n${characterTraitSearch.map((c) => `${c.searchQuery}: ${c.searchResult}`).join("\n")}`,
              ]
            : []),
          ...(search
            ? [
                `검색쿼리: ${search.searchQuery}\n검색결과: ${search.searchResult}`,
              ]
            : []),
        ],
      };
    case "en":
      return {
        systemPrompt: [
          "You are a helpful assistant embodying a character from a book, answering user questions from that character's perspective.",
          `Book Title: ${bookTitle}`,
          `Character Name: ${characterInfo.name}`,
          `Character Description: ${characterInfo.description}`,
          "When answering from the character's perspective, consider the character's personality, manner of speaking, and behavior.",
          "You have also searched for additional information needed to answer the user's question. Please refer to these search results when answering.",
        ].join("\n"),
        userQueries: [`User question: ${userQuery}`],
        assistantQueries: [
          ...(characterTraitSearch
            ? [
                `Character traits search results:\n${characterTraitSearch.map((c) => `${c.searchQuery}: ${c.searchResult}`).join("\n")}`,
              ]
            : []),
          ...(search
            ? [
                `Search query: ${search.searchQuery}\nSearch result: ${search.searchResult}`,
              ]
            : []),
        ],
      };
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
};

export const getSearchQueryWritePrompts = (
  userQuery: string,
  language: Language,
  characterName: string,
  historyText?: string,
): {
  systemPrompt: string;
  userQueries: string[];
} => {
  switch (language) {
    case "ko":
      return {
        systemPrompt:
          "당신은 책에 대한 정보를 검색하기 위해 필요한 검색 쿼리를 작성해주는 유용한 도우미입니다.",
        userQueries: [
          `대화 기록: ${historyText}`,
          `이 대화 기록에서 assistant는 책의 등장인물 ${characterName}로 빙의된 상태입니다. 다음 사용자의 질문을 답변하기 위해 필요한 검색 쿼리를 작성해주세요`,
          `사용자 질문: ${userQuery}`,
        ],
      };
    case "en":
      return {
        systemPrompt:
          "You are a helpful assistant that writes search queries needed to find information about books.",
        userQueries: [
          `Conversation history: ${historyText}`,
          `In this conversation history, the assistant is embodying the character ${characterName} from the book. Write a search query to answer the next user question.`,
          `User question: ${userQuery}`,
        ],
      };
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
};
