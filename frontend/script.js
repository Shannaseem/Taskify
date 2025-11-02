document.addEventListener("DOMContentLoaded", () => {
  // --- API URL ---
  const API_BASE_URL = "http://127.0.0.1:8000";

  // --- STATE MANAGEMENT ---
  let tasks = []; // Will be populated from the API
  let lists = []; // Will be populated from the API
  let settings = {
    confirmDelete: true,
  };
  let activeView = "my-day"; // Default view

  // --- DOM ELEMENTS ---
  const loader = document.querySelector("#loader-overlay");
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
  const myDayCountSpan = document.querySelector("#my-day-count");
  const importantCountSpan = document.querySelector("#important-count");
  const plannedCountSpan = document.querySelector("#planned-count");
  const assignedCountSpan = document.querySelector("#assigned-count");

  // --- API & DATA SYNCING ---

  /**
   * Fetches all data from the backend and re-renders the entire UI.
   * This is the new "single source of truth" function.
   */
  async function loadDataAndRender() {
    showLoader();
    try {
      // 1. Fetch all lists, which include their nested tasks
      const response = await fetch(`${API_BASE_URL}/lists/`);
      if (!response.ok) throw new Error("Failed to fetch data from server.");

      let loadedLists = await response.json();

      // *** FIX 1: Handle Empty Database ***
      // If the database is empty, create a default "My Tasks" list
      if (loadedLists.length === 0) {
        const newListResponse = await fetch(`${API_BASE_URL}/lists/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "My Tasks" }),
        });
        if (!newListResponse.ok)
          throw new Error("Failed to create default list.");

        // Add the new list to our local state to render
        const defaultList = await newListResponse.json();
        loadedLists = [defaultList];
      }
      // **********************************

      // 2. Process the API data into our local state arrays
      lists = loadedLists.map(({ id, name }) => ({ id, name }));
      // Add '|| []' as a safeguard in case a list has no tasks property
      tasks = loadedLists.flatMap((list) => list.tasks || []);

      // 3. Load settings from localStorage (settings are not on the backend)
      const savedSettings = localStorage.getItem("todoAppSettings"); // Use a new key
      if (savedSettings) {
        settings = { ...{ confirmDelete: true }, ...JSON.parse(savedSettings) };
      }
      confirmDeleteToggle.checked = settings.confirmDelete;
    } catch (error) {
      console.error("Error loading data:", error);
      listTitleText.textContent = "Error loading tasks";
    } finally {
      // 4. Update the UI with the new data and hide the loader
      updateUI();
      hideLoader();
    }
  }

  // --- LOADER CONTROL ---
  function showLoader() {
    loader.classList.remove("hidden");
  }

  function hideLoader() {
    loader.classList.add("hidden");
  }

  // --- CORE UI RENDERING (No changes needed here) ---

  function updateTaskCounts() {
    const myDayCount = tasks.filter((t) => !t.completed && t.myDay).length;
    myDayCountSpan.textContent = myDayCount > 0 ? myDayCount : "";

    const importantCount = tasks.filter(
      (t) => !t.completed && t.isImportant
    ).length;
    importantCountSpan.textContent = importantCount > 0 ? importantCount : "";

    const plannedCount = tasks.filter((t) => !t.completed && t.dueDate).length;
    plannedCountSpan.textContent = plannedCount > 0 ? plannedCount : "";

    const assignedCount = tasks.filter(
      (t) => !t.completed && t.assignedTo === "me"
    ).length;
    assignedCountSpan.textContent = assignedCount > 0 ? assignedCount : "";
  }

  function renderCustomLists() {
    customListsContainer.innerHTML = "";
    lists.forEach((list, index) => {
      const listItem = document.createElement("li");
      listItem.classList.add("menu-item");
      listItem.dataset.listId = list.id;
      if (activeView === list.id) listItem.classList.add("active");

      const listTaskCount = tasks.filter(
        (t) => !t.completed && t.list_id === list.id
      ).length;
      const countDisplay = listTaskCount > 0 ? listTaskCount : "";
      // Use the first list as "My Tasks" with a house icon
      const iconClass = index === 0 ? "fa-house" : "fa-list-ul";

      listItem.innerHTML = `
        <div>
          <i class="item-icon fa-solid ${iconClass}"></i>
          <span class="item-text">${list.name}</span>
        </div>
        <span class="item-count">${countDisplay}</span>
      `;
      customListsContainer.appendChild(listItem);
    });
  }

  function renderTasks(searchQuery = "") {
    taskListContainer.innerHTML = "";
    let viewFilteredTasks = [];

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
        default: // "all" or any other string
          viewFilteredTasks = tasks;
      }
    } else if (typeof activeView === "number") {
      viewFilteredTasks = tasks.filter((t) => t.list_id === activeView);
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

    const sortedTasks = [...searchFilteredTasks].sort(
      (a, b) => a.completed - b.completed
    );

    sortedTasks.forEach((task) => {
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
    if (activeEl) {
      const textEl = activeEl.querySelector(".item-text");
      if (textEl) {
        listTitleText.textContent = textEl.textContent;
      }
    } else {
      listTitleText.textContent = "Taskify";
    }
    renderCustomLists();
    renderTasks(searchBar.value.trim().toLowerCase());
    updateTaskCounts();
  }

  // --- ACTIONS (MODIFIED FOR API) ---

  function showConfirmationDialog(itemName) {
    const modal = document.querySelector("#confirmation-modal-overlay");
    const itemNameSpan = document.querySelector("#item-to-delete-name");
    const confirmBtn = document.querySelector("#confirm-delete-btn");
    const cancelBtn = document.querySelector("#cancel-delete-btn");

    itemNameSpan.textContent = itemName;
    modal.classList.remove("hidden");

    return new Promise((resolve, reject) => {
      cancelBtn.addEventListener(
        "click",
        () => {
          modal.classList.add("hidden");
          reject();
        },
        { once: true }
      );
      confirmBtn.addEventListener(
        "click",
        () => {
          modal.classList.add("hidden");
          resolve();
        },
        { once: true }
      );
    });
  }

  /**
   * Shows a date picker and updates the task on the backend when a date is selected.
   */
  async function showDatePicker(container, task) {
    const picker = document.createElement("input");
    picker.type = "date";
    const today = new Date().toISOString().split("T")[0];
    picker.setAttribute("min", today);
    if (task.dueDate) {
      picker.value = task.dueDate.split("T")[0]; // Format for date input
    }

    // --- Style picker to be invisible but clickable ---
    picker.style.opacity = 0;
    picker.style.position = "absolute";
    picker.style.width = "100%";
    picker.style.height = "100%";
    picker.style.cursor = "pointer";
    picker.style.right = 0;
    picker.style.top = 0;

    picker.addEventListener("change", async () => {
      const newDueDate = picker.value;
      showLoader();
      try {
        const response = await fetch(`${API_BASE_URL}/tasks/${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dueDate: newDueDate }),
        });
        if (!response.ok) throw new Error("Failed to set due date.");
        await loadDataAndRender();
      } catch (error) {
        console.error("Error setting due date:", error);
        hideLoader();
      } finally {
        picker.remove();
      }
    });

    picker.addEventListener("blur", () => picker.remove());
    container.appendChild(picker);
    try {
      picker.showPicker();
    } catch (error) {
      console.error("Browser does not support showPicker()", error);
    }
  }

  /**
   * Adds a new task by sending it to the backend.
   */
  async function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText === "") return;

    showLoader();

    // *** FIX 2: Wrap all logic in try/catch ***
    try {
      // Default to the first list (e.g., "My Tasks") if in a smart view
      // This is now safe because loadDataAndRender ensures lists[0] exists
      const currentListId =
        typeof activeView === "number" ? activeView : lists[0].id;

      const newTaskData = {
        text: taskText,
        list_id: currentListId,
        isImportant: activeView === "important",
        myDay: activeView === "my-day",
        // assignedTo is not set on creation from here
      };

      const response = await fetch(`${API_BASE_URL}/tasks/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTaskData),
      });

      if (!response.ok) throw new Error("Failed to add task.");

      taskInput.value = "";
      await loadDataAndRender(); // Re-sync with server
    } catch (error) {
      console.error("Error adding task:", error);
      hideLoader(); // This will now catch the error and hide the loader
    }
    // *******************************************
  }

  /**
   * Deletes a list from the backend.
   */
  async function deleteList(listId) {
    const list = lists.find((l) => l.id === listId);
    if (!list) return;

    // Prevent deleting the default list
    const listIndex = lists.findIndex((l) => l.id === listId);
    if (listIndex === 0) {
      alert("You cannot delete the default 'My Tasks' list.");
      return;
    }

    if (settings.confirmDelete) {
      try {
        await showConfirmationDialog(list.name);
      } catch (error) {
        return; // User clicked "Cancel"
      }
    }

    showLoader();
    try {
      const response = await fetch(`${API_BASE_URL}/lists/${listId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete list.");

      // If we deleted the active list, switch to the default view
      if (activeView === listId) {
        activeView = "my-day";
      }
      await loadDataAndRender(); // Re-sync
    } catch (error) {
      console.error("Error deleting list:", error);
      hideLoader();
    }
  }

  function showListContextMenu(event) {
    event.preventDefault();
    removeContextMenu();
    const listElement = event.target.closest(".menu-item[data-list-id]");
    if (!listElement) return;
    const listId = Number(listElement.dataset.listId);
    const listIndex = lists.findIndex((l) => l.id === listId);
    if (listIndex === 0) return; // Don't allow deleting the default list

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

  // --- EVENT HANDLERS (MODIFIED FOR API) ---

  /**
   * Handles all clicks on a task item (check, star, delete, etc.)
   */
  async function handleTaskInteraction(event) {
    const taskItem = event.target.closest(".task-item");
    if (!taskItem) return;
    const taskId = Number(taskItem.dataset.id);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const target = event.target;
    let actionPromise = null;

    // --- Task Updates (PATCH requests) ---
    if (target.matches(".task-checkbox")) {
      const updateData = { completed: !task.completed };
      actionPromise = updateTaskOnApi(taskId, updateData);
    } else if (target.closest(".important-btn")) {
      const updateData = { isImportant: !task.isImportant };
      actionPromise = updateTaskOnApi(taskId, updateData);
    } else if (target.closest(".add-to-day-btn")) {
      const updateData = { myDay: !task.myDay };
      actionPromise = updateTaskOnApi(taskId, updateData);
    } else if (target.closest(".assign-to-me-btn")) {
      const updateData = { assignedTo: task.assignedTo ? null : "me" };
      actionPromise = updateTaskOnApi(taskId, updateData);
    } else if (target.closest(".set-date-btn")) {
      showDatePicker(target.closest(".task-actions"), task);
      return; // showDatePicker handles its own API call
    }

    // --- Task Deletion (DELETE request) ---
    else if (target.closest(".delete-task-btn")) {
      if (settings.confirmDelete) {
        try {
          await showConfirmationDialog(task.text);
        } catch (error) {
          return; // User clicked "Cancel"
        }
      }
      showLoader();
      try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete task.");
        await loadDataAndRender(); // Re-sync
      } catch (error) {
        console.error("Error deleting task:", error);
        hideLoader();
      }
      return;
    }

    // --- Execute PATCH request if one was defined ---
    if (actionPromise) {
      showLoader();
      try {
        const response = await actionPromise;
        if (!response.ok) throw new Error("Failed to update task.");
        await loadDataAndRender(); // Re-sync
      } catch (error) {
        console.error("Error updating task:", error);
        hideLoader();
      }
    }
  }

  /**
   * Helper function to send a PATCH request for a task update
   */
  function updateTaskOnApi(taskId, updateData) {
    return fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData),
    });
  }

  // --- INITIALIZE LISTENERS & UI ---

  menuBtn.addEventListener("click", () => {
    if (window.innerWidth <= 768) {
      sidebar.classList.toggle("sidebar-open");
    } else {
      sidebar.classList.toggle("sidebar-collapsed");
    }
  });

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
    if (
      sidebar.classList.contains("sidebar-open") &&
      !sidebar.contains(e.target) &&
      !menuBtn.contains(e.target)
    ) {
      sidebar.classList.remove("sidebar-open");
    }
    removeContextMenu();
  });

  // App-specific listeners
  addTaskBtn.addEventListener("click", addTask);
  taskInput.addEventListener("keydown", (e) => e.key === "Enter" && addTask());
  taskListContainer.addEventListener("click", handleTaskInteraction);

  sidebar.addEventListener("click", (e) => {
    const clickedItem = e.target.closest(".menu-item");
    if (!clickedItem || clickedItem.classList.contains("active")) return;

    const currentActive = document.querySelector(".menu-item.active");
    if (currentActive) currentActive.classList.remove("active");

    clickedItem.classList.add("active");
    activeView = clickedItem.dataset.view
      ? clickedItem.dataset.view
      : Number(clickedItem.dataset.listId);

    // We don't need to call loadDataAndRender() here, just updateUI()
    // The data is already in memory, we are just changing the filter.
    updateUI();

    if (window.innerWidth <= 768) {
      sidebar.classList.remove("sidebar-open");
    }
  });

  customListsContainer.addEventListener("contextmenu", showListContextMenu);
  searchBar.addEventListener("input", () => updateUI()); // Just filter, don't reload

  newListBtn.addEventListener("click", () => {
    if (sidebar.classList.contains("sidebar-collapsed")) {
      sidebar.classList.remove("sidebar-collapsed");
    }
    newListBtn.style.display = "none";
    newListInput.style.display = "";
    newListInput.focus();
  });

  newListInput.addEventListener(
    "keydown",
    (e) => e.key === "Enter" && e.target.blur()
  );

  newListInput.addEventListener("blur", async () => {
    const listName = newListInput.value.trim();
    if (listName) {
      showLoader();
      try {
        const response = await fetch(`${API_BASE_URL}/lists/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: listName }),
        });
        if (!response.ok) {
          // Handle duplicate list name error
          if (response.status === 400) {
            alert("A list with this name already exists."); // Simple alert for now
          }
          throw new Error("Failed to create list.");
        }

        const newList = await response.json();
        activeView = newList.id; // Set the new list as the active view
        await loadDataAndRender(); // Re-sync
      } catch (error) {
        console.error("Error creating new list:", error);
        hideLoader();
      }
    }
    newListInput.value = "";
    newListInput.style.display = "none";
    newListBtn.style.display = "";
  });

  // Settings listeners
  confirmDeleteToggle.addEventListener("change", (e) => {
    settings.confirmDelete = e.target.checked;
    localStorage.setItem("todoAppSettings", JSON.stringify(settings));
  });
  themeRadios.forEach((radio) =>
    radio.addEventListener("change", (e) => {
      body.setAttribute("data-theme", e.target.value);
    })
  );

  // --- INITIALIZATION ---
  function initialize() {
    // Load all data from the API as soon as the page loads
    loadDataAndRender();
  }

  initialize();
});
