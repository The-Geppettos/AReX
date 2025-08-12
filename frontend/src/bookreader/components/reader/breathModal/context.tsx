import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
} from "react";

type Message = {
  message: string;
  role: "user" | "assistant";
};

const BreathContext = createContext({
  assMessageInput: "",
  setAssMessageInput: ((_message: string) => {}) as Dispatch<
    SetStateAction<string>
  >,
  assMessages: [] as Message[],
  setAssMessages: ((_messages: Message[]) => {}) as Dispatch<
    SetStateAction<Message[]>
  >,
});

export const BreathProvider = ({ children }: PropsWithChildren<{}>) => {
  const [assMessageInput, setAssMessageInput] = useState("");
  const [assMessages, setAssMessages] = useState<Message[]>([]);

  return (
    <BreathContext.Provider
      value={{
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
