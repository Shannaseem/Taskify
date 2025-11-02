from sqlalchemy.orm import Session, joinedload
from typing import List as PyList, Optional

# Import our database models and our Pydantic schemas
from . import models, schemas

# --- List CRUD Functions ---

def get_list(db: Session, list_id: int) -> Optional[models.List]:
    """
    Fetches a single list by its ID.
    """
    return db.query(models.List).filter(models.List.id == list_id).first()

def get_list_by_name(db: Session, list_name: str) -> Optional[models.List]:
    """
    Fetches a single list by its name (useful for checking duplicates).
    """
    return db.query(models.List).filter(models.List.name == list_name).first()

def get_lists(db: Session, skip: int = 0, limit: int = 100) -> PyList[models.List]:
    """
    Fetches all lists with optional pagination (skip, limit).
    """
    return db.query(models.List).offset(skip).limit(limit).all()

def get_lists_with_tasks(db: Session) -> PyList[models.List]:
    """
    Fetches all lists and eagerly loads their associated tasks in one query.
    This is very efficient and will be the main one you use.
    """
    # joinedload(models.List.tasks) tells SQLAlchemy to fetch all
    # related tasks in the same database query (using a JOIN).
    return db.query(models.List).options(joinedload(models.List.tasks)).all()


def create_list(db: Session, list_data: schemas.ListCreate) -> models.List:
    """
    Creates a new List in the database.
    """
    db_list = models.List(name=list_data.name)
    db.add(db_list)
    db.commit()
    db.refresh(db_list)
    return db_list

def delete_list(db: Session, list_id: int) -> Optional[models.List]:
    """
    Deletes a list by its ID.
    The 'cascade' option in models.py will automatically delete its tasks.
    """
    db_list = get_list(db, list_id)
    if db_list:
        db.delete(db_list)
        db.commit()
        return db_list
    return None

# --- Task CRUD Functions ---

def get_task(db: Session, task_id: int) -> Optional[models.Task]:
    """
    Fetches a single task by its ID.
    """
    return db.query(models.Task).filter(models.Task.id == task_id).first()

def get_tasks_by_list(db: Session, list_id: int) -> PyList[models.Task]:
    """
    Fetches all tasks associated with a specific list ID.
    """
    return db.query(models.Task).filter(models.Task.list_id == list_id).all()

def create_task(db: Session, task_data: schemas.TaskCreate) -> models.Task:
    """
    Creates a new Task in the database, linked to a List.
    """
    # Create a model instance from the schema data
    db_task = models.Task(
        text=task_data.text,
        list_id=task_data.list_id,
        isImportant=task_data.isImportant,
        myDay=task_data.myDay
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def update_task(db: Session, task_id: int, task_data: schemas.TaskUpdate) -> Optional[models.Task]:
    """
    Updates an existing task in the database.
    """
    db_task = get_task(db, task_id)
    if not db_task:
        return None

    # Get the update data from the schema
    # .model_dump(exclude_unset=True) is key: it only includes fields
    # that were *actually sent* by the client.
    update_data = task_data.model_dump(exclude_unset=True)

    # Loop over the fields in the update data and set them on the model
    for key, value in update_data.items():
        setattr(db_task, key, value)

    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def delete_task(db: Session, task_id: int) -> Optional[models.Task]:
    """
    Deletes a task by its ID.
    """
    db_task = get_task(db, task_id)
    if db_task:
        db.delete(db_task)
        db.commit()
        return db_task
    return None
