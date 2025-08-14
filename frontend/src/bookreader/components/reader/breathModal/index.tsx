import { AssistantChatBot } from "./AssistantChatBot";
import { CharacterChatBot } from "./CharacterChatBot";

export const BreathModalContent = ({
  bookId,
  offset,
}: {
  bookId: string;
  offset: number;
}) => {
  return (
    <>
      <AssistantChatBot bookId={bookId} offset={offset} />
      <CharacterChatBot bookId={bookId} offset={offset} />
    </>
  );
};
