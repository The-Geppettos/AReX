import { ProducerQueue, ConsumerQueue } from "./abstract";

export class PostProcessProducer extends ProducerQueue<{ book_id: string }> {
  queueName = "post-process";
}

export class PostProcessConsumer extends ConsumerQueue {
  queueName = "post-process";
}
