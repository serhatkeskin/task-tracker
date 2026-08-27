# Task Tracker

A modern, real-time team task management platform: create, assign, filter, and track tasks across workspaces with instant live sync and discussions.

## Stack

| Layer | Choice |
| --- | --- |
| API | Django 5.1, Django REST Framework, SimpleJWT |
| Realtime | Django Channels over Redis pub/sub |
| Database | PostgreSQL 16 |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4 |
| Tooling | Docker Compose, GitHub Actions, Ruff, oxlint |

## Running it

```bash
cp .env.example .env
docker compose up --build -d
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed_demo
```

Then open http://localhost:5173.

Demo accounts (password: `demo12345` | Superuser: `admin` / `admin`):

| Username | Workspaces |
| --- | --- |
| `alice` | Engineering (admin) |
| `bob` | Engineering |
| `carol` | Engineering, Marketing (admin) |
| `dave` | Engineering, Marketing |
| `admin` | Superuser |

To see live updates, sign in as `alice` in one window and `bob` in another (or in a private window), then modify a task in one window to watch the updates broadcast instantly.

`seed_demo` is safe to re-run. It upserts on natural keys rather than wiping tables, keeping primary keys stable.

## Features

- **Workspace Management**: Multi-tenant workspace isolation with role-based member permissions.
- **Task Management**: Create, edit, assign, soft-delete, and update task statuses.
- **Real-Time Collaboration**: Instant live task updates pushed over WebSockets (Django Channels + Redis).
- **Search & Advanced Filtering**: Debounced instant search, multi-select status and priority filters, assignee filtering, and overdue filters.
- **Due Dates & Priorities**: Visual overdue indicators, date offsets, and 4-tier priority ranking.
- **Task Discussions**: Threaded comment streams for tasks.
- **JWT Authentication**: Secure token-based auth with auto-refresh mechanism.


## API

Every endpoint except the token pair needs `Authorization: Bearer <access>`.

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/api/auth/token/` | `{username, password}` → `{access, refresh}` |
| `POST` | `/api/auth/token/refresh/` | `{refresh}` → `{access}` |
| `GET` | `/api/auth/me/` | The current user |
| `GET` | `/api/workspaces/` | Only workspaces you belong to |
| `GET` `POST` | `/api/workspaces/<id>/tasks/` | List and create |
| `GET` `PATCH` `DELETE` | `/api/tasks/<id>/` | Delete is soft |
| `GET` `POST` | `/api/tasks/<id>/comments/` | |
| `DELETE` | `/api/comments/<id>/` | Soft |
| `WS` | `/ws/workspaces/<id>/?token=<access>` | Server-to-client push only |

### Filter parameters

All apply to the task list. Unknown values return `400` rather than being ignored.

| Parameter | Example | Meaning |
| --- | --- | --- |
| `q` | `?q=readme` | Case-insensitive substring of title or description |
| `status` | `?status=todo,in_progress` | Any of `todo`, `in_progress`, `done` |
| `priority` | `?priority=urgent,high` | Any of `low`, `medium`, `high`, `urgent` |
| `assigned_to` | `?assigned_to=2,unassigned` | User ids, plus the literal `unassigned` |
| `overdue` | `?overdue=true` | Past due and not done |
| `ordering` | `?ordering=priority` | `created_at`, `due_date`, `priority`, `title`, each with a `-` prefix |
