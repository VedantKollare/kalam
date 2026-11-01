import json

from fastapi.testclient import TestClient

from app.api.deps import get_notes_service
from app.main import app
from app.prompts.notes import build_notes_messages, build_proofread_messages
from app.services.notes_service import NotesService

SCENE = {
    'language': 'english',
    'blocks': [
        {'id': 'h1', 'type': 'scene_heading', 'text': 'INT. KITCHEN - NIGHT'},
        {'id': 'a1', 'type': 'action', 'text': 'Meera stares at the phone.'},
        {'id': 'c1', 'type': 'character', 'text': 'MEERA'},
        {'id': 'd1', 'type': 'dialogue', 'text': 'He is not coming.'},
    ],
}


class FakeClient:
    def __init__(self, reply: str) -> None:
        self.reply = reply
        self.messages: list[dict] = []

    async def chat_json(self, messages):
        self.messages = messages
        return self.reply


def client_with(reply: str) -> tuple[TestClient, FakeClient]:
    fake = FakeClient(reply)
    app.dependency_overrides[get_notes_service] = lambda: NotesService(client=fake)
    return TestClient(app), fake


def teardown_function():
    app.dependency_overrides.clear()


def test_returns_validated_notes():
    reply = json.dumps({'notes': [
        {'block_id': 'd1', 'category': 'dialogue', 'note': 'The line states the subtext outright.'},
        {'block_id': None, 'category': 'pacing', 'note': 'The scene ends before tension builds.'},
    ]})
    client, _ = client_with(reply)
    res = client.post('/api/ai/notes', json=SCENE)
    assert res.status_code == 200
    notes = res.json()['notes']
    assert [n['block_id'] for n in notes] == ['d1', None]
    assert notes[0]['category'] == 'dialogue'


def test_drops_malformed_notes_and_unknown_ids():
    reply = json.dumps({'notes': [
        {'block_id': 'zzz', 'category': 'clarity', 'note': 'Unclear who enters.'},
        {'block_id': 'a1', 'category': 'not-a-category', 'note': 'x'},
        {'block_id': 'a1', 'category': 'structure'},
    ]})
    client, _ = client_with(reply)
    notes = client.post('/api/ai/notes', json=SCENE).json()['notes']
    assert notes == [{'block_id': None, 'category': 'clarity', 'note': 'Unclear who enters.'}]


def test_non_json_reply_gives_no_notes():
    client, _ = client_with('sorry, I cannot do that')
    assert client.post('/api/ai/notes', json=SCENE).json() == {'notes': []}


def test_backend_failure_is_a_502():
    class Broken:
        async def chat_json(self, messages):
            raise ConnectionError('ollama down')

    app.dependency_overrides[get_notes_service] = lambda: NotesService(client=Broken())
    res = TestClient(app).post('/api/ai/notes', json=SCENE)
    assert res.status_code == 502


def test_prompt_forbids_rewriting():
    system, user = build_notes_messages([('d1', 'dialogue', 'Hi')], 'hindi', ['dialogue'], 5)
    assert 'NEVER rewrite' in system['content']
    assert '[d1] DIALOGUE: Hi' in user['content']
    assert 'Focus on: dialogue.' in user['content']


def test_proofread_mode_uses_the_proofreading_prompt():
    reply = json.dumps({'notes': [{'block_id': 'a1', 'category': 'grammar', 'note': '"stares" is fine; "phone" ok.'}]})
    client, fake = client_with(reply)
    res = client.post('/api/ai/notes', json={**SCENE, 'mode': 'proofread'})
    assert res.status_code == 200
    assert res.json()['notes'][0]['category'] == 'grammar'
    assert 'proofreader' in fake.messages[0]['content']


def test_proofread_prompt_protects_dialogue_voice():
    system, _ = build_proofread_messages([('d1', 'dialogue', 'kya scene hai')], 'hinglish', 5)
    assert 'deliberate' in system['content']
    assert 'do not rewrite' in system['content']
