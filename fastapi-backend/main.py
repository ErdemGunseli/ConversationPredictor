import os
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.middleware import SlowAPIMiddleware
from fastapi.exceptions import RequestValidationError
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from dotenv import load_dotenv
import uvicorn

sys.path.append(os.path.dirname(os.path.abspath(__file__)))


# Loading environment variables and declaring FastAPI instance before local imports:
load_dotenv()

from handlers import validation_exception_handler
from routers import root, users, auth, conversations
from database import engine
import models
from rate_limiter import limiter

# Initializing FastAPI:
app = FastAPI()

# Adding CORS middleware before other middleware:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Adding exception handlers and middleware before the application starts:
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Adding custom exception handler for request validation errors:
app.add_exception_handler(RequestValidationError, validation_exception_handler)

# Creating database tables:
models.Base.metadata.create_all(bind=engine)

# Adding all routers:
for module in [root, users, auth, conversations]:
    app.include_router(module.router)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
