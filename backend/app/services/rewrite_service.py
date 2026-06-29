from typing import AsyncGenerator

from ..ai.ollama_client import OllamaClient
from ..prompts.rewrite import build_rewrite_prompt
from ..models.ai import RewriteRequest


class RewriteService:
    def __init__(self, client: OllamaClient | None = None) -> None:
        self.client = client or OllamaClient()

    async def stream_rewrite(self, request: RewriteRequest) -> AsyncGenerator[str, None]:
        prompt = build_rewrite_prompt(request.text, request.element_type, request.instruction)
        messages = [
            {'role': 'system', 'content': 'You are a helpful screenplay editor.'},
            {'role': 'user', 'content': prompt},
        ]
        async for token in self.client.stream_chat(messages):
            yield token
