const els = {
  newTaskBtn: document.getElementById("newTaskBtn"),
  modalBackdrop: document.getElementById("modalBackdrop"),
  closeModalBtn: document.getElementById("closeModalBtn"),
  cancelBtn: document.getElementById("cancelBtn"),
  deleteBtn: document.getElementById("deleteBtn"),
  taskForm: document.getElementById("taskForm"),
  taskId: document.getElementById("taskId"),
  titleInput: document.getElementById("titleInput"),
  descInput: document.getElementById("descInput"),
  statusInput: document.getElementById("statusInput"),
  modalTitle: document.getElementById("modalTitle"),
  saveBtn: document.getElementById("saveBtn"),
  formHint: document.getElementById("formHint"),
  cols: {
    todo: document.getElementById("col-todo"),
    in_progress: document.getElementById("col-in_progress"),
    done: document.getElementById("col-done"),
  },
  counts: {
    todo: document.getElementById("count-todo"),
    in_progress: document.getElementById("count-in_progress"),
    done: document.getElementById("count-done"),
  }
};

let state = { tasks: [] };

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fmtDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso || "";
  }
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (res.status === 204) return null;

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = payload?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return payload;
}

function openModal(mode, task = null) {
  els.modalBackdrop.classList.remove("hidden");
  els.modalBackdrop.setAttribute("aria-hidden", "false");

  if (mode === "new") {
    els.modalTitle.textContent = "New task";
    els.taskId.value = "";
    els.titleInput.value = "";
    els.descInput.value = "";
    els.statusInput.value = "todo";
    els.deleteBtn.classList.add("hidden");
    els.formHint.textContent = "";
  } else {
    els.modalTitle.textContent = "Edit task";
    els.taskId.value = task.id;
    els.titleInput.value = task.title;
    els.descInput.value = task.description || "";
    els.statusInput.value = task.status;
    els.deleteBtn.classList.remove("hidden");
    els.formHint.textContent = `Created ${fmtDate(task.createdAt)} · Updated ${fmtDate(task.updatedAt)}`;
  }

  setTimeout(() => els.titleInput.focus(), 0);
}

function closeModal() {
  els.modalBackdrop.classList.add("hidden");
  els.modalBackdrop.setAttribute("aria-hidden", "true");
}

function cardTemplate(task) {
  const desc = task.description?.trim() ? task.description.trim() : "No description";
  const statusLabel = task.status === "todo" ? "To Do" : task.status === "in_progress" ? "In Progress" : "Done";

  return `
    <article class="card" data-id="${escapeHtml(task.id)}" tabindex="0" role="button" aria-label="Edit task: ${escapeHtml(task.title)}">
      <h3 class="card-title">${escapeHtml(task.title)}</h3>
      <p class="card-desc">${escapeHtml(desc)}</p>
      <div class="card-meta">
        <span class="badge">${escapeHtml(statusLabel)}</span>
        <div class="meta-right">
          <span class="badge">${escapeHtml(fmtDate(task.updatedAt || task.createdAt))}</span>
        </div>
      </div>
    </article>
  `;
}

function render() {
  const groups = { todo: [], in_progress: [], done: [] };
  for (const t of state.tasks) groups[t.status]?.push(t);

  for (const k of Object.keys(groups)) {
    els.cols[k].innerHTML = groups[k].map(cardTemplate).join("");
    els.counts[k].textContent = String(groups[k].length);
  }

  // Attach click handlers after render
  document.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => {
      const id = card.getAttribute("data-id");
      const task = state.tasks.find(t => t.id === id);
      if (task) openModal("edit", task);
    });
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        card.click();
      }
    });
  });
}

async function load() {
  const data = await api("/api/tasks");
  state.tasks = data.tasks || [];
  render();
}

async function createTask({ title, description }) {
  const data = await api("/api/tasks", {
    method: "POST",
    body: JSON.stringify({ title, description })
  });
  state.tasks.unshift(data.task);
  render();
}

async function updateTask(id, patch) {
  const data = await api(`/api/tasks/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch)
  });
  state.tasks = state.tasks.map(t => t.id === id ? data.task : t);
  render();
}

async function deleteTask(id) {
  await api(`/api/tasks/${encodeURIComponent(id)}`, { method: "DELETE" });
  state.tasks = state.tasks.filter(t => t.id !== id);
  render();
}

els.newTaskBtn.addEventListener("click", () => openModal("new"));
els.closeModalBtn.addEventListener("click", closeModal);
els.cancelBtn.addEventListener("click", closeModal);
els.modalBackdrop.addEventListener("click", (e) => {
  if (e.target === els.modalBackdrop) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !els.modalBackdrop.classList.contains("hidden")) closeModal();
});

els.taskForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = els.taskId.value.trim();
  const title = els.titleInput.value.trim();
  const description = els.descInput.value.trim();
  const status = els.statusInput.value;

  els.saveBtn.disabled = true;

  try {
    if (!id) {
      await createTask({ title, description });
    } else {
      await updateTask(id, { title, description, status });
    }
    closeModal();
  } catch (err) {
    alert(err.message || String(err));
  } finally {
    els.saveBtn.disabled = false;
  }
});

els.deleteBtn.addEventListener("click", async () => {
  const id = els.taskId.value.trim();
  if (!id) return;

  const task = state.tasks.find(t => t.id === id);
  const ok = confirm(`Delete "${task?.title || "this task"}"?`);
  if (!ok) return;

  els.deleteBtn.disabled = true;
  try {
    await deleteTask(id);
    closeModal();
  } catch (err) {
    alert(err.message || String(err));
  } finally {
    els.deleteBtn.disabled = false;
  }
});

load().catch(err => {
  console.error(err);
  alert(err.message || String(err));
});
