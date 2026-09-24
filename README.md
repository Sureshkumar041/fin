# Expense Tracker

Monorepo with two independent apps:

| Folder      | Stack                                        | Dev URL               |
| ----------- | -------------------------------------------- | --------------------- |
| `backend/`  | Node.js, Express 5, TypeScript, TypeORM, PostgreSQL | http://localhost:8080/api |
| `frontend/` | Next.js (App Router), TypeScript, Tailwind CSS | http://localhost:3000 |

## Prerequisites

- Node.js 20.19+ (or 22.13+)
- PostgreSQL running locally

## Setup

```bash
# 1. Create the database
createdb -h localhost -U postgres expense_tracker

# 2. Backend
cd backend
npm install
cp .env.example .env        # then edit DB_USER / DB_PASSWORD
npm run dev                 # http://localhost:8080/api/health  (docs: http://localhost:8080/api-docs)

# 3. Frontend (new terminal)
cd frontend
npm install
cp .env.example .env.local
npm run dev                 # http://localhost:3000
```

## Useful scripts

Backend: `dev`, `build`, `start`, `typecheck`, `migration:generate`, `migration:create`, `migration:run`, `migration:revert`.

Frontend: `dev`, `build`, `start`, `lint`, `typecheck`.

Generate a migration after adding/changing an entity:

```bash
cd backend
npm run migration:generate -- src/migrations/InitialSchema
npm run migration:run
```

## Backend architecture

```
Route → Controller → Service → Repository (TypeORM) → PostgreSQL
```

| Folder              | Responsibility                                               |
| ------------------- | ------------------------------------------------------------ |
| `src/routes/`       | Map URL + method to a controller. No logic.                  |
| `src/controllers/`  | Read the request, call a service, send the response/status. |
| `src/services/`     | Business logic. No `req`/`res`, no SQL.                      |
| `src/repositories/` | Database access via TypeORM. Nothing else touches the DB.    |
| `src/entities/`     | TypeORM entity classes (table definitions).                  |
| `src/migrations/`   | Schema changes, generated from entities.                     |
| `src/middlewares/`  | Cross-cutting Express middleware (errors, later auth).       |
| `src/config/`       | Env vars and the TypeORM DataSource.                         |

See `health.*.ts` in each folder for a complete example.

## Postman

`postman/` contains the **Expense Tracker API** collection and the **Expense Tracker - Local**
environment (`baseUrl = http://localhost:8080/api`). Import both into Postman, select the
environment, and run **Auth → Register** / **Login** first. The auth cookie is handled
automatically by Postman's cookie jar.

Run the whole collection from the command line (also works in CI):

```bash
npx newman run postman/expense-tracker-api.postman_collection.json \
  -e postman/expense-tracker-local.postman_environment.json
```
