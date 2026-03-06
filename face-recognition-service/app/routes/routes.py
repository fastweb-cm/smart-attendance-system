from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.schemas.user_schema import UserResponse
from app.crud.user_crud import *

# Creates a router object that will hold all routes in this file
router = APIRouter()

# Dependency function that creates db session
# FastAPI will call this automatically whenever a route needs a DB conn


def get_db():
    # Creates a new session using the the SessionLocal factory
    db = SessionLocal()

    try:
        # Returns the session to the route that requested it
        yield db
    finally:
        # Closes the DB conn, on either success or error
        db.close()


@router.get("/health")
def health_check():
    """
    Health check
    """
    return {"status": "ok"}


@router.get("/users/{id}")
def get_user(id: int, db: Session = Depends(get_db)):
    return get_user_by_id(db, id)
