import type { NLPPreProcessReq, NLPPreProcessRes } from "@shared/messageBroker";
import type { ConsumeCallback, MessageBroker } from "..";
import type { BookUploadService } from "@src/services/bookUpload";

import { ProducerQueue, ConsumerQueue } from "./abstract";

export class NLPPreProcessProducer extends ProducerQueue<NLPPreProcessReq> {
  queueName = "nlp-pre-process-req";
}

export class NLPPreProcessConsumer extends ConsumerQueue {
  queueName = "nlp-pre-process-res";

  private bookUploadService;
  constructor(
    messageBroker: MessageBroker,
    bookUploadService: BookUploadService,
  ) {
    super(messageBroker);
    this.bookUploadService = bookUploadService;
  }

  consume: ConsumeCallback = async (message, acknowledge) => {
    try {
      const nlpPreProcessRes = JSON.parse(
        message.content.toString(),
      ) as NLPPreProcessRes;

      if (!nlpPreProcessRes.success) {
        throw new Error("NLP pre-processing failed");
      }

      if (!nlpPreProcessRes.book_page_id) {
        throw new Error("Invalid message format: book_page_id is required");
      }

      if (!Array.isArray(nlpPreProcessRes.result.sentence_boundaries)) {
        throw new Error(
          "Invalid message format: sentence_boundaries must be an array",
        );
      }

      for (const boundary of nlpPreProcessRes.result.sentence_boundaries) {
        if (
          !Array.isArray(boundary) ||
          boundary.length !== 2 ||
          typeof boundary[0] !== "number" ||
          typeof boundary[1] !== "number"
        ) {
          throw new Error(
            "Invalid sentence boundary format: must be an array of two numbers",
          );
        }
      }

      if (typeof nlpPreProcessRes.result.color_code !== "string") {
        throw new Error("Invalid message format: color_code must be a string");
      }

      if (!Array.isArray(nlpPreProcessRes.result.character_list)) {
        throw new Error(
          "Invalid message format: character_list must be an array",
        );
      }

      await this.bookUploadService.handlePreProcessResult(
        nlpPreProcessRes.book_page_id,
        nlpPreProcessRes.result.sentence_boundaries,
        nlpPreProcessRes.result.color_code,
        nlpPreProcessRes.result.character_list,
      );
      acknowledge();
    } catch (error) {
      console.error("Error processing message:", error);
    }
  };
}
