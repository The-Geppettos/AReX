import { CHAT_TYPES, type ChatType } from "@shared/chat";
import { AssistantChatBot } from "./AssistantChatBot";
import { CharacterChatBot } from "./CharacterChatBot";
import { useChatBotContext } from "./context";
import { useState } from "react";
import sidebarUrl from "./sidebar.png";

export const ChatBot = ({
  bookId,
  offset,
  pageNumber,
  totalPages,
}: {
  bookId: string;
  offset: number;
  pageNumber: number;
  totalPages: number;
}) => {
  const {
    chatControllers,
    selectedChatIdx,
    setSelectedChatIdx,
    newChat,
    deleteChat,
  } = useChatBotContext();

  const chatController = chatControllers[selectedChatIdx];

  const [chatListFolded, setChatListFolded] = useState(true);

  return (
    <div className={`chat${chatListFolded ? " folded" : ""}`}>
      <div className="chat-list-toggle">
        <button onClick={() => setChatListFolded((prev) => !prev)}>
          <img src={sidebarUrl} />
        </button>
      </div>

      <div className="chat-list-wrapper">
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
          <div className="new-chat-button-wrapper">
            <button className="new-chat-button" onClick={() => newChat()} />
          </div>
        </div>
      </div>

      <div className="chat-container">
        <div className="chat-title">
          {chatController.isNew ? (
            <>
              새 채팅:{" "}
              <select
                onChange={(e) => {
                  chatController.setChatType(e.target.value as ChatType);
                }}
                value={chatController.chatType}
              >
                {CHAT_TYPES.map((chatType) => (
                  <option key={chatType} value={chatType}>
                    {chatType === "assistant" ? "도우미" : "등장인물"}
                  </option>
                ))}
              </select>
            </>
          ) : (
            chatController.chatTitle
          )}
          {chatController.chatId && (
            <small className="chat-id">
              {" "}
              (진척도: {chatController.pageNumber}/{totalPages} pages)
            </small>
          )}
        </div>
        {chatController.chatType === "assistant" && (
          <AssistantChatBot
            bookId={bookId}
            offset={offset}
            pageNumber={pageNumber}
            chatController={chatController}
          />
        )}
        {chatController.chatType === "character" && (
          <CharacterChatBot
            bookId={bookId}
            offset={offset}
            pageNumber={pageNumber}
            chatController={chatController}
          />
        )}
      </div>
    </div>
  );
};
