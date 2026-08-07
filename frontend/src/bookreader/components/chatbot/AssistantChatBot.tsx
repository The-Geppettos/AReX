import type { ChatController } from "./type";
import { useEffect, useRef, useState } from "react";
import { AgentAPI } from "@src/api/agent";

export const AssistantChatBot = ({
  bookId,
  pageNumber: initialPageNumber,
  chatController,
}: {
  bookId: string;
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
    pageNumber,
    setChatId,
    setChatTitle,
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
            setWaiting(true);
            if (!chatId) {
              setChatTitle("도우미와의 대화");
              const response = await AgentAPI.askAssistant({
                message: message,
                book_id: bookId,
                page_number: pageNumber,
              });
              setChatId(response.chat_id);
              setPageNumber(initialPageNumber);
              appendMessage({
                content: response.message,
                role: "assistant",
              });
            } else {
              const response = await AgentAPI.askAssistant({
                message: message,
                book_id: bookId,
                page_number: pageNumber,
                chat_id: chatId,
              });
              appendMessage({
                content: response.message,
                role: "assistant",
              });
            }
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
