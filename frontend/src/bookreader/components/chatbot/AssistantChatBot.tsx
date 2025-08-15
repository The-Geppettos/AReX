import type { ChatController } from "./context";
import { useEffect, useRef } from "react";
import { AgentAPI } from "@src/api/agent";

export const AssistantChatBot = ({
  bookId,
  offset,
  chatController,
}: {
  bookId: string;
  offset: number;
  chatController: ChatController;
}) => {
  const messageContainerRef = useRef<HTMLDivElement>({} as HTMLDivElement);

  const {
    messageInput,
    setMessageInput,
    messages,
    appendMessage,
    chatId,
    setChatId,
  } = chatController;

  useEffect(() => {
    messageContainerRef.current.scrollTop =
      messageContainerRef.current.scrollHeight;
  }, [messages]);

  return (
    <>
      <div className="chat-message-container" ref={messageContainerRef}>
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
            const resMessage = await AgentAPI.askAssistant({
              message: message,
              book_id: bookId,
              offset: offset,
              chat_id: chatId,
            });
            setChatId(resMessage.chat_id);
            appendMessage({
              content: resMessage.message,
              role: "assistant",
            });
          } catch (error) {
            console.error(error);
          }
        }}
      >
        <div className="chat-input">
          <input
            value={messageInput}
            onChange={(e) => {
              setMessageInput(e.target.value);
            }}
          />
          <button type="submit">Send</button>
        </div>
      </form>
    </>
  );
};
