import type { ChatController } from "./context";
import { useEffect, useRef, useState } from "react";
import { AgentAPI } from "@src/api/agent";

export const AssistantChatBot = ({
  bookId,
  offset: initialOffset,
  pageNumber: initialPageNumber,
  chatController,
}: {
  bookId: string;
  offset: number;
  pageNumber: number;
  chatController: ChatController;
}) => {
  const messageContainerRef = useRef<HTMLDivElement>({} as HTMLDivElement);
  const [waiting, setWaiting] = useState(false);

  const {
    messageInput,
    setMessageInput,
    messages,
    appendMessage,
    chatId,
    offset,
    setChatId,
    setChatTitle,
    setOffset,
    setPageNumber,
  } = chatController;

  useEffect(() => {
    messageContainerRef.current.scrollTop =
      messageContainerRef.current.scrollHeight;
  }, [messages]);

  return (
    <>
      <div className="chat-message-container" ref={messageContainerRef}>
        {messages.length === 0 && (
          <div className="chat-placeholder">
            책에 대해 궁금한 점을 물어보세요! 현재 페이지까지의 내용을 바탕으로
            답변해 드립니다.
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
            const requestParams = {
              message: message,
              book_id: bookId,
              offset: offset,
              chat_id: chatId,
            };
            if (!chatId) {
              requestParams.offset = initialOffset;
            }
            setWaiting(true);
            const resMessage = await AgentAPI.askAssistant(requestParams);
            setChatTitle("도우미와의 대화");
            setChatId(resMessage.chat_id);
            setOffset(initialOffset);
            setPageNumber(initialPageNumber);
            appendMessage({
              content: resMessage.message,
              role: "assistant",
            });
          } catch (error) {
            console.error(error);
          } finally {
            setWaiting(false);
          }
        }}
      >
        <fieldset className="chat-input" disabled={waiting}>
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
