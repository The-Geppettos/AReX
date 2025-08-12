import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import "./App.scss";
import { BookReader } from "./components/reader";
import { BookPagePreview } from "./components/BookPagePreview";
import { ModalProvider } from "./components/modal";
import { BreathProvider } from "./components/reader/breathModal/context";

const BookReaderWrapper = () => {
  const { bookId } = useParams();
  return <BookReader bookId={bookId || ""} />;
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
            <BreathProvider>
              <ModalProvider>
                <BookReaderWrapper />
              </ModalProvider>
            </BreathProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
