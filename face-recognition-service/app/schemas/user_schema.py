from pydantic import BaseModel


class FaceEnrollRequest(BaseModel):
    user_id: int
    image: str


class VerifyRequest(BaseModel):
    user_id: int | None = None
    image: str


class UserResponse(BaseModel):
    id: int
    fname: str
    lname: str

    class Config:
        from_attribute = True
