import json

from pydantic import ValidationError

from ..ai.ollama_client import OllamaClient
from ..core.logging import logger
from ..models.ai import Note, NotesRequest, NotesResponse
from ..prompts.notes import build_notes_messages, build_proofread_messages

MAX_NOTES = 8
MAX_PROOFREAD = 15


class NotesService:
    """Asks the model for script notes on one scene and validates what comes back."""

    def __init__(self, client: OllamaClient | None = None) -> None:
        self.client = client or OllamaClient()

    async def scene_notes(self, request: NotesRequest) -> NotesResponse:
        lines = [(b.id, b.type, b.text) for b in request.blocks if b.text.strip()]
        if request.mode == 'proofread':
            messages = build_proofread_messages(lines, request.language, MAX_PROOFREAD)
        else:
            messages = build_notes_messages(lines, request.language, list(request.focus), MAX_NOTES)
        raw = await self.client.chat_json(messages)
        limit = MAX_PROOFREAD if request.mode == 'proofread' else MAX_NOTES
        return NotesResponse(notes=self._parse(raw, {b.id for b in request.blocks})[:limit])

    def _parse(self, raw: str, known_ids: set[str]) -> list[Note]:
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            logger.warning('Model returned non-JSON notes')
            return []
        items = data.get('notes', []) if isinstance(data, dict) else []
        notes: list[Note] = []
        for item in items if isinstance(items, list) else []:
            try:
                note = Note.model_validate(item)
            except ValidationError:
                continue
            # A note that points at a line we never sent is re-anchored to the scene.
            if note.block_id not in known_ids:
                note.block_id = None
            notes.append(note)
        return notes
