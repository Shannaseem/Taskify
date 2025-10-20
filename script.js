document.addEventListener("DOMContentLoaded", () => {
  // --- STATE MANAGEMENT ---
  let tasks = [];
  let lists = [];
  let settings = {
    confirmDelete: true,
  };
  let activeView = "my-day";

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
      lists.push({ id: Date.now(), name: "My Tasks" });
    }
    confirmDeleteToggle.checked = settings.confirmDelete;
  }

  // --- LOADER CONTROL ---
  function showLoader() {
    loader.classList.remove("hidden");
  }

  function hideLoader() {
    loader.classList.add("hidden");
  }

  // --- CORE UI RENDERING ---

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
        (t) => !t.completed && t.listId === list.id
      ).length;
      const countDisplay = listTaskCount > 0 ? listTaskCount : "";
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
        default:
          viewFilteredTasks = tasks;
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

  // --- ACTIONS ---

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

  function showDatePicker(container, task) {
    const picker = document.createElement("input");
    picker.type = "date";
    const today = new Date().toISOString().split("T")[0];
    picker.setAttribute("min", today);
    if (task.dueDate) picker.value = task.dueDate;
    picker.style.opacity = 0;
    picker.style.position = "absolute";
    picker.style.width = "100%";
    picker.style.height = "100%";
    picker.addEventListener("change", () => {
      task.dueDate = picker.value;
      saveData();
      updateUI();
    });
    picker.addEventListener("blur", () => picker.remove());
    container.appendChild(picker);
    try {
      picker.showPicker();
    } catch (error) {
      console.error("Browser does not support showPicker()", error);
    }
  }

  function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText === "") return;

    showLoader();
    setTimeout(() => {
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
      hideLoader();
    }, 500);
  }

  async function deleteList(listId) {
    const list = lists.find((l) => l.id === listId);
    if (!list) return;

    if (settings.confirmDelete) {
      try {
        await showConfirmationDialog(list.name);
      } catch (error) {
        return;
      }
    }

    showLoader();
    setTimeout(() => {
      lists = lists.filter((l) => l.id !== listId);
      tasks = tasks.filter((t) => t.listId !== listId);
      if (activeView === listId) {
        const firstList = document.querySelector(".sidebar-menu .menu-item");
        if (firstList) {
          firstList.click();
        } else {
          activeView = "my-day";
          updateUI();
        }
      }
      saveData();
      updateUI();
      hideLoader();
    }, 500);
  }

  function showListContextMenu(event) {
    event.preventDefault();
    removeContextMenu();
    const listElement = event.target.closest(".menu-item[data-list-id]");
    if (!listElement) return;
    const listId = Number(listElement.dataset.listId);
    const listIndex = lists.findIndex((l) => l.id === listId);
    if (listIndex === 0) return;

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

  async function handleTaskInteraction(event) {
    const taskItem = event.target.closest(".task-item");
    if (!taskItem) return;
    const taskId = Number(taskItem.dataset.id);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const target = event.target;
    let action = null;

    if (target.matches(".task-checkbox")) {
      action = () => {
        task.completed = !task.completed;
      };
    } else if (target.closest(".important-btn")) {
      action = () => {
        task.isImportant = !task.isImportant;
      };
    } else if (target.closest(".add-to-day-btn")) {
      action = () => {
        task.myDay = !task.myDay;
      };
    } else if (target.closest(".assign-to-me-btn")) {
      action = () => {
        task.assignedTo = task.assignedTo ? null : "me";
      };
    } else if (target.closest(".set-date-btn")) {
      showDatePicker(target.closest(".task-actions"), task);
      return;
    } else if (target.closest(".delete-task-btn")) {
      if (settings.confirmDelete) {
        try {
          await showConfirmationDialog(task.text);
        } catch (error) {
          return;
        }
      }
      showLoader();
      taskItem.classList.add("removing");
      taskItem.addEventListener(
        "transitionend",
        () => {
          tasks = tasks.filter((t) => t.id !== taskId);
          saveData();
          updateUI();
          hideLoader();
        },
        { once: true }
      );
      return;
    }

    if (action) {
      showLoader();
      setTimeout(() => {
        action();
        saveData();
        updateUI();
        hideLoader();
      }, 500);
    }
  }

  // --- INITIALIZE LISTENERS & UI ---

  // UPDATED: Menu button now handles both mobile and desktop
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
    // Close mobile sidebar if clicking outside of it
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
    updateUI();

    // Close mobile sidebar after a selection
    if (window.innerWidth <= 768) {
      sidebar.classList.remove("sidebar-open");
    }
  });
  customListsContainer.addEventListener("contextmenu", showListContextMenu);
  searchBar.addEventListener("input", updateUI);

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
  newListInput.addEventListener("blur", () => {
    const listName = newListInput.value.trim();
    if (listName) {
      showLoader();
      setTimeout(() => {
        const newList = { id: Date.now(), name: listName };
        lists.push(newList);

        const currentActive = document.querySelector(".menu-item.active");
        if (currentActive) currentActive.classList.remove("active");

        activeView = newList.id;
        saveData();
        updateUI();
        hideLoader();
      }, 500);
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
    })
  );

  // --- INITIALIZATION ---
  function initialize() {
    setTimeout(() => {
      loadData();
      updateUI();
      hideLoader();
    }, 1000);
  }

  initialize();
});
