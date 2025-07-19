import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { theme } from "../theme";
import BookReader from "./BookReader";

const BookReaderWrapper = () => {
  const { bookId } = useParams();
  return <BookReader bookId={bookId || ""} />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path={"/bookreader/:bookId"} element={<BookReaderWrapper />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
