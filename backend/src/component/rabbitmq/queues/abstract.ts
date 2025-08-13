import type { Options } from "amqplib";
import type { ConsumeCallback, RabbitMQ } from "..";

export abstract class Queue {
  abstract queueName: string;

  protected rabbitMQ: RabbitMQ;

  constructor(rabbitMQ: RabbitMQ) {
    rabbitMQ.addQueue(this);
    this.rabbitMQ = rabbitMQ;
  }
}

export abstract class ConsumerQueue extends Queue {
  consume(consumeCallback: ConsumeCallback, options?: Options.Consume) {
    this.rabbitMQ.addConsumer(this.queueName, consumeCallback, options);
  }
}

export abstract class ProducerQueue<T extends Object> extends Queue {
  async sendMessage(message: T, options?: Options.Publish): Promise<void> {
    await this.rabbitMQ.sendToQueue(
      this.queueName,
      JSON.stringify(message),
      options,
    );
  }
}
