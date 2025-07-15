import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import BookReader from "./components/BookReader";
import BookList from "./components/BookList";
import { useParams } from "react-router-dom";
import Admin from "./components/admin";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

// Create a wrapper component to access URL parameters
const BookReaderWrapper = () => {
  const { bookId } = useParams();
  return <BookReader bookId={bookId || ""} />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/book/:bookId" element={<BookReaderWrapper />} />
          <Route path="/" element={<BookList />} />
          {Admin}
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
