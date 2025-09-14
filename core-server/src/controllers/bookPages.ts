import type { HTTPServer } from "@src/component/httpserver";
import type { BookPageService } from "@src/services/bookPage";
import { Controller, type Route } from "./abstract";

export class BookPageController extends Controller {
  private bookPageService: BookPageService;

  constructor(httpServer: HTTPServer, bookPageService: BookPageService) {
    super(httpServer);
    this.bookPageService = bookPageService;
  }

  override routes: Route[] = [
    {
      path: "/api/book/:id/page/:page",
      method: "get",
      handler: async (req, res) => {
        const { id, page } = req.params;
        try {
          const bookPage = await this.bookPageService.getBookPage(
            id,
            parseInt(page),
          );
          if (!bookPage) {
            return res.status(404).json({ error: "Book page not found" });
          }
          res.json(bookPage);
        } catch (error) {
          res.status(500).json({ error: "Failed to fetch book page" });
        }
      },
    },
  ];
}
