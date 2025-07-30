import pika

import time
import signal
import sys

from env import rbmq_host, rbmq_port

RETRY_INTERVAL = 5  # seconds

queue_name = "content-analysis"

connection = None
channel = None

stop_triggered = False

def signal_handler(sig, _frame):
    print(f"Received {sig}, closing connection and exiting...")
    global connection, channel, stop_triggered

    stop_triggered = True

    if channel is not None and channel.is_open:
        print("Closing channel...")
        try:
            channel.close()
        except Exception as e:
            print(f"Error closing channel: {e}")

    if connection is not None and connection.is_open:
        print("Closing connection...")
        try:
            connection.close()
        except Exception as e:
            print(f"Error closing connection: {e}")
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

while not stop_triggered:
    try:
        print(f"Connecting to RabbitMQ at {rbmq_host}:{rbmq_port}...")
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(host=rbmq_host, port=rbmq_port)
        )
        print("Connected to RabbitMQ.")

        print("Creating channel...")
        channel = connection.channel()
        print("Channel created.")

        print(f"Declaring queue '{queue_name}'...")
        channel.queue_declare(queue=queue_name, durable=True)
        print(f"Queue '{queue_name}' declared.")

        def callback(ch, method, properties, body):
            print(f"Received")
            # Here you can process the message
            ch.basic_ack(delivery_tag=method.delivery_tag)

        channel.basic_consume(
            queue=queue_name, on_message_callback=callback, auto_ack=False
        )

        print(f"Waiting for messages in queue '{queue_name}'...")
        channel.start_consuming()

    except Exception as error:
        if stop_triggered:
            break

        if channel is not None:
            print("Closing channel...")
            channel_ = channel
            channel = None
            if channel_.is_open:
                try:
                    channel_.close()
                except Exception as e:
                    print(f"Error closing channel: {e}")

        if connection is not None:
            print("Closing connection...")
            connection_ = connection
            connection = None
            if connection_.is_open:
                try:
                    connection_.close()
                except Exception as e:
                    print(f"Error closing connection: {e}")

        if stop_triggered:
            break
        print(f"Error: {error}. Retrying in {RETRY_INTERVAL} seconds...")
        time.sleep(RETRY_INTERVAL)
