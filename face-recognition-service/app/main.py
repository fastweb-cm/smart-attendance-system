from fastapi import FastAPI
from app.routes import routes

app = FastAPI(title="Face Attendance Service")

app.include_router(routes.router)
