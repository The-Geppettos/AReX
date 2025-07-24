import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Book as BookIcon } from "@mui/icons-material";
import BookList from "./components/BookList";
import Layout from "./components/layout";
import RegisterBook from "./components/admin/RegisterBook";

import { theme } from "../theme";

const pages = [
  {
    title: "Read Book",
    icon: <BookIcon />,
    url: "/books",
    component: BookList,
  },
  {
    title: "Register Book",
    icon: <BookIcon />,
    url: "/admin/register-book",
    component: RegisterBook,
  },
];

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Layout pages={pages} />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
