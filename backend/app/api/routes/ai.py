from fastapi import APIRouter, Depends, HTTPException

from ..deps import get_notes_service
from ...core.logging import logger
from ...models.ai import NotesRequest, NotesResponse
from ...services.notes_service import NotesService

router = APIRouter()


@router.post('/notes', response_model=NotesResponse)
async def scene_notes(
    notes_request: NotesRequest,
    service: NotesService = Depends(get_notes_service),
) -> NotesResponse:
    """Notes or proofreading for one scene. Recommendations only - the AI never rewrites lines."""
    try:
        return await service.scene_notes(notes_request)
    except Exception as exc:
        logger.error('Notes request failed', exc_info=exc)
        raise HTTPException(status_code=502, detail='AI backend unavailable') from exc
