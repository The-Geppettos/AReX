import { ChatBot } from "../../chatbot";

export const BreathModalContent = ({
  bookId,
  offset,
}: {
  bookId: string;
  offset: number;
}) => {
  return <ChatBot bookId={bookId} offset={offset} />;
};
