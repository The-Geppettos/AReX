import { ReadBookAPI } from "@src/api/readBook";
import { useState } from "react";

export const Helper = ({
  bookId,
  offset,
}: {
  bookId: string;
  offset: number;
}) => {
  const [message, setMessage] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        ReadBookAPI.askAssistant(message, bookId, offset);
      }}
    >
      <input value={message} onChange={(e) => setMessage(e.target.value)} />
      <button type="submit">Send</button>
    </form>
  );
};
