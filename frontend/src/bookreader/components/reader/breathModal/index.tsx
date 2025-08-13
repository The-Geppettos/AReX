import { ReadBookAPI } from "@src/api/readBook";
import { useBreathContext } from "./context";
import { useEffect, useRef } from "react";

export const BreathModalContent = ({
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
          const resMessage = await ReadBookAPI.askAssistant({
            message: message,
            book_id: bookId,
            offset: offset,
            id: assChatId,
          });
          setAssChatId(resMessage.id);
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
