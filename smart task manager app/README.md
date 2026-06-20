# Smart Task Manager

A modern, visually stunning task management app built with vanilla HTML, CSS, and JavaScript — zero dependencies.

## Features

- **Add tasks** — type a title and hit Enter or click Add
- **Mark as completed** — click the circular checkbox; tasks move to the Completed section
- **Delete tasks** — hover a task and click the trash icon (animated removal)
- **Filter view** — toggle between All, Pending, and Completed
- **Live counters** — total, pending, and done counts update in real time
- **Persistent storage** — tasks survive page reloads via `localStorage`
- **Responsive** — works on mobile, tablet, and desktop
- **Accessible** — keyboard navigable with focus-visible indicators

## How to Run

No build step required. Just open `index.html` in any modern browser:

```
# Option A: double-click index.html

# Option B: local server
npx -y serve .
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Structure | HTML5 (semantic) |
| Styling | Vanilla CSS (custom properties, glassmorphism, animations) |
| Logic | Vanilla JavaScript (ES6+ classes, localStorage) |
| Fonts | [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts |

## Folder Structure

```
smart-task-manager/
├── index.html              # Entry point
├── css/
│   └── style.css           # Design system & component styles
├── js/
│   ├── taskManager.js      # TaskManager class (CRUD + persistence)
│   └── app.js              # DOM wiring & render logic
├── assets/
│   └── favicon.svg         # App icon
└── README.md               # This file
```

## Architecture

```
┌──────────────┐       ┌───────────────┐
│   index.html │──────▶│   style.css   │
│   (UI shell) │       │ (design sys.) │
└──────┬───────┘       └───────────────┘
       │
       ▼
┌──────────────┐       ┌───────────────┐
│    app.js    │──────▶│ taskManager.js│
│ (DOM wiring) │       │ (data + CRUD) │
└──────────────┘       └───────┬───────┘
                               │
                               ▼
                       ┌───────────────┐
                       │ localStorage  │
                       │ (persistence) │
                       └───────────────┘
```
