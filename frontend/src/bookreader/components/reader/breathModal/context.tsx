import type { ChatMessage } from "@shared/chat";
import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
} from "react";

const BreathContext = createContext({
  assChatId: "",
  setAssChatId: ((_id: string) => {}) as Dispatch<SetStateAction<string>>,

  assMessageInput: "",
  setAssMessageInput: ((_message: string) => {}) as Dispatch<
    SetStateAction<string>
  >,

  assMessages: [] as ChatMessage[],
  setAssMessages: ((_messages: ChatMessage[]) => {}) as Dispatch<
    SetStateAction<ChatMessage[]>
  >,
});

export const BreathProvider = ({ children }: PropsWithChildren<{}>) => {
  const [assChatId, setAssChatId] = useState<string>("");
  const [assMessageInput, setAssMessageInput] = useState("");
  const [assMessages, setAssMessages] = useState<ChatMessage[]>([]);

  return (
    <BreathContext.Provider
      value={{
        assChatId,
        setAssChatId,
        assMessageInput,
        setAssMessageInput,
        assMessages,
        setAssMessages,
      }}
    >
      {children}
    </BreathContext.Provider>
  );
};

export const useBreathContext = () => {
  const context = useContext(BreathContext);
  return context;
};
