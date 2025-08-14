import { useBreathContext } from "./context";
import { useEffect, useRef } from "react";
import { AgentAPI } from "@src/api/agent";

export const CharacterChatBot = ({
  bookId,
  offset,
}: {
  bookId: string;
  offset: number;
}) => {
  const {
    charChatId,
    setCharChatId,
    // charName,
    setCharName,
    charMessageInput,
    setCharMessageInput,
    charMessages,
    setCharMessages,
  } = useBreathContext();

  const messageContainerRef = useRef<HTMLDivElement>({} as HTMLDivElement);

  useEffect(() => {
    messageContainerRef.current.scrollTop =
      messageContainerRef.current.scrollHeight;
  }, [charMessages]);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const message = charMessageInput.trim();
        if (!message) {
          return;
        }
        setCharMessageInput("");
        setCharMessages((prev) => [
          ...prev,
          { content: message, role: "user" },
        ]);
        try {
          if (!charChatId) {
            const characterCheck = await AgentAPI.checkCharacter({
              message: message,
              book_id: bookId,
              offset: offset,
            });
            if (characterCheck.has_character) {
              setCharName(characterCheck.character_name);
              setCharChatId(characterCheck.chat_id);
              setCharMessages((prev) => [
                ...prev,
                {
                  content: characterCheck.message,
                  role: "assistant",
                },
              ]);
            }
          } else {
            const response = await AgentAPI.chatCharacter({
              message: message,
              book_id: bookId,
              offset: offset,
              chat_id: charChatId,
            });
            setCharMessages((prev) => [
              ...prev,
              { content: response.message, role: "assistant" },
            ]);
          }
        } catch (error) {
          console.error(error);
        }
      }}
    >
      <div className="chat">
        <div className="chat-message-container" ref={messageContainerRef}>
          {charMessages.map((message, index) => (
            <div className={`chat-message ${message.role}`} key={index}>
              <div className={`chat-message-content ${message.role}`}>
                {message.content}
              </div>
            </div>
          ))}
        </div>
        <div className="chat-input">
          <input
            value={charMessageInput}
            onChange={(e) => {
              setCharMessageInput(e.target.value);
            }}
          />
          <button type="submit">Send</button>
        </div>
      </div>
    </form>
  );
};
