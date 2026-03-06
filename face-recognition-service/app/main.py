from fastapi import FastAPI
from app.routes import routes
from app.core.startup import startup_lifespan


app = FastAPI(title="Face Attendance Service", lifespan=startup_lifespan)

app.include_router(routes.router)
