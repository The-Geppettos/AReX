import type { Options } from "amqplib";
import type { ConsumeCallback, MessageBroker } from "..";

export abstract class Queue {
  abstract queueName: string;

  protected messageBroker;

  constructor(messageBroker: MessageBroker) {
    messageBroker.addQueue(this);
    this.messageBroker = messageBroker;
  }
}

export abstract class ConsumerQueue extends Queue {
  consume(consumeCallback: ConsumeCallback, options?: Options.Consume) {
    this.messageBroker.addConsumer(this.queueName, consumeCallback, options);
  }
}

export abstract class ProducerQueue<T extends Object> extends Queue {
  async sendMessage(message: T, options?: Options.Publish): Promise<void> {
    await this.messageBroker.sendToQueue(
      this.queueName,
      JSON.stringify(message),
      options,
    );
  }
}
