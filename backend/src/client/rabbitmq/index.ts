import amqp from "amqplib";
import { Queue } from "./queues/abstract";

export class RabbitMQ {
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;

  private queues: Queue[] = [];

  addQueue(queue: Queue) {
    this.queues.push(queue);
  }

  async sendToQueue(
    queueName: string,
    message: string,
    options?: amqp.Options.Publish,
  ) {
    if (!this.channel) {
      throw new Error("Channel is not initialized. Call connect() first.");
    }

    this.channel.sendToQueue(queueName, Buffer.from(message), options);
  }

  async consumeMessage(
    queueName: string,
    consumeCallback: (msg: amqp.ConsumeMessage | null) => void,
    options?: amqp.Options.Consume,
  ): Promise<void> {
    if (!this.channel) {
      throw new Error("Channel is not initialized. Call connect() first.");
    }

    await this.channel.consume(queueName, consumeCallback, options);
  }

  async acknowledgeMessage(
    message: amqp.ConsumeMessage,
    allUpTo: boolean = false,
  ): Promise<void> {
    if (!this.channel) {
      throw new Error("Channel is not initialized. Call connect() first.");
    }

    this.channel.ack(message, allUpTo);
  }

  async connect() {
    const host = process.env.RABBITMQ_HOST || "localhost";
    const port = process.env.RABBITMQ_PORT || "5672";

    console.log(`Connecting to RabbitMQ at ${host}:${port}...`);

    this.connection = await amqp.connect(`amqp://${host}:${port}`);
    this.channel = await this.connection.createChannel();

    for (const queue of this.queues) {
      await this.channel.assertQueue(queue.queueName, {
        durable: true,
      });
    }

    console.log("RabbitMQ connection established successfully.");
  }

  async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }
}
