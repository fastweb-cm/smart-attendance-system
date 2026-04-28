from pydantic import BaseModel
from typing import Optional


class TerminalConfigUpdateRequest(BaseModel):
    terminal_id: int
