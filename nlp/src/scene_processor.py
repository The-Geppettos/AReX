
import pika
from pika.adapters.blocking_connection import BlockingChannel

import time
import signal
import sys
import json
import pika

from env import rbmq_host, rbmq_port
from .db_clients.maindb_client import MainDBClient
import openai
import os

openai.api_key = os.environ.get("OPENAI_API_KEY")

RETRY_INTERVAL = 5  # seconds

consumer_name = "scene-process-req"

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

        from .llm_utils import detect_scenes

producer_name = "scene-enhance-req"

def callback(ch: BlockingChannel, method, properties, body):
            print("Message Received. Processing...")
            inputStr = body.decode('utf-8')
            inputDict = json.loads(inputStr)
            book_id = inputDict.get("book_id", None)

            if book_id is None:
                print("Error: book_id is missing from the message")
                ch.basic_ack(delivery_tag=method.delivery_tag)
                return

            try:
                db_client = MainDBClient()
                chapters = db_client.get_chapters_by_book_id(book_id)
                all_pages = db_client.query("SELECT content, page_number, chapter_id FROM book_pages WHERE book_id = %s ORDER BY page_number ASC", (book_id,))
                all_scene_breaks = []
                
                if chapters and all_pages:
                    for chapter in chapters:
                        pages = [p for p in all_pages if p['chapter_id'] == chapter['id']]
                        if pages:
                            chapter_text = "".join([page['content'] for page in pages])
                            scene_breaks = detect_scenes(chapter_text)
                            
                            # Adjust page numbers to be relative to the book
                            first_page_of_chapter = pages[0]['page_number']
                            for i in range(len(scene_breaks)):
                                scene_breaks[i] += first_page_of_chapter - 1

                            all_scene_breaks.extend(scene_breaks)

                    # Remove duplicates and sort
                    all_scene_breaks = sorted(list(set(all_scene_breaks)))

                    for i in range(len(all_scene_breaks)):
                        start_page = all_scene_breaks[i]
                        end_page = all_scene_breaks[i+1] - 1 if i + 1 < len(all_scene_breaks) else len(all_pages)
                        
                        scene_pages = [p['content'] for p in all_pages if start_page <= p['page_number'] <= end_page]
                        scene_text = "".join(scene_pages)
                        
                        # Create the scene in the database
                        db_client.execute(
                            "INSERT INTO book_scenes (book_id, start_page_number, end_page_number) VALUES (%s, %s, %s) RETURNING id",
                            (book_id, start_page, end_page)
                        )
                        scene_id = db_client.query("SELECT id FROM book_scenes WHERE book_id = %s AND start_page_number = %s AND end_page_number = %s", (book_id, start_page, end_page))[0]['id']

                        # Send a message to the scene enhancer queue
                        message = {"scene_id": scene_id, "scene_text": scene_text}
                        ch.basic_publish(
                            exchange='',
                            routing_key=producer_name,
                            body=json.dumps(message, ensure_ascii=False).encode('utf-8'),
                            properties=pika.BasicProperties(
                                delivery_mode=2,  # Make message persistent
                            )
                        )

            except Exception as e:
                print(f"Error processing book {book_id}: {e}")
            finally:
                if 'db_client' in locals() and db_client.conn:
                    db_client.close()

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
