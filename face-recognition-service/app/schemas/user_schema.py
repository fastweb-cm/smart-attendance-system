from pydantic import BaseModel
from typing import Optional


class FaceEnrollRequest(BaseModel):
    user_id: int
    image: str


class VerifyRequest(BaseModel):
    user_id: int | None = None
    event_id: int | None = None
    image: str


class UserResponse(BaseModel):
    id: Optional[int]
    groupId: Optional[int]
    subgroupId: Optional[int]
    fName: Optional[str]
    lName: Optional[str]


class VerifyResponse(BaseModel):
    verified: bool
    attendance_status: Optional[str] = None
    next_step: Optional[str] = None
    user: Optional[UserResponse] = None
    attendance_type: Optional[str] = None
