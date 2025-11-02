Taskify 📝 (Full-Stack)Taskify is a feature-rich, full-stack To-Do list application inspired by Microsoft To-Do. This project uses a Vanilla JavaScript frontend and a powerful FastAPI (Python) backend with a PostgreSQL database for robust, persistent data storage.✨ FeaturesFull-Stack Architecture: A decoupled frontend that communicates with a high-performance Python backend.Persistent Database: All user tasks and lists are saved permanently in a PostgreSQL database.REST API: A complete RESTful API built with FastAPI for creating, reading, updating, and deleting tasks and lists.Responsive Design: Looks and works great on mobile, tablet, and desktop.🎨 Dual Themes: Seamlessly switch between a clean Light Mode and a sleek Dark Mode.🚀 Advanced Task Management: Add, complete, delete, set due dates, and mark tasks as important or part of "My Day."🔍 Live Search: Instantly find any task with a search bar that filters and highlights matching text.🛠️ Built WithFrontendHTML5CSS3 (with CSS Variables for theming)Vanilla JavaScript (ES6+) (with fetch for API calls)BackendPython 3FastAPI (for the high-speed REST API)SQLAlchemy (as the ORM for database communication)PostgreSQL (as the SQL database)Uvicorn (as the ASGI server)🚀 Getting StartedTo get a local copy up and running, you must run both the backend server and the frontend client.PrerequisitesPython 3.10+PostgreSQL (and a tool like pgAdmin)Git1. Clone the Repositorygit clone [https://github.com/Shannaseem/Taskify.git](https://github.com/Shannaseem/Taskify.git)
cd Taskify 2. Configure the BackendNavigate to the backend folder:cd backend
Create a virtual environment:python -m venv venv
.\venv\Scripts\Activate.ps1
Install dependencies:pip install -r requirements.txt
Create your database:Open pgAdmin or psql.Create a new, empty database named taskify_db.Set up environment variables:Rename the .env.example file (if one exists) or create a new file named .env in the backend folder.Add your database URL to it. It should look like this (replace with your own password):DATABASE_URL="postgresql://postgres:mysecretpassword@localhost:5432/taskify_db" 3. Run the ApplicationYou will need to open two terminals.In Terminal 1 (Run the Backend):# Navigate to the backend folder
cd backend

# Activate the virtual environment

.\venv\Scripts\Activate.ps1

# Run the server

uvicorn app.main:app --reload
Your API is now running at http://127.0.0.1:8000.In Terminal 2 (Run the Frontend):# Navigate to the frontend folder
cd frontend

# Start a simple web server

python -m http.server 5500
Your frontend is now running at http://127.0.0.1:5500.Open http://127.0.0.1:5500 in your browser to use the app!
