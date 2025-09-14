import type { PostProcess } from "@shared/messageBroker";
import type { ConsumeCallback, MessageBroker } from "..";
import type { BookUploadService } from "@src/services/bookUpload";

import { ProducerQueue, ConsumerQueue } from "./abstract";

export class PostProcessProducer extends ProducerQueue<PostProcess> {
  queueName = "post-process";
}

export class PostProcessConsumer extends ConsumerQueue {
  queueName = "post-process";
  private bookUploadService;

  constructor(
    messageBroker: MessageBroker,
    bookUploadService: BookUploadService,
  ) {
    super(messageBroker);
    this.bookUploadService = bookUploadService;
    this.registerConsumer(this.consume);
  }

  consume: ConsumeCallback = async (message, acknowledge) => {
    try {
      const { book_id } = JSON.parse(message.content.toString());

      if (!book_id) {
        throw new Error("Invalid message format: book_id is required");
      }

      await this.bookUploadService.postProcess(book_id);
      acknowledge();
    } catch (error) {
      console.error("Error processing post-process message:", error);
    }
  };
}
