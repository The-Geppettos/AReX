import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import "./App.scss";
import { BookReader } from "./components/reader";
import { BookPagePreview } from "./components/BookPagePreview";
import { ModalProvider } from "./components/modal";
import { ChatBotProvider } from "./components/chatbot/context";

const BookReaderWrapper = () => {
  const { bookId } = useParams();
  return (
    <ChatBotProvider bookId={bookId || ""}>
      <BookReader bookId={bookId || ""} />
    </ChatBotProvider>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path={"/bookreader/page-preview"}
          element={<BookPagePreview />}
        />
        <Route
          path={"/bookreader/read/:bookId"}
          element={
            <ModalProvider>
              <BookReaderWrapper />
            </ModalProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
