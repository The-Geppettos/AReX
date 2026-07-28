import { type ChatController } from "./type";
import { useEffect, useRef, useState } from "react";
import { AgentAPI } from "@src/api/agent";
import type { BookPageDetail } from "@shared/book";

export const CharacterChatBot = ({
  bookId,
  pageNumber: initialPageNumber,
  chatController,
  pageInfo,
}: {
  bookId: string;
  pageNumber: number;
  chatController: ChatController;
  pageInfo: BookPageDetail | null;
}) => {
  const messageContainerRef = useRef<HTMLDivElement>({} as HTMLDivElement);
  const [waiting, setWaiting] = useState(false);
  const [initCharacter, setInitCharacter] = useState<string>(
    pageInfo?.characters?.[0] || "",
  );

  const {
    messageInput,
    setMessageInput,
    messages,
    appendMessage,
    chatId,
    pageNumber,
    setChatId,
    setChatTitle,
    setPageNumber,
  } = chatController;

  const [initialized, setInitialized] = useState(!!chatId);

  useEffect(() => {
    messageContainerRef.current.scrollTop =
      messageContainerRef.current.scrollHeight;
  }, [messages]);

  return (
    <>
      <div className="chat-message-container" ref={messageContainerRef}>
        {messages.length === 0 && (
          <div className="chat-placeholder">
            등장인물을 선택 후 대화를 시작해보세요!
          </div>
        )}
        {messages.map((message, index) => (
          <div className={`chat-message ${message.role}`} key={index}>
            <div className={`chat-message-content ${message.role}`}>
              {message.content}
            </div>
          </div>
        ))}
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const message = messageInput.trim();
          if (!message) {
            return;
          }
          setMessageInput("");
          appendMessage({ content: message, role: "user" });
          try {
            setWaiting(true);
            if (!chatId) {
              setInitialized(true);
              setChatTitle(`${initCharacter}와의 대화`);
              const response = await AgentAPI.chatCharacter({
                message: message,
                book_id: bookId,
                page_number: initialPageNumber,
                character_name: initCharacter,
              });
              setChatId(response.chat_id);
              setPageNumber(initialPageNumber);
              appendMessage({ content: response.message, role: "assistant" });
            } else {
              const response = await AgentAPI.chatCharacter({
                message: message,
                book_id: bookId,
                page_number: pageNumber,
                chat_id: chatId,
                character_name: initCharacter,
              });
              appendMessage({ content: response.message, role: "assistant" });
            }
          } catch (error) {
            console.error(error);
          } finally {
            setWaiting(false);
          }
        }}
      >
        <fieldset className="chat-input" disabled={waiting}>
          {!initialized && (
            <select
              className="mr-2"
              onChange={(e) => {
                setInitCharacter(e.target.value);
              }}
              value={initCharacter}
            >
              {(pageInfo?.characters || []).map((character_name) => (
                <option key={character_name} value={character_name}>
                  {character_name}
                </option>
              ))}
            </select>
          )}

          <input
            value={messageInput}
            onChange={(e) => {
              setMessageInput(e.target.value);
            }}
          />
          <button type="submit">
            <img src="/logo2_64.png" alt="AReX Logo" />
          </button>
        </fieldset>
      </form>
    </>
  );
};
