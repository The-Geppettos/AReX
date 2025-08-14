import { useBreathContext } from "./context";
import { useEffect, useRef } from "react";
import { AgentAPI } from "@src/api/agent";

export const AssistantChatBot = ({
  bookId,
  offset,
}: {
  bookId: string;
  offset: number;
}) => {
  const {
    assChatId,
    setAssChatId,
    assMessageInput,
    setAssMessageInput,
    assMessages,
    setAssMessages,
  } = useBreathContext();

  const messageContainerRef = useRef<HTMLDivElement>({} as HTMLDivElement);

  useEffect(() => {
    messageContainerRef.current.scrollTop =
      messageContainerRef.current.scrollHeight;
  }, [assMessages]);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const message = assMessageInput.trim();
        if (!message) {
          return;
        }
        setAssMessageInput("");
        setAssMessages((prev) => [...prev, { content: message, role: "user" }]);
        try {
          const resMessage = await AgentAPI.askAssistant({
            message: message,
            book_id: bookId,
            offset: offset,
            chat_id: assChatId,
          });
          setAssChatId(resMessage.chat_id);
          setAssMessages((prev) => [
            ...prev,
            { content: resMessage.message, role: "assistant" },
          ]);
        } catch (error) {
          console.error(error);
        }
      }}
    >
      <div className="chat">
        <div className="chat-message-container" ref={messageContainerRef}>
          {assMessages.map((message, index) => (
            <div className={`chat-message ${message.role}`} key={index}>
              <div className={`chat-message-content ${message.role}`}>
                {message.content}
              </div>
            </div>
          ))}
        </div>
        <div className="chat-input">
          <input
            value={assMessageInput}
            onChange={(e) => {
              setAssMessageInput(e.target.value);
            }}
          />
          <button type="submit">Send</button>
        </div>
      </div>
    </form>
  );
};
