# BugFlow

BugFlow is a collaborative bug tracking system built to help software development teams efficiently report, manage, and resolve issues across projects.

The platform provides secure role-based access, real-time collaboration through comments and WebSockets, project management, issue tracking, notifications, and an AI-powered assistant — all within a modern full-stack Nx monorepo.

---

# 🚀 Tech Stack

## Monorepo
- Nx Workspace 22

## Frontend
- Angular 22 (standalone components, signals, facade pattern)
- Angular Router
- Auth0 Authentication
- TailwindCSS
- Chart.js (AI-generated charts)

## Backend
- NestJS
- TypeORM
- PostgreSQL (AWS RDS in production)
- JWT Authentication (RS256)
- Auth0 Authorization
- Socket.IO (real-time issues, comments and notifications)

## AI Assistant
- Anthropic (Claude) and DeepSeek providers, selectable from the chat widget
- Tool-based agent with access to live BugFlow data (issues, stats, charts)

## Testing
- Jest (unit tests)
- Playwright (E2E tests)

## Infrastructure & CI/CD
- Docker (local development)
- GitHub Actions (`quality-check.yml`, `deploy-staging.yml`)
- Vercel (frontend hosting)
- Railway (backend hosting)

---

# ✨ Features

## Authentication & Authorization
- Auth0 login integration
- JWT-based authentication
- Role-based access control
- Secure API protection with guards
- Refresh token support

## User Management
- Admin user management
- Role assignment (Admin, Developer, Tester)
- Automatic user synchronization

## Project Management
- Create and manage projects
- Invite collaborators
- Project ownership
- Team-based access restrictions

## Issue Tracking
- Create, edit, and manage issues
- Issue priorities
- Issue statuses
- Assignee management
- Filtering, sorting and pagination

## Comments & Collaboration
- Real-time issue discussions (WebSockets)
- Comment editing and deletion
- Ownership validation
- Activity tracking

## Notifications
- Assignment notifications
- Status change notifications
- Comment activity notifications
- Real-time delivery via WebSockets

## AI Assistant
- Chat widget available across the app
- Answers questions about issues, stats and workload using live data
- Can generate bar/pie/line charts on demand
- Switch between Anthropic and DeepSeek providers

## Security
- Helmet protection
- JWT validation
- CORS configuration
- Validation pipes
- Role guards
- Secure Auth0 integration

---

# 👥 User Roles

## Admin
- Full system access
- Manage users and projects
- Assign roles
- View all projects and issues

## Developer
- Work on assigned issues
- Create and update issues
- Participate in discussions
- Access assigned projects

## Tester
- Report bugs and issues
- Comment on issues
- Track issue progress
- Access assigned projects

---

# 📁 Monorepo Structure

```bash
.
|__api              # NestJS backend
|__web              # Angular frontend
|__shared-types     # Shared DTOs, enums, and interfaces
|__data-access      # Shared frontend data layer
|__realtime         # Shared WebSocket client (SocketService)
|__ui               # Shared UI components
|__api-e2e          # Backend E2E tests
|__web-e2e          # Frontend E2E tests (Playwright)
```

---

# ⚙️ Environment Variables

Create a `.env` file in the root directory (see `.env.example` for the full template):

```env
# --- Postgres (container) ---
POSTGRES_DB=
POSTGRES_USER=
POSTGRES_PASSWORD=

# --- API (NestJS) ---
DB_HOST=
DB_PORT=
DB_NAME=
DB_USERNAME=
DB_PASSWORD=
DB_SYNCHRONIZE=
NODE_ENV=development

# --- Auth0 (NestJS) ---
AUTH0_DOMAIN=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=

# --- Seed Configuration ---
DB_NO_SSL=
ENABLE_SEED=

# --- AI API (Anthropic) ---
ANTHROPIC_API_KEY=

# --- AI API (DeepSeek) ---
DEEPSEEK_API_KEY=

# --- E2E user (used by the Playwright auth setup project) ---
E2E_USER_EMAIL=
E2E_USER_PASSWORD=
```

> 💡 Ask an admin for the shared Auth0 dev credentials and API keys if you don't have them yet.

---

# 📦 Installation

## Clone the repository

```bash
git clone https://github.com/cesar-sandoval-uno/bugflow-2026.git
cd bugflow-2026
```

## Install dependencies

```bash
npm install
```

---

# ▶️ Running the Application

You can run BugFlow either directly with Node, or fully containerized with Docker.

## Option A — Local (Node + your own Postgres)

```bash
npm run dev
```

This runs the `api` and `web` targets in parallel via Nx.

## Option B — Docker (recommended, matches how the team develops locally)

```bash
docker compose -f docker-compose.dev.yml up
```

This spins up Postgres, the NestJS API (with hot reload via `ts-node-dev`) and the Angular dev server, all wired together — no need to install Postgres locally.

- Frontend: http://localhost:4200
- API: http://localhost:3000/api
- Swagger docs: http://localhost:3000/api/docs

## Production build

```bash
npm run build
```

---

# 🧪 Test Users

To make it easy to test the app without creating your own Auth0 account, use one of these seeded accounts. All three share the same password:

| Email | Role | Password |
|---|---|---|
| `test@bugflow.com` | Admin | `Test1234!` |
| `dev@bugflow.com` | Developer | `Test1234!` |
| `tester@bugflow.com` | Tester | `Test1234!` |

These users (along with 5 sample projects, 100 issues and 100 comments) are created by the seed script. To (re)generate them locally:

```bash
ENABLE_SEED=true npm run seed
```

> ⚠️ The seed script clears and regenerates issues/comments on every run — avoid running it against a shared environment unless that's the intent (it also runs automatically on staging on every push to `dev`).

---

# 🧪 Testing

## Unit tests

```bash
nx test api
nx test web
```

## E2E tests (Playwright)

```bash
nx e2e web-e2e
```

E2E tests require `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` in your `.env` for the authenticated project (`chromium-authenticated`) to log in via Auth0.

---

# 🚢 Deployment

BugFlow ships via GitHub Actions:

- **`quality-check.yml`** — runs lint + unit tests on every PR to `dev`/`main`.
- **`deploy-staging.yml`** — on push to `dev`, runs quality checks, deploys the frontend to **Vercel** and the backend to **Railway**, re-seeds the staging DB, and runs an E2E smoke test against the deployed app.

| Environment | Frontend | Backend |
|---|---|---|
| Staging | Vercel (preview) | Railway |
| Production | Vercel (production) | Railway |

---

# 🔐 Security Notes

BugFlow includes several security best practices:

- RS256 JWT validation
- Auth0 integration
- Secure role validation
- ValidationPipe sanitization
- Helmet middleware
- Restricted CORS configuration
- Refresh token rotation support
- Secure environment variable usage

---

# 📚 API Documentation

Swagger documentation is available during development:

```bash
http://localhost:3000/api/docs
```

---

# 🛣️ Roadmap

Planned improvements:

- Run Playwright E2E tests as part of the CI pipeline (currently only in `deploy-staging.yml`'s smoke test)
- Finish remaining unit test coverage (`issues.service.ts`, controller specs)
- Project membership: ownership enforcement, scoped access to issues/comments, auto-add owner on project creation, UI for inviting/removing members
- Reporter notifications (currently a stub)
- Kanban board view (drag-and-drop status changes)
- Attachments: upload screenshots or logs to issues
- Email notifications for issue updates
- Audit logs for tracking user actions

---

# 📄 License

This project is licensed under the MIT License.
