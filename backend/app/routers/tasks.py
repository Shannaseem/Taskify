from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List as PyList

# Import all the necessary components
from .. import crud, models, schemas
from ..database import get_db

# Create an APIRouter
router = APIRouter(
    prefix="/tasks",  # All routes in this file will start with /tasks
    tags=["Tasks"],   # Groups these routes in the auto-generated API docs
)


@router.post("/", response_model=schemas.Task)
def create_task(
    task_data: schemas.TaskCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new task for a specific list.
    """
    # First, verify that the list this task is being added to actually exists.
    db_list = crud.get_list(db, list_id=task_data.list_id)
    if not db_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"List with id {task_data.list_id} not found."
        )
    
    # If the list exists, create the task
    return crud.create_task(db=db, task_data=task_data)


@router.patch("/{task_id}", response_model=schemas.Task)
def update_task(
    task_id: int,
    task_data: schemas.TaskUpdate,
    db: Session = Depends(get_db)
):
    """
    Update a task by its ID.
    This endpoint handles all changes: marking as complete,
    changing text, setting due date, etc.
    """
    db_task = crud.update_task(db=db, task_id=task_id, task_data=task_data)
    
    if db_task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found."
        )
    
    return db_task


@router.delete("/{task_id}", response_model=schemas.Task)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a task by its ID.
    """
    db_task = crud.delete_task(db=db, task_id=task_id)
    
    if db_task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found."
        )
        
    return db_task
