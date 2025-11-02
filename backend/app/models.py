from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship, Mapped
from .database import Base  # Import Base from our database.py file
import datetime

class List(Base):
    """
    Represents a task list.
    (Keeps timestamps and indexes for performance)
    """
    __tablename__ = "lists"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True) # Added unique=True

    # --- Timestamps ---
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 'cascade' means if a list is deleted, all its tasks are also deleted.
    tasks: Mapped[list["Task"]] = relationship("Task", back_populates="list", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<List(name='{self.name}')>"

class Task(Base):
    """
    Represents a single to-do item.
    (Keeps timestamps and indexes for performance)
    """
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(String(500), nullable=False)
    completed = Column(Boolean, default=False, nullable=False, index=True)
    
    # --- "Smart List" Indexes ---
    isImportant = Column("is_important", Boolean, default=False, index=True)
    myDay = Column("my_day", Boolean, default=False, index=True)
    dueDate = Column("due_date", DateTime, nullable=True, index=True)
    assignedTo = Column("assigned_to", String(100), nullable=True)

    # --- Timestamps ---
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # --- Foreign Key (Always Index This) ---
    list_id = Column(Integer, ForeignKey("lists.id"), nullable=False, index=True)
    list: Mapped["List"] = relationship("List", back_populates="tasks")

    def __repr__(self):
        return f"<Task(text='{self.text}', completed={self.completed})>"

