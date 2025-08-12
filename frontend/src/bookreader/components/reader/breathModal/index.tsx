import { ReadBookAPI } from "@src/api/readBook";
import { useBreathContext } from "./context";

export const BreathModalContent = ({
  bookId,
  offset,
}: {
  bookId: string;
  offset: number;
}) => {
  const { assMessageInput, setAssMessageInput, assMessages, setAssMessages } =
    useBreathContext();

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const message = assMessageInput.trim();
        if (!message) {
          return;
        }
        setAssMessageInput("");
        setAssMessages((prev) => [...prev, { message, role: "user" }]);
        try {
          const resMessage = await ReadBookAPI.askAssistant(
            message,
            bookId,
            offset,
          );
          setAssMessages((prev) => [
            ...prev,
            { message: resMessage.message, role: "assistant" },
          ]);
        } catch (error) {
          console.error(error);
        }
      }}
    >
      <div className="chat">
        <div className="chat-messages">
          {assMessages.map((message, index) => (
            <div className={`message-container ${message.role}`} key={index}>
              <div className={`message ${message.role}`}>{message.message}</div>
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
