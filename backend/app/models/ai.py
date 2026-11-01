from typing import Literal

from pydantic import BaseModel, Field

NoteCategory = Literal['structure', 'character', 'dialogue', 'pacing', 'clarity', 'continuity', 'format', 'grammar']
NotesMode = Literal['notes', 'proofread']


class SceneBlock(BaseModel):
    id: str
    type: str
    text: str


class NotesRequest(BaseModel):
    """One scene, sent block by block so notes can point at a specific line."""
    blocks: list[SceneBlock] = Field(min_length=1, max_length=400)
    language: str = 'english'
    focus: list[NoteCategory] = Field(default_factory=list)
    mode: NotesMode = 'notes'   # 'proofread' = grammar/spelling in action, typos only in dialogue


class Note(BaseModel):
    block_id: str | None = None
    category: NoteCategory
    note: str = Field(min_length=1, max_length=600)


class NotesResponse(BaseModel):
    notes: list[Note]
