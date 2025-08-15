import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AutoStories, CloudUpload, LibraryBooks } from "@mui/icons-material";
import { BookListView } from "./components/BookList";
import { Layout } from "./components/layout";
import { RegisterNewBook } from "./components/admin/RegisterNewBook";
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
