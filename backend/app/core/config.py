from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    OLLAMA_BASE_URL: str = 'http://localhost:11434'
    MODEL: str = 'qwen2.5:7b'


settings = Settings()
