import type { ChatMessage, ChatType } from "@shared/chat";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
  type Dispatch,
  type SetStateAction,
  useRef,
} from "react";

type Chat = {
  chatId: string;
  chatType: ChatType;
  chatTitle: string;
  messageInput: string;
  messages: ChatMessage[];
  chatKey: number;
};

export type ChatController = {
  setChatId: (chatId: string) => void;
  setChatTitle: (chatTitle: string) => void;
  setMessageInput: (messageInput: string) => void;
  appendMessage: (message: ChatMessage) => void;
} & Chat;

const ChatBotContext = createContext({
  chatControllers: [] as ChatController[],
  newChat: (() => {}) as () => void,
  deleteChat: (() => {}) as (chatIdx: number) => void,
  selectedChatIdx: 0,
  setSelectedChatIdx: (() => {}) as Dispatch<SetStateAction<number>>,
});

export const ChatBotProvider = ({ children }: PropsWithChildren<{}>) => {
  const chatKeyIncrementRef = useRef(1);

  const getNewChat = (key: number): Chat => {
    return {
      chatId: "",
      chatType: "assistant",
      chatTitle: `New Chat`,
      messageInput: "",
      messages: [],
      chatKey: key,
    };
  };

  const [chats, setChats] = useState<Chat[]>([getNewChat(1)]);
  const [selectedChatIdx, setSelectedChatIdx] = useState<number>(0);
  const chatControllers = useMemo(
    () =>
      chats.map((chat, idx) => ({
        ...chat,
        setChatId: (chatId: string) => {
          setChats((prev) => {
            const chatsCopy = [...prev];
            chatsCopy[idx] = {
              ...chatsCopy[idx],
              chatId: chatId,
            };
            return chatsCopy;
          });
        },
        setChatTitle: (chatTitle: string) => {
          setChats((prev) => {
            const chatsCopy = [...prev];
            chatsCopy[idx] = {
              ...chatsCopy[idx],
              chatTitle: chatTitle,
            };
            return chatsCopy;
          });
        },
        setMessageInput: (messageInput: string) => {
          setChats((prev) => {
            const chatsCopy = [...prev];
            chatsCopy[idx] = {
              ...chatsCopy[idx],
              messageInput: messageInput,
            };
            return chatsCopy;
          });
        },
        appendMessage: (message: ChatMessage) => {
          setChats((prev) => {
            const chatsCopy = [...prev];
            chatsCopy[idx] = {
              ...chatsCopy[idx],
              messages: [...chatsCopy[idx].messages, message],
            };
            return chatsCopy;
          });
        },
      })),
    [chats],
  );

  const newChat = () => {
    if (chats[chats.length - 1].chatId) {
      const newKey = ++chatKeyIncrementRef.current;
      setSelectedChatIdx(chats.length);
      setChats((prev) => [...prev, getNewChat(newKey)]);
    } else {
      setSelectedChatIdx(chats.length - 1);
    }
  };

  const deleteChat = (chatIdx: number) => {
    if (chats.length <= 1) {
      const newKey = ++chatKeyIncrementRef.current;
      setChats([getNewChat(newKey)]);
    } else {
      if (selectedChatIdx + 1 === chats.length) {
        setSelectedChatIdx((idx) => idx - 1);
      }
      setChats((prev) => prev.filter((_, idx) => idx !== chatIdx));
    }
  };

  return (
    <ChatBotContext.Provider
      value={{
        chatControllers,
        newChat,
        deleteChat,
        selectedChatIdx,
        setSelectedChatIdx,
      }}
    >
      {children}
    </ChatBotContext.Provider>
  );
};

export const useChatBotContext = () => {
  const context = useContext(ChatBotContext);
  return context;
};
