import { initializeDatabase } from ".";
import { bookOperations, bookChunkOperations } from "./operations";

const mockDatabase = async () => {
  try {
    await initializeDatabase();

    const book1 = await bookOperations.createBook(
      "The Great Gatsby",
      "F. Scott Fitzgerald",
    );
    const book2 = await bookOperations.createBook(
      "To Kill a Mockingbird",
      "Harper Lee",
    );
    await bookChunkOperations.createBookChunk(
      book1.id,
      'In my younger and more vulnerable years my father gave me some advice that I\'ve been turning over in my mind ever since.\n\n"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven\'t had the advantages that you\'ve had."\n\n',
    );
    await bookChunkOperations.createBookChunk(
      book1.id,
      'In my younger and more vulnerable years my father gave me some advice that I\'ve been turning over in my mind ever since.\n\n"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven\'t had the advantages that you\'ve had."\n\n',
    );
    await bookChunkOperations.createBookChunk(
      book1.id,
      'In my younger and more vulnerable years my father gave me some advice that I\'ve been turning over in my mind ever since.\n\n"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven\'t had the advantages that you\'ve had."\n\n',
    );
    await bookChunkOperations.createBookChunk(
      book1.id,
      'In my younger and more vulnerable years my father gave me some advice that I\'ve been turning over in my mind ever since.\n\n"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven\'t had the advantages that you\'ve had."\n\n',
    );
    await bookChunkOperations.createBookChunk(
      book1.id,
      'In my younger and more vulnerable years my father gave me some advice that I\'ve been turning over in my mind ever since.\n\n"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven\'t had the advantages that you\'ve had."\n\n',
    );
    await bookChunkOperations.createBookChunk(
      book1.id,
      'In my younger and more vulnerable years my father gave me some advice that I\'ve been turning over in my mind ever since.\n\n"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven\'t had the advantages that you\'ve had."\n\n',
    );
    await bookChunkOperations.createBookChunk(
      book1.id,
      'In my younger and more vulnerable years my father gave me some advice that I\'ve been turning over in my mind ever since.\n\n"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven\'t had the advantages that you\'ve had."\n\n',
    );
    await bookChunkOperations.createBookChunk(
      book1.id,
      'In my younger and more vulnerable years my father gave me some advice that I\'ve been turning over in my mind ever since.\n\n"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven\'t had the advantages that you\'ve had."\n\n',
    );
    await bookChunkOperations.createBookChunk(
      book1.id,
      'In my younger and more vulnerable years my father gave me some advice that I\'ve been turning over in my mind ever since.\n\n"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven\'t had the advantages that you\'ve had."\n\n',
    );
    await bookChunkOperations.createBookChunk(
      book1.id,
      'In my younger and more vulnerable years my father gave me some advice that I\'ve been turning over in my mind ever since.\n\n"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven\'t had the advantages that you\'ve had."\n\n',
    );
    await bookChunkOperations.createBookChunk(
      book1.id,
      'In my younger and more vulnerable years my father gave me some advice that I\'ve been turning over in my mind ever since.\n\n"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven\'t had the advantages that you\'ve had."\n\n',
    );
    await bookChunkOperations.createBookChunk(
      book1.id,
      'In my younger and more vulnerable years my father gave me some advice that I\'ve been turning over in my mind ever since.\n\n"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven\'t had the advantages that you\'ve had."\n\n',
    );
    await bookChunkOperations.createBookChunk(
      book1.id,
      'In my younger and more vulnerable years my father gave me some advice that I\'ve been turning over in my mind ever since.\n\n"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven\'t had the advantages that you\'ve had."\n\n',
    );
    await bookChunkOperations.createBookChunk(
      book1.id,
      'In my younger and more vulnerable years my father gave me some advice that I\'ve been turning over in my mind ever since.\n\n"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven\'t had the advantages that you\'ve had."\n\n',
    );
    await bookChunkOperations.createBookChunk(
      book1.id,
      'In my younger and more vulnerable years my father gave me some advice that I\'ve been turning over in my mind ever since.\n\n"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven\'t had the advantages that you\'ve had."\n\n',
    );
    await bookChunkOperations.createBookChunk(
      book1.id,
      'In my younger and more vulnerable years my father gave me some advice that I\'ve been turning over in my mind ever since.\n\n"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven\'t had the advantages that you\'ve had."\n\n',
    );
    await bookChunkOperations.createBookChunk(
      book1.id,
      'In my younger and more vulnerable years my father gave me some advice that I\'ve been turning over in my mind ever since.\n\n"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven\'t had the advantages that you\'ve had."\n\n',
    );
    await bookChunkOperations.createBookChunk(
      book1.id,
      'In my younger and more vulnerable years my father gave me some advice that I\'ve been turning over in my mind ever since.\n\n"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven\'t had the advantages that you\'ve had."\n\n',
    );
    await bookChunkOperations.createBookChunk(
      book1.id,
      'In my younger and more vulnerable years my father gave me some advice that I\'ve been turning over in my mind ever since.\n\n"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven\'t had the advantages that you\'ve had."\n\n',
    );
    await bookChunkOperations.createBookChunk(
      book1.id,
      'In my younger and more vulnerable years my father gave me some advice that I\'ve been turning over in my mind ever since.\n\n"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven\'t had the advantages that you\'ve had."\n\n',
    );
    await bookChunkOperations.createBookChunk(
      book1.id,
      'In my younger and more vulnerable years my father gave me some advice that I\'ve been turning over in my mind ever since.\n\n"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven\'t had the advantages that you\'ve had."\n\n',
    );
    await bookChunkOperations.createBookChunk(
      book1.id,
      'In my younger and more vulnerable years my father gave me some advice that I\'ve been turning over in my mind ever since.\n\n"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven\'t had the advantages that you\'ve had."\n\n',
    );
    await bookChunkOperations.createBookChunk(
      book1.id,
      'In my younger and more vulnerable years my father gave me some advice that I\'ve been turning over in my mind ever since.\n\n"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven\'t had the advantages that you\'ve had."\n\n',
    );
    await bookChunkOperations.createBookChunk(
      book1.id,
      'In my younger and more vulnerable years my father gave me some advice that I\'ve been turning over in my mind ever since.\n\n"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven\'t had the advantages that you\'ve had."\n\n',
    );
    await bookChunkOperations.createBookChunk(
      book1.id,
      'In my younger and more vulnerable years my father gave me some advice that I\'ve been turning over in my mind ever since.\n\n"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven\'t had the advantages that you\'ve had."\n\n',
    );
    await bookChunkOperations.createBookChunk(
      book1.id,
      'In my younger and more vulnerable years my father gave me some advice that I\'ve been turning over in my mind ever since.\n\n"Whenever you feel like criticizing any one," he told me, "just remember that all the people in this world haven\'t had the advantages that you\'ve had."\n\n',
    );
    await bookChunkOperations.createBookChunk(
      book2.id,
      "When he was nearly thirteen, my brother Jem got his arm badly broken at the elbow. When it healed, and Jem's fears of never being able to play football were assuaged, he was seldom self-conscious about his injury.",
    );
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};

mockDatabase();
