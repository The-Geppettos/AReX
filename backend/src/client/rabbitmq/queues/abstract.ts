import type { ConsumeMessage, Options } from "amqplib";
import type { RabbitMQ } from "..";

export abstract class Queue {
  abstract queueName: string;

  protected rabbitMQ: RabbitMQ;

  constructor(rabbitMQ: RabbitMQ) {
    rabbitMQ.addQueue(this);
    this.rabbitMQ = rabbitMQ;
  }
}

export abstract class ConsumerQueue extends Queue {
  consume(
    consumeCallback: (
      msg: ConsumeMessage,
      acknowledge: () => Promise<void>,
    ) => void,
    options?: Options.Consume,
  ) {
    const callback = (msg: ConsumeMessage | null) => {
      if (!msg) {
        console.warn(`Received null message for queue: ${this.queueName}`);
        return;
      }
      const acknowledge = () => this.rabbitMQ.acknowledgeMessage(msg);

      consumeCallback(msg, acknowledge);
    };
    this.rabbitMQ.addConsumer(this.queueName, callback, options);
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
