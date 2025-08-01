import type { RabbitMQ } from "..";

export abstract class Queue {
  abstract queueName: string;

  protected rabbitMQ: RabbitMQ;

  constructor(rabbitMQ: RabbitMQ) {
    rabbitMQ.addQueue(this);
    this.rabbitMQ = rabbitMQ;
  }
}
