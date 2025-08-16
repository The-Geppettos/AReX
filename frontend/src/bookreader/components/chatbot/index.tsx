import { AssistantChatBot } from "./AssistantChatBot";
import { CharacterChatBot } from "./CharacterChatBot";
import { useChatBotContext } from "./context";

export const ChatBot = ({
  bookId,
  offset,
}: {
  bookId: string;
  offset: number;
}) => {
  const {
    chatControllers,
    selectedChatIdx,
    setSelectedChatIdx,
    newChat,
    deleteChat,
  } = useChatBotContext();

  const chatController = chatControllers[selectedChatIdx];

  return (
    <div className="chat">
      <div className="chat-list">
        {chatControllers.map((chatController, index) => (
          <div
            key={chatController.chatKey}
            className={`chat-list-item ${
              selectedChatIdx === index ? "active" : ""
            }`}
          >
            <button
              className="chat-title"
              onClick={() => setSelectedChatIdx(index)}
              title={chatController.chatTitle}
            >
              {chatController.chatTitle}
            </button>
            <button
              className="delete-chat-button"
              onClick={() => deleteChat(index)}
            ></button>
          </div>
        ))}
        <button className="new-chat-button" onClick={() => newChat()} />
      </div>
      <div className="chat-container">
        <div className="chat-title">{chatController.chatTitle}</div>
        {chatController.chatType === "assistant" && (
          <AssistantChatBot
            bookId={bookId}
            offset={offset}
            chatController={chatController}
          />
        )}
        {chatController.chatType === "character" && (
          <CharacterChatBot
            bookId={bookId}
            offset={offset}
            chatController={chatController}
          />
        )}
      </div>
    </div>
  );
};
