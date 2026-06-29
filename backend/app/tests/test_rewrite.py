from httpx import Client

from app.main import app


class DummyOllamaClient:
    def __init__(self, *args, **kwargs):
        pass

    async def stream_chat(self, messages):
        yield 'Re'
        yield 'writ'
        yield 'ten.'


def test_rewrite_streaming_returns_tokens(monkeypatch):
    monkeypatch.setattr('app.services.rewrite_service.OllamaClient', DummyOllamaClient)

    with Client(app=app, base_url='http://testserver') as client:
        response = client.post('/api/ai/rewrite', json={
            'text': 'The man enters.',
            'element_type': 'action',
            'instruction': 'Make it more vivid.',
        })

        assert response.status_code == 200
        assert 'Rewritten.' in response.text or 'Rewrit' in response.text
