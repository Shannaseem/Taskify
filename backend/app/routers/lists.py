from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List as PyList

# Import all the necessary components
from .. import crud, models, schemas
from ..database import get_db

# Create an APIRouter
# This helps organize your endpoints. We can add a prefix and tags.
router = APIRouter(
    prefix="/lists",  # All routes in this file will start with /lists
    tags=["Lists"],   # Groups these routes in the auto-generated API docs
)

@router.post("/", response_model=schemas.List)
def create_list(
    list_data: schemas.ListCreate, 
    db: Session = Depends(get_db)
):
    """
    Create a new task list.
    """
    # Check if a list with this name already exists
    db_list = crud.get_list_by_name(db, list_name=list_data.name)
    if db_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A list with this name already exists."
        )
    
    # Create the new list
    return crud.create_list(db=db, list_data=list_data)


@router.get("/", response_model=PyList[schemas.ListWithTasks])
def read_all_lists_with_tasks(db: Session = Depends(get_db)):
    """
    Retrieve all lists, including their nested tasks.
    This is the primary endpoint your frontend will call on load.
    """
    lists = crud.get_lists_with_tasks(db=db)
    return lists


@router.delete("/{list_id}", response_model=schemas.List)
def delete_list(list_id: int, db: Session = Depends(get_db)):
    """
    Delete a list by its ID.
    """
    db_list = crud.delete_list(db, list_id=list_id)
    if db_list is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="List not found."
        )
    
    # Return the deleted list object
    return db_list
