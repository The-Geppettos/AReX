import type { Language } from "@shared/book";

export const getUserCharacterExtractPrompt = (
  userQuery: string,
  language: Language,
): {
  systemPrompt: string;
  userQueries: string[];
} => {
  switch (language) {
    case "ko":
      return {
        systemPrompt: [
          "당신은 사용자가 입력한 쿼리에서 등장인물의 이름을 추출하는 유용한 도우미입니다.",
          "사용자가 입력한 쿼리에서 등장인물의 이름을 추출해주세요.",
          "답변은 등장인물 한명의 이름만 포함되어야 합니다.",
          "풀네임을 우선으로 사용해주세요.",
        ].join("\n"),
        userQueries: [userQuery],
      };
    case "en":
      return {
        systemPrompt: [
          "You are a helpful assistant that extracts character names from user queries.",
          "Please extract the character name from the user's query.",
          "The answer should only include the name of one character.",
          "Use the full name if available.",
        ].join("\n"),
        userQueries: [userQuery],
      };
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
};

export const NO_CHARACTER_SPECIFIED: Record<Language, string> = {
  ko: "등장인물 없음",
  en: "No character specified",
};

export const getCharacterSearchCheckPrompt = (
  language: Language,
  userSpecifiedCharacter: string,
  searchResult: string,
): {
  systemPrompt: string;
  userQueries: string[];
} => {
  switch (language) {
    case "ko":
      return {
        systemPrompt: [
          "당신은 사용자가 지정한 등장인물이 책에 등장하는지 확인하는 유용한 도우미입니다.",
          "사용자가 지정한 등장인물이 검색 결과에 포함되어 있다면 그 이름을 반환해주세요.",
          "답변은 등장인물 한명의 이름만 포함되어야 합니다.",
          "풀네임을 우선으로 사용해주세요.",
          `사용자가 등장인물을 명시하지 않은 경우, 또는 사용자가 명시한 등장인물이 검색 결과에 나타나지 않는 경우 '${NO_CHARACTER_SPECIFIED[language]}'이라고 답변해주세요.`,
        ].join("\n"),
        userQueries: [
          `사용자가 지정한 등장인물: ${userSpecifiedCharacter}`,
          `검색결과: ${searchResult}`,
        ],
      };
    case "en":
      return {
        systemPrompt: [
          "You are a helpful assistant that checks if a user-specified character appears in the book.",
          "If the specified character appears in the search results, return their name.",
          "The answer should only include the name of one character.",
          "Use the full name if available.",
          `If the user did not specify a character, or if the specified character does not appear in the search results, respond with '${NO_CHARACTER_SPECIFIED[language]}'.`,
        ].join("\n"),
        userQueries: [
          `User-specified character: ${userSpecifiedCharacter}`,
          `Search results: ${searchResult}`,
        ],
      };
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
};

export const getCharacterTraitSearchQuery = (
  language: Language,
  characterName: string,
): string[] => {
  switch (language) {
    case "ko":
      return [
        `${characterName}의 성격`,
        `${characterName}의 성향`,
        `${characterName}의 말투`,
        `${characterName}의 별명`,
      ];
    case "en":
      return [
        `Personality traits of ${characterName}`,
        `Disposition of ${characterName}`,
        `Manner of speaking of ${characterName}`,
        `Nickname of ${characterName}`,
      ];
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
};

export const getCharacterChatPrompts = (
  language: Language,
  bookTitle: string,
  characterName: string,
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
} => {
  switch (language) {
    case "ko":
      return {
        systemPrompt: [
          "당신은 책에 등장하는 등장인물로 빙의되어 사용자의 질문에 답변하는 유용한 도우미입니다.",
          `책 제목: ${bookTitle}`,
          `등장인물 이름: ${characterName}`,
          "사용자는 등장인물의 특징을 나타내는 검색결과를 제공할 것이며, 당신은 이 정보를 참고하여 그 다음 사용자의 질문에 대해 해당 등장인물의 관점에서 답변해야 합니다.",
          "답변할 때는, 등장인물의 성격, 말투, 행동 등을 고려하여 답변해주세요.",
          "사용자가 추가로 검색결과를 제공할 수 있습니다. 이 경우, 해당 검색결과 또한 참고하여 답변해주세요.",
        ].join("\n"),
        userQueries: [
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
          `사용자 질문: ${userQuery}`,
        ],
      };
    case "en":
      return {
        systemPrompt: [
          "You are a helpful assistant embodying a character from a book, answering user questions from that character's perspective.",
          `Book Title: ${bookTitle}`,
          `Character Name: ${characterName}`,
          "The user will provide search results that reflect the character's traits, and you should use this information to answer the user's next questions from the character's perspective.",
          "When answering from the character's perspective, consider the character's personality, manner of speaking, and behavior.",
          "The user may provide additional search results. In this case, also refer to those search results when answering.",
        ].join("\n"),
        userQueries: [
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
          `User question: ${userQuery}`,
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
  historyText: string,
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
