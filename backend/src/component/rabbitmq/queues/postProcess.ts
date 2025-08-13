import type { PostProcess } from "@shared/messageBroker";

import { ProducerQueue, ConsumerQueue } from "./abstract";

export class PostProcessProducer extends ProducerQueue<PostProcess> {
  queueName = "post-process";
}

export class PostProcessConsumer extends ConsumerQueue {
  queueName = "post-process";
}
