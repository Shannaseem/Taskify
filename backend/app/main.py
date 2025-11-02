from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import the database components
from .database import engine
from . import models

# Import the API routers
from .routers import lists, tasks

# --- Database Table Creation ---
# This command tells SQLAlchemy to look at all the classes that
# inherited from models.Base (our List and Task classes)
# and create the corresponding tables in the database.
models.Base.metadata.create_all(bind=engine)


# --- FastAPI App Initialization ---
app = FastAPI(
    title="Taskify API",
    description="The backend API for the Taskify To-Do application.",
    version="1.0.0"
)

# --- CORS Middleware ---
# This is CRITICAL for your frontend to be able to
# communicate with your backend.
app.add_middleware(
    CORSMiddleware,
    # This should be the URL of your frontend.
    # Using ["*"] is okay for development, but be more specific in production.
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"], # Specify allowed methods
    allow_headers=["*"], # Allow all headers
)


# --- Include API Routers ---
# This tells the main app to use the routes we defined in our router files.
app.include_router(lists.router)
app.include_router(tasks.router)


# --- Root Endpoint ---
@app.get("/", tags=["Root"])
def read_root():
    """
    A simple root endpoint to confirm the API is running.
    """
    return {"message": "Welcome to the Taskify API!"}
