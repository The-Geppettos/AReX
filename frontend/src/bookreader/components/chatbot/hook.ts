import { useContext } from "react";
import { ChatBotContext } from "./context";

export const useChatBotContext = () => {
  const context = useContext(ChatBotContext);
  return context;
};
