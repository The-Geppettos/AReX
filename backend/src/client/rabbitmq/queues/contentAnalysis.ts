import { Queue } from "./abstract";

export class ContentAnalysisQueue extends Queue {
  queueName = "content-analysis";

  async sendMessage(
    pageId: string,
    content: string,
    prevContent: string | null = null,
  ) {
    const message = JSON.stringify({
      pageId,
      content,
      prevContent,
    });
    await this.rabbitMQ.sendToQueue(this.queueName, message, {
      persistent: true,
    });
  }
}
