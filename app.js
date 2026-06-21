/**
 * app.js — DOM wiring, event listeners, and render logic.
 * Connects the TaskManager backend to the HTML frontend.
 * Supports: search, priority, due dates, dark/light theme toggle.
 */

(function () {
  'use strict';

  /* ---- Initialization ---- */

  const manager = new TaskManager();
  let currentFilter = 'all';
  let searchQuery = '';

  /* ---- DOM References ---- */

  const taskForm          = document.getElementById('task-form');
  const taskInput         = document.getElementById('task-input');
  const taskPriority      = document.getElementById('task-priority');
  const taskDueDate       = document.getElementById('task-due-date');
  const filterBar         = document.getElementById('filter-bar');
  const filterBtns        = filterBar.querySelectorAll('.filter-btn');
  const searchInput       = document.getElementById('search-input');
  const searchClear       = document.getElementById('search-clear');
  const themeToggle       = document.getElementById('theme-toggle');
  const taskListPending   = document.getElementById('task-list-pending');
  const taskListCompleted = document.getElementById('task-list-completed');
  const sectionPending    = document.getElementById('section-pending');
  const sectionCompleted  = document.getElementById('section-completed');
  const emptyState        = document.getElementById('empty-state');
  const emptyEmoji        = emptyState.querySelector('.empty-state__emoji');
  const emptyText         = emptyState.querySelector('.empty-state__text');
  const countTotalVal     = document.getElementById('count-total-value');
  const countPendingVal   = document.getElementById('count-pending-value');
  const countDoneVal      = document.getElementById('count-done-value');
  const htmlEl            = document.documentElement;

  /* ---- Theme ---- */

  const THEME_KEY = 'smart-task-manager-theme';

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) {
      htmlEl.setAttribute('data-theme', saved);
    }
    // else: defaults to "dark" from the HTML attribute
  }

  function toggleTheme() {
    const current = htmlEl.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    htmlEl.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
  }

  initTheme();

  /* ---- Event Listeners ---- */

  // Theme toggle
  themeToggle.addEventListener('click', toggleTheme);

  // Add task
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = taskInput.value;
    const priority = taskPriority.value;
    const dueDate = taskDueDate.value || null;

    const task = manager.addTask(title, priority, dueDate);
    if (task) {
      taskInput.value = '';
      taskDueDate.value = '';
      taskPriority.value = 'medium';
      render();
    } else {
      // Quick shake on empty submit
      taskInput.classList.add('shake');
      setTimeout(() => taskInput.classList.remove('shake'), 400);
    }
    taskInput.focus();
  });

  // Search — live filtering on input
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    searchClear.hidden = !searchQuery;
    render();
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    searchClear.hidden = true;
    render();
    searchInput.focus();
  });

  // Filter buttons
  filterBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    currentFilter = btn.dataset.filter;
    filterBtns.forEach((b) => b.classList.remove('filter-btn--active'));
    btn.classList.add('filter-btn--active');
    render();
  });

  // Task actions via event delegation (checkbox + delete)
  document.getElementById('task-sections').addEventListener('click', (e) => {
    // Toggle complete
    const checkbox = e.target.closest('.task-card__checkbox');
    if (checkbox) {
      const card = checkbox.closest('.task-card');
      const id = card.dataset.id;
      manager.toggleTask(id);
      render();
      return;
    }

    // Delete
    const deleteBtn = e.target.closest('.task-card__delete');
    if (deleteBtn) {
      const card = deleteBtn.closest('.task-card');
      const id = card.dataset.id;

      // Animate out, then remove
      card.classList.add('fade-out');
      card.addEventListener('animationend', () => {
        manager.deleteTask(id);
        render();
      }, { once: true });
    }
  });

  /* ---- Render ---- */

  function render() {
    // Use search if there's a query, otherwise plain filter
    const pendingTasks   = searchQuery
      ? manager.searchTasks(searchQuery, 'pending')
      : manager.getTasks('pending');
    const completedTasks = searchQuery
      ? manager.searchTasks(searchQuery, 'completed')
      : manager.getTasks('completed');

    // Decide visibility based on current filter
    const showPending   = currentFilter === 'all' || currentFilter === 'pending';
    const showCompleted = currentFilter === 'all' || currentFilter === 'completed';

    // Render pending list (hide section entirely if filter is off OR list is empty)
    if (showPending) {
      renderList(taskListPending, pendingTasks, false);
    }
    sectionPending.hidden = !showPending || pendingTasks.length === 0;

    // Render completed list
    if (showCompleted) {
      renderList(taskListCompleted, completedTasks, true);
    }
    sectionCompleted.hidden = !showCompleted || completedTasks.length === 0;

    // Empty state — show only when no tasks are visible in any section
    const visibleCount =
      (showPending ? pendingTasks.length : 0) +
      (showCompleted ? completedTasks.length : 0);

    if (visibleCount === 0) {
      emptyState.hidden = false;
      setEmptyMessage();
    } else {
      emptyState.hidden = true;
    }

    // Update counters
    updateCounters();
  }

  /**
   * Render a list of tasks into a <ul>.
   */
  function renderList(container, tasks, isCompleted) {
    container.innerHTML = '';

    tasks.forEach((task, i) => {
      const li = document.createElement('li');
      li.className = 'task-card' + (isCompleted ? ' task-card--completed' : '');
      li.dataset.id = task.id;
      li.style.animationDelay = `${i * 0.04}s`;

      // Priority badge
      const priorityLabel = { high: '🔴 High', medium: '🟡 Med', low: '🟢 Low' };
      const priorityClass = `task-card__priority task-card__priority--${task.priority || 'medium'}`;

      // Due date display
      let dueDateHTML = '';
      if (task.dueDate) {
        const isOverdue = !task.completed && isDateOverdue(task.dueDate);
        const dueDateFormatted = formatDate(task.dueDate);
        const overdueClass = isOverdue ? ' task-card__due--overdue' : '';
        dueDateHTML = `
          <span class="task-card__due${overdueClass}" title="${isOverdue ? 'Overdue!' : 'Due date'}">
            <svg class="task-card__due-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            ${dueDateFormatted}
          </span>`;
      }

      li.innerHTML = `
        <button class="task-card__checkbox ${task.completed ? 'task-card__checkbox--checked' : ''}"
                aria-label="${task.completed ? 'Mark as pending' : 'Mark as completed'}"
                title="${task.completed ? 'Mark as pending' : 'Mark as completed'}"></button>
        <div class="task-card__body">
          <span class="task-card__title">${escapeHTML(task.title)}</span>
          <div class="task-card__meta">
            <span class="${priorityClass}">${priorityLabel[task.priority] || '🟡 Med'}</span>
            ${dueDateHTML}
          </div>
        </div>
        <button class="task-card__delete" aria-label="Delete task" title="Delete task">
          <svg class="task-card__delete-icon" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/>
            <path d="M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      `;

      container.appendChild(li);
    });
  }

  /* ---- Helpers ---- */

  /**
   * Check if a date string (YYYY-MM-DD) is in the past.
   */
  function isDateOverdue(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr + 'T00:00:00');
    return due < today;
  }

  /**
   * Format a YYYY-MM-DD string into a more readable form (e.g. "Jun 21").
   */
  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  }

  /**
   * Update the counter badges with animation.
   */
  function updateCounters() {
    const counts = manager.getCounts();

    animateCounter(countTotalVal, counts.total);
    animateCounter(countPendingVal, counts.pending);
    animateCounter(countDoneVal, counts.completed);
  }

  function animateCounter(el, value) {
    const prev = el.textContent;
    el.textContent = value;
    if (prev !== String(value)) {
      el.classList.remove('bump');
      // Force reflow to restart animation
      void el.offsetWidth;
      el.classList.add('bump');
    }
  }

  /**
   * Set the appropriate empty-state message based on the current filter.
   */
  function setEmptyMessage() {
    if (searchQuery) {
      emptyEmoji.textContent = '🔍';
      emptyText.textContent  = `No tasks matching "${searchQuery}"`;
      return;
    }
    switch (currentFilter) {
      case 'pending':
        emptyEmoji.textContent = '🎉';
        emptyText.textContent  = 'All caught up! No pending tasks.';
        break;
      case 'completed':
        emptyEmoji.textContent = '📝';
        emptyText.textContent  = 'No completed tasks yet. Keep going!';
        break;
      default:
        emptyEmoji.textContent = '✨';
        emptyText.textContent  = 'No tasks yet. Add one above!';
    }
  }

  /**
   * Escape HTML to prevent XSS in task titles.
   */
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /* ---- Initial Render ---- */
  render();
})();
