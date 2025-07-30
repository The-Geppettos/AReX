import subprocess
import sys
import os
import signal
import threading
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import time

TIMEOUT = 5
DEBOUNCE_SECONDS = 0.5

class DevHandler(FileSystemEventHandler):
    def __init__(self, command: list, timeout: float, debounce_seconds: float):
        self.command = command
        self.debounce_seconds = debounce_seconds
        self.debounce_timer = None
        self.lock = threading.Lock()
        self.timeout = timeout
        self.start_process()

    def stop_process(self):
        if self.process.poll() is None:
            try :
                self.process.send_signal(signal.SIGINT)
                self.process.wait(self.timeout)
            except subprocess.TimeoutExpired:
                print("process did not stop in time, killing it")
                self.process.kill()

    def start_process(self):
        self.process = subprocess.Popen(self.command)

    def handle_event(self, event):
        if not event.src_path.endswith('.py'):
            return

        def debounce_callback():
            print("File change detected. restarting process...")
            self.stop_process()
            self.start_process()

        with self.lock:
            if self.debounce_timer is not None:
                self.debounce_timer.cancel()
            self.debounce_timer = threading.Timer(
                self.debounce_seconds,
                debounce_callback
            )
            self.debounce_timer.start()

    def on_created(self, event):
        self.handle_event(event)

    def on_modified(self, event):
        self.handle_event(event)


def main():
    path = os.path.join(os.path.dirname(__file__),
                        "src")

    command = [sys.executable, "-u", "-m", "src.main"] 

    event_handler = DevHandler(command, TIMEOUT, DEBOUNCE_SECONDS)

    observer = Observer()
    observer.schedule(event_handler, str(path), recursive=True)
    observer.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        event_handler.stop_process()
    observer.join()

if __name__ == "__main__":
    main()
