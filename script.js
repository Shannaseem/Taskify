document.addEventListener("DOMContentLoaded", () => {
  // --- STATE MANAGEMENT ---
  let tasks = [];
  let lists = [];
  let settings = {
    confirmDelete: true,
  };
  let activeView = "my-day";

  // --- DOM ELEMENTS ---
  const menuBtn = document.querySelector(".menu-btn");
  const sidebar = document.querySelector(".sidebar");
  const settingsBtn = document.querySelector("#settings-btn");
  const settingsPanel = document.querySelector(".settings-panel");
  const settingsCloseBtn = document.querySelector(".settings-close-btn");
  const confirmDeleteToggle = document.querySelector("#confirm-delete-toggle");
  const searchBar = document.querySelector(".search-bar");
  const mainContent = document.querySelector(".main-content");
  const taskInput = document.querySelector("#task-input");
  const addTaskBtn = document.querySelector("#add-task-btn");
  const taskListContainer = document.querySelector("#task-list-container");
  const listTitleText = document.querySelector("#list-title-text");
  const customListsContainer = document.querySelector(
    "#custom-lists-container"
  );
  const newListBtn = document.querySelector(".new-list-btn");
  const newListInput = document.querySelector("#new-list-input");
  const themeRadios = document.querySelectorAll('input[name="theme"]');
  const body = document.body;

  // --- DATA PERSISTENCE ---
  function saveData() {
    localStorage.setItem("todoApp", JSON.stringify({ tasks, lists, settings }));
  }

  function loadData() {
    const savedData = localStorage.getItem("todoApp");
    if (savedData) {
      const appData = JSON.parse(savedData);
      tasks = appData.tasks || [];
      lists = appData.lists || [];
      settings = { ...{ confirmDelete: true }, ...appData.settings };
    }
    if (lists.length === 0) {
      lists.push({ id: Date.now(), name: "Tasks" });
    }
    confirmDeleteToggle.checked = settings.confirmDelete;
  }

  // --- CORE UI RENDERING ---

  function renderCustomLists() {
    customListsContainer.innerHTML = "";
    lists.forEach((list) => {
      const listItem = document.createElement("li");
      listItem.classList.add("menu-item");
      listItem.dataset.listId = list.id;
      if (activeView === list.id) listItem.classList.add("active");
      listItem.innerHTML = `<i class="item-icon fa-solid fa-list-ul"></i><span class="item-text">${list.name}</span>`;
      customListsContainer.appendChild(listItem);
    });
  }

  function renderTasks(searchQuery = "") {
    taskListContainer.innerHTML = "";
    let viewFilteredTasks = [];

    // Filter by Active View
    if (typeof activeView === "string") {
      switch (activeView) {
        case "my-day":
          viewFilteredTasks = tasks.filter((t) => t.myDay);
          break;
        case "important":
          viewFilteredTasks = tasks.filter((t) => t.isImportant);
          break;
        case "planned":
          viewFilteredTasks = tasks
            .filter((t) => t.dueDate)
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
          break;
        case "assigned":
          viewFilteredTasks = tasks.filter((t) => t.assignedTo === "me");
          break;
        default:
          viewFilteredTasks = [];
      }
    } else if (typeof activeView === "number") {
      viewFilteredTasks = tasks.filter((t) => t.listId === activeView);
    }

    const searchFilteredTasks = searchQuery
      ? viewFilteredTasks.filter((t) =>
          t.text.toLowerCase().includes(searchQuery)
        )
      : viewFilteredTasks;

    if (searchFilteredTasks.length === 0) {
      mainContent.classList.add("empty-state");
      taskListContainer.innerHTML = `<div class="list-not-found"><h2>Nothing to see here</h2><p>${getEmptyStateMessage(
        searchQuery
      )}</p></div>`;
      return;
    }
    mainContent.classList.remove("empty-state");

    searchFilteredTasks.forEach((task) => {
      const taskItem = document.createElement("li");
      taskItem.className = `task-item ${task.completed ? "completed" : ""} ${
        task.isImportant ? "important" : ""
      } ${task.myDay ? "on-my-day" : ""} ${
        task.assignedTo ? "assigned-to-me" : ""
      }`;
      taskItem.dataset.id = task.id;
      const highlightedText = searchQuery
        ? task.text.replace(
            new RegExp(searchQuery, "gi"),
            (match) => `<span class="highlight">${match}</span>`
          )
        : task.text;
      const dueDateHtml = task.dueDate
        ? `<span class="due-date"><i class="fa-regular fa-calendar"></i> Due ${new Date(
            task.dueDate
          ).toLocaleDateString()}</span>`
        : "";

      taskItem.innerHTML = `
            <div class="task-content">
                <input type="checkbox" class="task-checkbox" ${
                  task.completed ? "checked" : ""
                }>
                <div class="task-details">
                    <span class="task-text">${highlightedText}</span>
                    <div class="task-meta">${dueDateHtml}</div>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-action-btn assign-to-me-btn" title="Assign to me"><i class="fa-regular fa-user"></i></button>
                <button class="task-action-btn add-to-day-btn" title="Add to My Day"><i class="fa-regular fa-sun"></i></button>
                <button class="task-action-btn set-date-btn" title="Set due date"><i class="fa-regular fa-calendar-plus"></i></button>
                <button class="task-action-btn important-btn" title="Mark as important"><i class="fa-star ${
                  task.isImportant ? "fa-solid" : "fa-regular"
                }"></i></button>
                <button class="task-action-btn delete-task-btn" title="Delete task"><i class="fa-regular fa-trash-can"></i></button>
            </div>`;
      taskListContainer.appendChild(taskItem);
    });
  }

  function getEmptyStateMessage(searchQuery) {
    if (searchQuery) return "No tasks match your search.";
    if (activeView === "assigned")
      return "Tasks assigned to you will appear here.";
    if (activeView === "planned")
      return "Tasks with a due date will appear here.";
    return "This list is empty. Add a task to get started!";
  }

  function updateUI() {
    const activeEl = document.querySelector(".menu-item.active");
    listTitleText.textContent = activeEl
      ? activeEl.querySelector(".item-text").textContent
      : "To Do";
    renderCustomLists();
    renderTasks(searchBar.value.trim().toLowerCase());
  }

  // --- ACTIONS ---

  function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText === "") return;
    const newTask = {
      id: Date.now(),
      text: taskText,
      completed: false,
      isImportant: activeView === "important",
      myDay: activeView === "my-day",
      assignedTo: activeView === "assigned" ? "me" : null,
      dueDate: null,
      listId: typeof activeView === "number" ? activeView : lists[0].id,
    };
    tasks.push(newTask);
    taskInput.value = "";
    saveData();
    updateUI();
  }

  function deleteList(listId) {
    if (
      settings.confirmDelete &&
      !confirm(
        "Are you sure you want to delete this list and all its tasks? This cannot be undone."
      )
    )
      return;
    lists = lists.filter((l) => l.id !== listId);
    tasks = tasks.filter((t) => t.listId !== listId);
    if (activeView === listId) activeView = "my-day";
    saveData();
    updateUI();
  }

  function showListContextMenu(event) {
    event.preventDefault();
    removeContextMenu();
    const listElement = event.target.closest(".menu-item[data-list-id]");
    if (!listElement) return;

    const listId = Number(listElement.dataset.listId);
    const menu = document.createElement("div");
    menu.className = "custom-context-menu";
    menu.innerHTML = `<button class="context-menu-item delete"><i class="fa-regular fa-trash-can"></i>Delete list</button>`;

    document.body.appendChild(menu);
    menu.style.top = `${event.clientY}px`;
    menu.style.left = `${event.clientX}px`;

    menu.querySelector(".delete").addEventListener("click", () => {
      deleteList(listId);
      removeContextMenu();
    });
  }

  function removeContextMenu() {
    document.querySelector(".custom-context-menu")?.remove();
  }

  // --- EVENT HANDLERS ---

  function handleTaskInteraction(event) {
    const taskItem = event.target.closest(".task-item");
    if (!taskItem) return;
    const taskId = Number(taskItem.dataset.id);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const target = event.target;
    let shouldSave = true;
    let shouldUpdate = true;

    if (target.matches(".task-checkbox")) {
      task.completed = !task.completed;
    } else if (target.closest(".important-btn")) {
      task.isImportant = !task.isImportant;
    } else if (target.closest(".add-to-day-btn")) {
      task.myDay = !task.myDay;
    } else if (target.closest(".assign-to-me-btn")) {
      task.assignedTo = task.assignedTo ? null : "me";
    } else if (target.closest(".delete-task-btn")) {
      if (
        settings.confirmDelete &&
        !confirm("Are you sure you want to delete this task?")
      )
        return;
      taskItem.classList.add("removing");
      taskItem.addEventListener("transitionend", () => {
        tasks = tasks.filter((t) => t.id !== taskId);
        saveData();
        updateUI();
      });
      shouldSave = shouldUpdate = false;
    } else {
      shouldSave = shouldUpdate = false;
    }

    if (shouldSave) saveData();
    if (shouldUpdate) updateUI();
  }

  // --- INITIALIZE LISTENERS & UI ---

  // Sidebar & Settings Panel (FIXED)
  menuBtn.addEventListener("click", () =>
    sidebar.classList.toggle("sidebar-collapsed")
  );
  settingsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    settingsPanel.classList.toggle("active");
  });
  settingsCloseBtn.addEventListener("click", () =>
    settingsPanel.classList.remove("active")
  );
  document.addEventListener("click", (e) => {
    if (
      settingsPanel.classList.contains("active") &&
      !settingsPanel.contains(e.target) &&
      !settingsBtn.contains(e.target)
    ) {
      settingsPanel.classList.remove("active");
    }
    removeContextMenu(); // Close context menu on any click
  });

  // App-specific listeners
  addTaskBtn.addEventListener("click", addTask);
  taskInput.addEventListener("keydown", (e) => e.key === "Enter" && addTask());
  taskListContainer.addEventListener("click", handleTaskInteraction);
  sidebar.addEventListener("click", (e) => {
    const clickedItem = e.target.closest(".menu-item");
    if (!clickedItem || clickedItem.classList.contains("active")) return;
    document.querySelector(".menu-item.active")?.classList.remove("active");
    clickedItem.classList.add("active");
    activeView = clickedItem.dataset.view
      ? clickedItem.dataset.view
      : Number(clickedItem.dataset.listId);
    updateUI();
  });
  customListsContainer.addEventListener("contextmenu", showListContextMenu);
  searchBar.addEventListener("input", updateUI);
  newListBtn.addEventListener("click", () => {
    newListBtn.style.display = "none";
    newListInput.style.display = "";
    newListInput.focus();
  });
  newListInput.addEventListener(
    "keydown",
    (e) => e.key === "Enter" && e.target.blur()
  );
  newListInput.addEventListener("blur", () => {
    const listName = newListInput.value.trim();
    if (listName) {
      const newList = { id: Date.now(), name: listName };
      lists.push(newList);
      activeView = newList.id;
      saveData();
      updateUI();
    }
    newListInput.value = "";
    newListInput.style.display = "none";
    newListBtn.style.display = "";
  });

  // Settings listeners
  confirmDeleteToggle.addEventListener("change", (e) => {
    settings.confirmDelete = e.target.checked;
    saveData();
  });
  themeRadios.forEach((radio) =>
    radio.addEventListener("change", (e) => {
      body.setAttribute("data-theme", e.target.value);
      // In a real app, you'd save this to settings object as well
    })
  );

  // --- INITIALIZATION ---
  function initialize() {
    loadData();
    updateUI();
  }

  initialize();
});
