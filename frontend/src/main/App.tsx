import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AutoStories, CloudUpload, LibraryBooks } from "@mui/icons-material";
import { BookListView } from "./components/BookList";
import { Layout } from "./components/layout";
import { RegisterNewBook } from "./components/admin/registerNewBook";
import { ManageBooks } from "./components/admin/ManageBooks";
import { theme } from "./theme";

const pages = [
  {
    title: "Read Book",
    icon: <AutoStories />,
    url: "/books",
    component: BookListView,
  },
  {
    title: "Register Book",
    icon: <CloudUpload />,
    url: "/admin/register-new-book",
    component: RegisterNewBook,
  },
  {
    title: "Manage Books",
    icon: <LibraryBooks />,
    url: "/admin/manage-books",
    component: ManageBooks,
  },
];

const noAdminPages = [
  {
    title: "Read Book",
    icon: <AutoStories />,
    url: "/*",
    component: BookListView,
  },
];

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Layout pages={__NO_ADMIN__ === "true" ? noAdminPages : pages} />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
