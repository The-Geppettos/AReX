import pika

from dotenv import load_dotenv
import os
from pathlib import Path

env_path = Path(
    os.path.join(os.path.dirname(__file__), "../../.env")).resolve()

load_dotenv(env_path)

queue_name = "content-analysis"

rbmq_host = os.getenv("RABBITMQ_HOST")
rbmq_host = rbmq_host if rbmq_host is not None else "localhost"

rbmq_port = os.getenv("RABBITMQ_PORT")
rbmq_port = rbmq_port if rbmq_port is not None else "5672"

rabbitmq_connection = pika.BlockingConnection(
    pika.ConnectionParameters(
        host=rbmq_host,
        port=rbmq_port,
    )
)

rabbitmq_channel = rabbitmq_connection.channel()

result = rabbitmq_channel.queue_declare(queue=queue_name, durable=True)

def callback(ch, method, properties, body):
    print(f"Received")
    print(type(body))
    ch.basic_ack(delivery_tag=method.delivery_tag)

rabbitmq_channel.basic_consume(
    queue=queue_name, on_message_callback=callback, auto_ack=False
)

print("Waiting for messages. To exit press CTRL+C")
rabbitmq_channel.start_consuming()
