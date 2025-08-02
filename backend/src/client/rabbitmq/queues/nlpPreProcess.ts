import type { NLPPreProcessReq } from "@shared/types";
import { ProducerQueue, ConsumerQueue } from "./abstract";

export class NLPPreProcessProducer extends ProducerQueue<NLPPreProcessReq> {
  queueName = "nlp-pre-process-req";
}

export class NLPPreProcessConsumer extends ConsumerQueue {
  queueName = "nlp-pre-process-res";
}
