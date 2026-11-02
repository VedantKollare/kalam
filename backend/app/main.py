from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes.ai import router as ai_router
from .core.logging import logger

app = FastAPI(
    title='Kalam AI Backend',
    description='Local script-notes service for Kalam. Gives recommendations; never rewrites the script.',
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173'],
    allow_methods=['POST', 'GET', 'OPTIONS'],
    allow_headers=['*'],
)

app.include_router(ai_router, prefix='/api/ai')


@app.get('/health')
def health():
    return {'status': 'ok'}
