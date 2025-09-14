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
  options: Options.Consume | undefined = undefined;

  registerConsumer() {
    this.messageBroker.addConsumer(this.queueName, this.consume, this.options);
  }

  protected abstract consume: ConsumeCallback;
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
