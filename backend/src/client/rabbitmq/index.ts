import amqp from "amqplib";
import { Queue } from "./queues/abstract";

const RETRY_INTERVAL = 5000;

export class RabbitMQ {
  private connectionPromise: Promise<amqp.ChannelModel | null> =
    Promise.resolve(null);
  private channelPromise: Promise<amqp.Channel | null> = Promise.resolve(null);

  private disconnectTriggered: boolean = false;

  private queues: Queue[] = [];
  private consumers: [
    queueName: string,
    consumeCallback: (msg: amqp.ConsumeMessage | null) => void,
    options?: amqp.Options.Consume,
  ][] = [];

  private host: string;
  private port: string;

  constructor(host: string, port: string) {
    this.host = host;
    this.port = port;
  }

  addQueue(queue: Queue) {
    this.queues.push(queue);
  }

  addConsumer(
    queueName: string,
    consumeCallback: (msg: amqp.ConsumeMessage | null) => void,
    options?: amqp.Options.Consume,
  ) {
    this.consumers.push([queueName, consumeCallback, options]);
  }

  async sendToQueue(
    queueName: string,
    message: string,
    options?: amqp.Options.Publish,
  ) {
    const channel = await this.channelPromise;
    if (!channel) {
      throw new Error("Channel is not initialized. Call connect() first.");
    }

    channel.sendToQueue(queueName, Buffer.from(message), options);
  }

  async acknowledgeMessage(
    message: amqp.ConsumeMessage,
    allUpTo: boolean = false,
  ): Promise<void> {
    const channel = await this.channelPromise;
    if (!channel) {
      throw new Error("Channel is not initialized. Call connect() first.");
    }

    channel.ack(message, allUpTo);
  }

  private async resolveChannelModel(
    resolve: (channelModel: amqp.ChannelModel | null) => void,
  ) {
    if (this.disconnectTriggered) {
      resolve(null);
    }

    try {
      const connection = await amqp.connect(`amqp://${this.host}:${this.port}`);

      if (this.disconnectTriggered) {
        try {
          await connection.close();
          resolve(null);
        } catch (error) {
          console.error("Failed to close RabbitMQ connection:", error);
          resolve(null);
        }
        return;
      }

      connection.on("error", (err) => {
        if (this.disconnectTriggered) {
          return;
        }
        console.error("Connection error occurred. Reconnecting...", err);
        this.connectionPromise = new Promise<amqp.ChannelModel | null>(
          (resolve) => {
            this.resolveChannelModel(resolve);
          },
        );
      });

      connection.on("close", () => {
        if (this.disconnectTriggered) {
          return;
        }
        console.error("Connection closed unexpectedly. Reconnecting...");
        this.connectionPromise = new Promise<amqp.ChannelModel | null>(
          (resolve) => {
            this.resolveChannelModel(resolve);
          },
        );
      });

      resolve(connection);

      console.log("RabbitMQ connection established successfully.");
    } catch (err) {
      if (this.disconnectTriggered) {
        resolve(null);
        return;
      }

      console.error(
        `failed to connect to RabbitMQ at ${this.host}:${this.port}`,
        err,
      );
      console.error(`Retrying in ${RETRY_INTERVAL} ms...`);
      setTimeout(() => {
        this.resolveChannelModel(resolve);
      }, RETRY_INTERVAL);
    }
  }

  private async resolveChannel(
    resolve: (channel: amqp.Channel | null) => void,
  ) {
    if (this.disconnectTriggered) {
      resolve(null);
      return;
    }

    const connection = await this.connectionPromise;

    if (!connection) {
      resolve(null);
      return;
    }

    try {
      const channel = await connection.createChannel();

      for (const queue of this.queues) {
        await channel.assertQueue(queue.queueName, { durable: true });
        console.log(`Queue ${queue.queueName} asserted successfully.`);
      }

      for (const [queueName, consumeCallback, options] of this.consumers) {
        await channel.consume(queueName, consumeCallback, options);
        console.log(`Consumer for queue ${queueName} registered successfully.`);
      }

      if (this.disconnectTriggered) {
        try {
          await channel.close();
          resolve(null);
        } catch (error) {
          console.error("Failed to close RabbitMQ channel:", error);
          resolve(null);
        }
        return;
      }

      channel.on("error", () => {
        if (this.disconnectTriggered) {
          return;
        }
        console.error("Channel error occurred. Reconnecting...");
        this.channelPromise = new Promise<amqp.Channel | null>((resolve) => {
          this.resolveChannel(resolve);
        });
      });
      channel.on("close", () => {
        if (this.disconnectTriggered) {
          return;
        }
        console.error("Channel closed unexpectedly. Reconnecting...");
        this.channelPromise = new Promise<amqp.Channel | null>((resolve) => {
          this.resolveChannel(resolve);
        });
      });

      resolve(channel);

      console.log("Channel created successfully.");
    } catch (err) {
      if (this.disconnectTriggered) {
        resolve(null);
        return;
      }

      console.error("Failed to create channel:", err);
      console.error(`Retrying in ${RETRY_INTERVAL} ms...`);

      setTimeout(() => {
        this.resolveChannel(resolve);
      }, RETRY_INTERVAL);
    }
  }

  async initialize() {
    console.log(`Connecting to RabbitMQ at ${this.host}:${this.port}...`);

    this.connectionPromise = new Promise<amqp.ChannelModel | null>(
      (resolve) => {
        this.resolveChannelModel(resolve);
      },
    );
    this.channelPromise = new Promise<amqp.Channel | null>((resolve) => {
      this.resolveChannel(resolve);
    });

    await this.connectionPromise;
    await this.channelPromise;
  }

  async close(): Promise<void> {
    console.log("Disconnecting from RabbitMQ...");
    this.disconnectTriggered = true;

    const channel = await this.channelPromise;

    if (channel) {
      this.channelPromise = Promise.resolve(null);
      try {
        await channel.close();
      } catch (error) {
        console.error("Failed to close RabbitMQ channel:", error);
      }
    }

    const connection = await this.connectionPromise;
    if (connection) {
      this.connectionPromise = Promise.resolve(null);
      try {
        await connection.close();
      } catch (error) {
        console.error("Failed to close RabbitMQ connection:", error);
      }
    }

    console.log("Disconnected from RabbitMQ.");
  }
}
