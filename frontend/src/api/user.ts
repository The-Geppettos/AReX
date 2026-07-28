import type { Chat } from "@src/bookreader/components/chatbot/context";

export class UserAPI {
  static async getCurrentPage(bookId: string): Promise<number> {
    const page = parseInt(
      window.localStorage.getItem(`${bookId}_current_page`) || "1",
    );

    if (isNaN(page) || page < 1) {
      return 1;
    }
    return page;
  }

  static async setCurrentPage(bookId: string, page: number): Promise<void> {
    window.localStorage.setItem(`${bookId}_current_page`, page.toString());
  }

  static async getCurrentChat(bookId: string): Promise<Chat[]> {
    const chat = window.localStorage.getItem(`${bookId}_current_chat`);
    if (chat) {
      try {
        const parsed = JSON.parse(chat);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch {
        // ignore
      }
    }
    return [];
  }

  static async setCurrentChat(bookId: string, chat: Chat[]): Promise<void> {
    window.localStorage.setItem(`${bookId}_current_chat`, JSON.stringify(chat));
  }
}
