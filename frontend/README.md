# 📝 Taskify (Full-Stack)

**Taskify** is a feature-rich, full-stack To-Do list application inspired by **Microsoft To-Do**.  
It combines a modern **Vanilla JavaScript** frontend with a powerful **FastAPI (Python)** backend and a **PostgreSQL** database for reliable, persistent data storage.

---

## ✨ Features

- 🧱 **Full-Stack Architecture** – Decoupled frontend communicating with a FastAPI backend.
- 💾 **Persistent Database** – All tasks and lists are stored permanently in PostgreSQL.
- 🌐 **REST API** – Full CRUD (Create, Read, Update, Delete) operations via FastAPI.
- 📱 **Responsive Design** – Works great on desktop, tablet, and mobile.
- 🎨 **Dual Themes** – Switch between Light and Dark mode seamlessly.
- ✅ **Advanced Task Management** – Add, complete, delete, set due dates, mark as important, or add to "My Day."
- 🔍 **Live Search** – Instantly find tasks with dynamic filtering and highlighting.

---

## 🛠️ Tech Stack

### **Frontend**

- HTML5
- CSS3 (with CSS Variables for theming)
- Vanilla JavaScript (ES6+) — uses `fetch()` for API communication

### **Backend**

- Python 3
- FastAPI (high-performance REST API)
- SQLAlchemy (ORM for database communication)
- PostgreSQL (SQL database)
- Uvicorn (ASGI server)

---

## 🚀 Getting Started

Follow these steps to set up the project locally.

### ✅ Prerequisites

- Python 3.10+
- PostgreSQL (and optionally pgAdmin)
- Git

---

### 1. Clone the Repository

```bash
git clone https://github.com/Shannaseem/Taskify.git
cd Taskify
```

````

---

### 2. Set Up the Backend

Navigate to the backend folder:

```bash
cd backend
```

Create and activate a virtual environment:

```bash
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Install the required dependencies:

```bash
pip install -r requirements.txt
```

#### Create the Database

1. Open **pgAdmin** or use `psql`.
2. Create a new, empty database named **taskify_db**.

#### Configure Environment Variables

In the `backend` folder, create a new file named **.env** (if it doesn’t exist).
Add your PostgreSQL connection string like this:

```bash
DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5432/taskify_db"
```

---

### 3. Run the Application

You’ll need **two terminals** — one for the backend, one for the frontend.

#### 🖥️ Terminal 1 – Run the Backend

```bash
cd backend
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

Your backend API will run at:
👉 **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

#### 🌐 Terminal 2 – Run the Frontend

```bash
cd frontend
python -m http.server 5500
```

Your frontend will be available at:
👉 **[http://127.0.0.1:5500](http://127.0.0.1:5500)**

---

## 📂 Folder Structure

Here’s the actual structure of your project:

```
Taskify/
│
├── backend/
│   ├── app/
│   │   ├── __pycache__/
│   │   ├── routers/
│   │   │   ├── __pycache__/
│   │   │   ├── lists.py
│   │   │   ├── tasks.py
│   │   │   └── __init__.py
│   │   ├── auth.py
│   │   ├── crud.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   └── schemas.py
│   │
│   ├── .env
│   ├── requirements.txt
│   └── venv/
│
├── frontend/
│   ├── index.html
│   ├── logo.png
│   ├── script.js
│   └── style.css
│
├── .gitignore
└── README.md
```


## 👨‍💻 Author

**Shan Naseem**
🎓 Student at UET Lahore | 💻 Full-Stack Developer

🌐 [GitHub](https://github.com/Shannaseem)
💼 [LinkedIn](https://www.linkedin.com/in/shan-naseem/)
````
