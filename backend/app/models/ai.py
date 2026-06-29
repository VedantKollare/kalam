from pydantic import BaseModel


class RewriteRequest(BaseModel):
    text: str
    element_type: str
    instruction: str | None = None
