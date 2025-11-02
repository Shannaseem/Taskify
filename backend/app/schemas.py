from pydantic import BaseModel, ConfigDict
from typing import Optional, List as PyList
from datetime import datetime

# --- Task Schemas ---

class TaskBase(BaseModel):
    """
    Base schema for a Task, contains all common fields.
    """
    text: str
    completed: bool = False
    isImportant: bool = False
    myDay: bool = False
    dueDate: Optional[datetime] = None
    assignedTo: Optional[str] = None

class TaskCreate(BaseModel):
    """
    Schema for creating a new task. Requires text and a list_id.
    (This matches your frontend logic)
    """
    text: str
    list_id: int
    isImportant: bool = False
    myDay: bool = False

class TaskUpdate(BaseModel):
    """
    Schema for updating an existing task. All fields are optional.
    """
    text: Optional[str] = None
    completed: Optional[bool] = None
    isImportant: Optional[bool] = None
    myDay: Optional[bool] = None
    dueDate: Optional[datetime] = None
    assignedTo: Optional[str] = None
    list_id: Optional[int] = None

class Task(TaskBase):
    """
    Schema for reading a task (e.g., in an API response).
    (Includes timestamps from the new model)
    """
    id: int
    list_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    # This tells Pydantic to read the data from the ORM model
    model_config = ConfigDict(from_attributes=True)


# --- List Schemas ---

class ListBase(BaseModel):
    """
    Base schema for a List.
    """
    name: str

class ListCreate(ListBase):
    """
    Schema for creating a new list.
    """
    pass

class List(ListBase):
    """
    Schema for reading a list from the API.
    (Includes timestamps from the new model)
    """
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class ListWithTasks(List):
    """
    A special schema that returns a List *and* all its associated tasks.
    This is what your frontend's loadDataAndRender() function needs.
    """
    tasks: PyList[Task] = []

