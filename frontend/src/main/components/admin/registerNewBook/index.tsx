import { PageSplitterProvider } from "./pageSplitter";
import { RegisterForm } from "./registerForm";

export const RegisterNewBook = () => {
  return (
    <PageSplitterProvider>
      <RegisterForm />
    </PageSplitterProvider>
  );
};
