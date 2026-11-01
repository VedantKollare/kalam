from ..services.notes_service import NotesService


def get_notes_service() -> NotesService:
    return NotesService()
