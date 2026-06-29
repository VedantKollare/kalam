from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse

from ..models.ai import RewriteRequest
from ..services.rewrite_service import RewriteService
from ..core.logging import logger

router = APIRouter()


def get_rewrite_service() -> RewriteService:
    return RewriteService()


@router.post('/rewrite')
async def rewrite_block(
    request: Request,
    rewrite_request: RewriteRequest,
    service: RewriteService = Depends(get_rewrite_service),
):
    async def token_stream():
        try:
            async for token in service.stream_rewrite(rewrite_request):
                yield token
        except Exception as exc:
            logger.error('Rewrite streaming failed', exc_info=exc)
            raise HTTPException(status_code=502, detail='AI backend unavailable')

    return StreamingResponse(token_stream(), media_type='text/plain')
