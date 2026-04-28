import json
import os
from datetime import datetime, timezone
# BaseSettings allows you to auto read env variables
# and map them into python class attributes.
from pydantic_settings import BaseSettings

BASE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)

CONFIG_FILE_PATH = os.path.join(BASE_DIR, "sync_config.json")


class Settings(BaseSettings):
    DB_HOST: str
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str
    CENTRAL_API_URL: str

    # The inner Config class tells pydantic where to read the env variables from
    class Config:
        # Load variables from file named ".env"
        env_file = ".env"


# Create a global instance of Settings class
settings = Settings()


def get_sync_config():
    # Default values
    default_config = {
        "last_sync_timestamp": "2000-01-01 00:00:00",
        "terminal_id": 9
    }

    if os.path.exists(CONFIG_FILE_PATH):
        try:
            with open(CONFIG_FILE_PATH, 'r') as f:
                data = json.load(f)
                return {
                    "last_sync_timestamp": data.get("last_sync_timestamp", default_config["last_sync_timestamp"]),
                    "terminal_id": data.get("terminal_id", 0)
                }
        except json.JSONDecodeError:
            return default_config

    return default_config


def update_last_sync_time(timestamp=None):
    if timestamp is None:
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    with open(CONFIG_FILE_PATH, 'w') as f:
        json.dump({'last_sync_time': timestamp}, f)


def update_terminal_id(terminal_id):
    config = get_sync_config()
    config['terminal_id'] = terminal_id
    with open(CONFIG_FILE_PATH, 'w') as f:
        json.dump(config, f)
