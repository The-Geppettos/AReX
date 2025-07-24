import { initializeDatabase } from ".";
import {
  bookOperations,
  bookChapterOperations,
  bookPageOperations,
} from "./operations";

const mockDatabase = async () => {
  try {
    await initializeDatabase();

    const book1 = await bookOperations.createBook(
      "The Great Gatsby",
      "F. Scott Fitzgerald",
    );

    const book1chapter1 = await bookChapterOperations.createChapter(
      book1.id,
      1,
      "Chapter 1: In my younger and more vulnerable years",
    );

    await bookPageOperations.createBookPage(
      book1.id,
      book1chapter1.id,
      1,
      'In my younger and more vulnerable years my father gave me some advice that I\'ve been turning over in my mind ever since.\n\n"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven\'t had the advantages that you\'ve had."\n\n',
    );
    await bookPageOperations.createBookPage(
      book1.id,
      book1chapter1.id,
      2,
      'In my younger and more vulnerable years my father gave me some advice that I\'ve been turning over in my mind ever since.\n\n"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven\'t had the advantages that you\'ve had."\n\n',
    );

    const book2 = await bookOperations.createBook(
      "To Kill a Mockingbird",
      "Harper Lee",
    );
    const book2chapter1 = await bookChapterOperations.createChapter(
      book2.id,
      1,
      "Chapter 1: When he was nearly thirteen",
    );
    await bookPageOperations.createBookPage(
      book2.id,
      book2chapter1.id,
      1,
      "When he was nearly thirteen, my brother Jem got his arm badly broken at the elbow. When it healed, and Jem's fears of never being able to play football were assuaged, he was seldom self-conscious about his injury.",
    );
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};

mockDatabase();
