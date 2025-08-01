import os
from pathlib import Path
from dotenv import load_dotenv


proj_dir = os.path.join(os.path.dirname(__file__))
env_path = Path(os.path.join(proj_dir, "../.env")).resolve()

load_dotenv(env_path)

rbmq_host = os.getenv("RABBITMQ_HOST")
rbmq_host = rbmq_host if rbmq_host is not None else "localhost"

rbmq_port = os.getenv("RABBITMQ_PORT")
rbmq_port = rbmq_port if rbmq_port is not None else "5672"

if __name__ == "__main__":
    print(f"RabbitMQ Host: {rbmq_host}")
    print(f"RabbitMQ Port: {rbmq_port}")
    print(f"Project Directory: {proj_dir}")
    print(f"Environment Path: {env_path}")
