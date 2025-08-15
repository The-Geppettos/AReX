

import pika
from pika.adapters.blocking_connection import BlockingChannel

import time
import signal
import sys
import json

from env import rbmq_host, rbmq_port
from .db_clients.maindb_client import MainDBClient
from .agent import agent_executor

RETRY_INTERVAL = 5  # seconds

consumer_name = "scene-enhance-req"

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

        print(f"Declaring consumer queue '{consumer_name}'...")
        channel.queue_declare(queue=consumer_name, durable=True)
        print(f"Consumer queue '{consumer_name}' declared.")

        def callback(ch: BlockingChannel, method, properties, body):
            print("Message Received. Processing...")
            inputStr = body.decode('utf-8')
            inputDict = json.loads(inputStr)
            scene_id = inputDict.get("scene_id", None)
            scene_text = inputDict.get("scene_text", None)

            if scene_id is None or scene_text is None:
                print("Error: scene_id and scene_text are required")
                ch.basic_ack(delivery_tag=method.delivery_tag)
                return

            try:
                summary_result = agent_executor.invoke({"input": f"Summarize the following scene:\n\n{scene_text}"})
                summary = summary_result["output"]

                color_result = agent_executor.invoke({"input": f"Get the color for the following scene:\n\n{scene_text}"})
                color = color_result["output"]

                db_client = MainDBClient()
                db_client.execute(
                    "UPDATE book_scenes SET summary = %s, color = %s WHERE id = %s",
                    (summary, color, scene_id)
                )
                db_client.close()

            except Exception as e:
                print(f"Error processing scene {scene_id}: {e}")

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

