import pika
from pika.adapters.blocking_connection import BlockingChannel

import time
import signal
import sys
import json

from env import rbmq_host, rbmq_port
from .analyzer import analyze

RETRY_INTERVAL = 5  # seconds

consumer_name = "nlp-pre-process-req"
producer_name = "nlp-pre-process-res"

connection = None
channel = None

stop_triggered = False


def signal_handler(sig, _frame):
    print(
        f"Received {signal.Signals(sig).name}, closing connection and exiting...")
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

        print(f"Declaring consumer queue '{consumer_name}'...")
        channel.queue_declare(queue=consumer_name, durable=True)
        print(f"Consumer queue '{consumer_name}' declared.")

        print(f"Declaring producer queue '{producer_name}'...")
        channel.queue_declare(queue=producer_name, durable=True)
        print(f"Producer queue '{producer_name}' declared.")

        def callback(ch: BlockingChannel, method, properties, body):
            print("Message Received. Processing...")
            inputStr = body.decode('utf-8')
            inputDict = json.loads(inputStr)
            book_page_id = inputDict.get("book_page_id", None)

            try:
                res = {
                    "success": True,
                    "result": analyze(
                        content=inputDict.get("content", ""),
                        prev_content=inputDict.get("prev_content"),
                        language=inputDict.get("language", "en"),
                        accum_characters=inputDict.get(
                            "accumulated_characters", [])
                    )
                }
            except Exception as e:
                print(f"Error analyzing content: {e}")
                res = {"success": False}

            res["book_page_id"] = book_page_id

            res = json.dumps(res, ensure_ascii=False).encode('utf-8')

            print("Publishing response to producer queue...")

            ch.basic_publish(
                exchange='',
                routing_key=producer_name,
                body=res,
                properties=pika.BasicProperties(
                    delivery_mode=2,  # Make message persistent
                )
            )
            ch.basic_ack(delivery_tag=method.delivery_tag)

        channel.basic_consume(
            queue=consumer_name, on_message_callback=callback, auto_ack=False
        )

        print(f"Waiting for messages in queue '{consumer_name}'...")
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
