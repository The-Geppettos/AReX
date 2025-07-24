import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import "./App.scss";
import BookReader from "./BookReader";
import BookPagePreview from "./BookPagePreview";

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
          element={<BookReaderWrapper />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
