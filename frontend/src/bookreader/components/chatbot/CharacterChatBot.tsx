import { type ChatController } from "./context";
import { useEffect, useRef, useState } from "react";
import { AgentAPI } from "@src/api/agent";

export const CharacterChatBot = ({
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
            등장인물과 대화를 시작해보세요! 대화하고 싶은 인물을 호출하면 대화를
            시작할 수 있습니다.
            <br />
            예) "제페토와 대화하고 싶어"
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
              setChatTitle("등장인물 찾는중...");
              const characterCheck = await AgentAPI.checkCharacter({
                message: message,
                book_id: bookId,
                offset: initialOffset,
              });
              if (characterCheck.has_character) {
                setChatTitle(`${characterCheck.character_name}와의 대화`);
                setChatId(characterCheck.chat_id);
                setOffset(initialOffset);
                setPageNumber(initialPageNumber);
                appendMessage({
                  content: characterCheck.message,
                  role: "assistant",
                });
              } else {
                setChatTitle("등장인물을 찾을 수 없음");
                appendMessage({
                  content:
                    "입력하신 등장인물을 찾을 수 없습니다. 인물 이름을 정확히 입력했는지 확인해주세요.",
                  role: "assistant",
                });
                return;
              }
            } else {
              const response = await AgentAPI.chatCharacter({
                message: message,
                book_id: bookId,
                offset: offset,
                chat_id: chatId,
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
