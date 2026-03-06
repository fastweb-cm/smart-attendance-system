from pydantic import BaseModel


class UserResponse(BaseModel):
    id: int
    fname: str
    lname: str

    class Config:
        from_attribute = True
