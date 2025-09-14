import amqp from "amqplib";
import { ConsumerQueue, Queue } from "./queues/abstract";

const RETRY_INTERVAL = 5000;

export type ConsumeCallback = (
  msg: amqp.ConsumeMessage,
  acknowledge: () => void,
) => void;

export class MessageBroker {
  private connectionPromise: Promise<amqp.ChannelModel | null> =
    Promise.resolve(null);
  private channelPromise: Promise<amqp.Channel | null> = Promise.resolve(null);

  private closeTriggered: boolean = false;

  private queues: Queue[] = [];
  private consumers: [
    queueName: string,
    consumeCallback: ConsumeCallback,
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
    consumeCallback: ConsumeCallback,
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

  private async resolveChannelModel(
    resolve: (channelModel: amqp.ChannelModel | null) => void,
  ) {
    if (this.closeTriggered) {
      resolve(null);
    }

    try {
      const connection = await amqp.connect(`amqp://${this.host}:${this.port}`);

      if (this.closeTriggered) {
        try {
          await connection.close();
          resolve(null);
        } catch (error) {
          console.error(
            "Failed to close MessageBroker(RabbitMQ) connection:",
            error,
          );
          resolve(null);
        }
        return;
      }

      connection.on("error", (err) => {
        if (this.closeTriggered) {
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
        if (this.closeTriggered) {
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

      console.info("MessageBroker connection established successfully.");
    } catch (err) {
      if (this.closeTriggered) {
        resolve(null);
        return;
      }

      console.error(
        `failed to connect to MessageBroker(RabbitMQ) at ${this.host}:${this.port}`,
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
    if (this.closeTriggered) {
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
        console.info(`Queue ${queue.queueName} asserted successfully.`);
      }

      for (const [queueName, consumeCallback, options] of this.consumers) {
        const callback = (msg: amqp.ConsumeMessage | null) => {
          if (!msg) {
            console.warn(`Received null message for queue: ${queueName}`);
            return;
          }
          const acknowledge = () => channel.ack(msg);
          consumeCallback(msg, acknowledge);
        };
        await channel.consume(queueName, callback, options);
        console.info(
          `Consumer for queue ${queueName} registered successfully.`,
        );
      }

      if (this.closeTriggered) {
        try {
          await channel.close();
          resolve(null);
        } catch (error) {
          console.error(
            "Failed to close MessageBroker(RabbitMQ) channel:",
            error,
          );
          resolve(null);
        }
        return;
      }

      channel.on("error", () => {
        if (this.closeTriggered) {
          return;
        }
        console.error("Channel error occurred. Reconnecting...");
        this.channelPromise = new Promise<amqp.Channel | null>((resolve) => {
          this.resolveChannel(resolve);
        });
      });
      channel.on("close", () => {
        if (this.closeTriggered) {
          return;
        }
        console.error("Channel closed unexpectedly. Reconnecting...");
        this.channelPromise = new Promise<amqp.Channel | null>((resolve) => {
          this.resolveChannel(resolve);
        });
      });

      resolve(channel);

      console.info("Channel created successfully.");
    } catch (err) {
      if (this.closeTriggered) {
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
    console.info(
      `Connecting to MessageBroker(RabbitMQ) at ${this.host}:${this.port}...`,
    );

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
    console.info("Disconnecting from MessageBroker(RabbitMQ)...");
    this.closeTriggered = true;

    const channel = await this.channelPromise;

    if (channel) {
      this.channelPromise = Promise.resolve(null);
      try {
        await channel.close();
      } catch (error) {
        console.error(
          "Failed to close MessageBroker(RabbitMQ) channel:",
          error,
        );
      }
    }

    const connection = await this.connectionPromise;
    if (connection) {
      this.connectionPromise = Promise.resolve(null);
      try {
        await connection.close();
      } catch (error) {
        console.error(
          "Failed to close MessageBroker(RabbitMQ) connection:",
          error,
        );
      }
    }

    console.info("Disconnected from MessageBroker(RabbitMQ).");
  }
}
