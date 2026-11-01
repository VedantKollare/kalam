import json
from typing import AsyncGenerator

import httpx

from ..core.config import settings
from ..core.logging import logger


class OllamaClient:
    def __init__(self, base_url: str = settings.OLLAMA_BASE_URL, model: str = settings.MODEL) -> None:
        self.base_url = base_url.rstrip('/')
        self.model = model

    async def chat_json(self, messages: list[dict], timeout: float = 120.0) -> str:
        """One non-streamed chat turn constrained to JSON output; returns the raw JSON text."""
        payload = {
            'model': self.model,
            'messages': messages,
            'stream': False,
            'format': 'json',
            'options': {'temperature': 0.3},
        }
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(f'{self.base_url}/api/chat', json=payload)
            response.raise_for_status()
            data = response.json()
        return (data.get('message') or {}).get('content') or ''

    async def stream_chat(self, messages: list[dict]) -> AsyncGenerator[str, None]:
        url = f'{self.base_url}/api/chat'
        payload = {
            'model': self.model,
            'messages': messages,
            'stream': True,
        }

        async with httpx.AsyncClient(timeout=None) as client:
            try:
                async with client.stream('POST', url, json=payload, timeout=None) as response:
                    response.raise_for_status()
                    async for raw_line in response.aiter_lines():
                        if not raw_line:
                            continue

                        line = raw_line.strip()
                        if line.startswith('data:'):
                            line = line[len('data:'):].strip()
                        if not line or line == '[DONE]':
                            continue

                        try:
                            data = json.loads(line)
                        except json.JSONDecodeError:
                            logger.warning('Skipping non-JSON Ollama stream line', extra={'line': line})
                            continue

                        content = self._extract_content(data)
                        if content:
                            yield content
            except Exception as exc:
                logger.error('Ollama request failed', exc_info=exc)
                raise

    def _extract_content(self, data: dict) -> str | None:
        choice = None
        if isinstance(data.get('choices'), list) and data['choices']:
            choice = data['choices'][0]
        if choice:
            delta = choice.get('delta') or choice.get('message')
            if isinstance(delta, dict):
                if 'content' in delta:
                    return delta['content']
                if 'text' in delta:
                    return delta['text']
        if isinstance(data.get('response'), str):
            return data['response']
        return None
