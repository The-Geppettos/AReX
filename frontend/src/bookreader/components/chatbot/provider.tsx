import type { ChatMessage, ChatType } from "@shared/chat";
import { UserAPI } from "@src/api/user";
import {
  useMemo,
  useState,
  type PropsWithChildren,
  type Dispatch,
  type SetStateAction,
  useRef,
  useEffect,
  useCallback,
} from "react";
import type { Chat } from "./type";
import { ChatBotContext } from "./context";

export const ChatBotProvider = ({
  children,
  bookId,
}: PropsWithChildren<{
  bookId: string;
}>) => {
  const chatKeyIncrementRef = useRef(1);

  const getNewChat = (key: number): Chat => {
    return {
      chatId: "",
      chatType: "assistant",
      chatTitle: "새 채팅",
      pageNumber: 1,
      messageInput: "",
      messages: [],
      chatKey: key,
      isNew: true,
    };
  };

  const [chats, setChats_] = useState<Chat[]>([]);
  const setChats: Dispatch<SetStateAction<Chat[]>> = useCallback(
    (value) => {
      if (typeof value === "function") {
        setChats_((prev) => {
          const newValue = value(prev);
          UserAPI.setCurrentChat(bookId, newValue).catch(() => {
            console.error("Failed to save current chat");
          });
          return newValue;
        });
      } else {
        setChats_(value);
        UserAPI.setCurrentChat(bookId, value).catch(() => {
          console.error("Failed to save current chat");
        });
      }
    },
    [bookId],
  );

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
        setChatType: (chatType: ChatType) => {
          setChats((prev) => {
            const chatsCopy = [...prev];
            chatsCopy[idx] = {
              ...chatsCopy[idx],
              chatType: chatType,
            };
            return chatsCopy;
          });
        },
        setPageNumber: (pageNumber: number) => {
          setChats((prev) => {
            const chatsCopy = [...prev];
            chatsCopy[idx] = {
              ...chatsCopy[idx],
              pageNumber: pageNumber,
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
              isNew: false,
            };
            return chatsCopy;
          });
        },
      })),
    [chats, setChats],
  );

  const newChat = () => {
    if (chats[chats.length - 1].isNew) {
      setSelectedChatIdx(chats.length - 1);
    } else {
      const newKey = ++chatKeyIncrementRef.current;
      setSelectedChatIdx(chats.length);
      setChats((prev) => [...prev, getNewChat(newKey)]);
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

  useEffect(() => {
    (async () => {
      const currentChat = await UserAPI.getCurrentChat(bookId);
      const notNewChats = currentChat.filter((chat) => !chat.isNew);
      if (notNewChats.length === 0) {
        const newKey = ++chatKeyIncrementRef.current;
        setChats_([getNewChat(newKey)]);
      } else {
        setChats_(
          notNewChats.map((chat) => ({
            ...chat,
            messageInput: "",
            chatKey: ++chatKeyIncrementRef.current,
          })),
        );
      }
    })();
  }, [bookId]);

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
