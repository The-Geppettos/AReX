import subprocess
import sys
import os
import signal
import threading
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import time
import signal

FORCE_EXIT_TIMEOUT = 5
RESTART_DEBOUNCE = 0.5
LOG_PREFIX = "[dev]"

class DevHandler(FileSystemEventHandler):
    def __init__(self, command: list):
        self.command = command
        self.restart_debounce_timer = None
        self.lock = threading.Lock()
        self.start_process()

    def stop_process(self):
        if self.process.poll() is None:
            try :
                self.process.send_signal(signal.SIGTERM)
                self.process.wait(FORCE_EXIT_TIMEOUT)
            except subprocess.TimeoutExpired:
                print(f"{LOG_PREFIX} Process did not stop in time. Force killing...")
                self.process.kill()

    def start_process(self):
        self.process = subprocess.Popen(self.command, start_new_session=True)

    def handle_event(self, event):
        if not event.src_path.endswith('.py'):
            return

        def restart_debounce_callback():
            print(f"{LOG_PREFIX} File change detected. restarting process...")
            self.stop_process()
            self.start_process()

        with self.lock:
            if self.restart_debounce_timer is not None:
                self.restart_debounce_timer.cancel()
            self.restart_debounce_timer = threading.Timer(
                RESTART_DEBOUNCE,
                restart_debounce_callback
            )
            self.restart_debounce_timer.start()

    def on_created(self, event):
        self.handle_event(event)

    def on_modified(self, event):
        self.handle_event(event)


def main():
    path = os.path.join(os.path.dirname(__file__), "src")
    command = [sys.executable, "-u", "-m", "src.main"] 
    stop_triggered = False

    event_handler = DevHandler(command)
    observer = Observer()
    observer.schedule(event_handler, str(path), recursive=True)
    observer.start()

    def stop():
        nonlocal stop_triggered
        stop_triggered = True
        observer.stop()
        event_handler.stop_process()

    def signal_handler(_sig, _frame):
        print(f"{LOG_PREFIX} Stopping development server...")
        stop()

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    print(f"{LOG_PREFIX} Starting development server...")

    try:
        while not stop_triggered:
            time.sleep(1)
    except Exception as e:
        print(f"{LOG_PREFIX} An error occurred: {e}")
        stop()
    observer.join()

if __name__ == "__main__":
    main()
