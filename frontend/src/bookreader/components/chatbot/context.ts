import { createContext, type Dispatch, type SetStateAction } from "react";
import type { ChatController } from "./type";

export const ChatBotContext = createContext({
  chatControllers: [] as ChatController[],
  newChat: (() => {}) as () => void,
  deleteChat: (() => {}) as (chatIdx: number) => void,
  selectedChatIdx: 0,
  setSelectedChatIdx: (() => {}) as Dispatch<SetStateAction<number>>,
});
