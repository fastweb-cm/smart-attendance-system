# BaseSettings allows you to auto read env variables
# and map them into python class attributes.
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DB_HOST: str
    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str

    # The inner Config class tells pydantic where to read the env variables from
    class Config:
        # Load variables from file named ".env"
        env_file = ".env"


# Create a global instance of Settings class
settings = Settings()
