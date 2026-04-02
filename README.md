# Finance Data Processing and Access Control Backend

A clean, well-structured REST API backend for a finance dashboard system. Built with **Node.js**, **Express**, and **SQLite** (via `better-sqlite3`).

---

## Tech Stack

| Layer        | Choice              | Reason                                      |
|--------------|---------------------|---------------------------------------------|
| Runtime      | Node.js             | Familiar, lightweight, fast for I/O         |
| Framework    | Express             | Minimal, flexible, widely supported         |
| Database     | SQLite (better-sqlite3) | Zero-config, file-based, great for assessment |
| Auth         | JWT (jsonwebtoken)  | Stateless, portable                         |
| Validation   | express-validator   | Declarative, chainable rules                |
| Password     | bcryptjs            | Secure hashing                              |
| Rate limiting| express-rate-limit  | Simple abuse protection                     |
| Testing      | Jest + Supertest    | Standard Node testing stack                 |

---

## Project Structure

```
finance-backend/
├── src/
│   ├── app.js                  # Express app entry point
│   ├── controllers/
│   │   ├── authController.js   # Register, login, me
│   │   ├── userController.js   # CRUD for users
│   │   ├── recordController.js # CRUD for financial records
│   │   └── dashboardController.js # Analytics & summaries
│   ├── middleware/
│   │   ├── auth.js             # JWT verification + role guards
│   │   ├── validate.js         # Input validation rules
│   │   └── errorHandler.js     # Central error + 404 handling
│   ├── models/
│   │   ├── db.js               # SQLite connection + schema
│   │   ├── User.js             # User queries
│   │   └── Record.js           # Financial record queries + aggregations
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── records.js
│   │   └── dashboard.js
│   └── utils/
│       └── seed.js             # Sample data seeder
├── tests/
│   └── api.test.js
├── data/                       # SQLite DB lives here (auto-created)
├── .env.example
├── package.json
└── README.md
```

---

## Setup & Running

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env and set JWT_SECRET to a strong secret
```

### 3. Seed sample data
```bash
npm run seed
```
This creates 3 users and 15 financial records:

| Role    | Email                  | Password    |
|---------|------------------------|-------------|
| Admin   | admin@example.com      | admin123    |
| Analyst | analyst@example.com    | analyst123  |
| Viewer  | viewer@example.com     | viewer123   |

### 4. Start the server
```bash
npm start        # production
npm run dev      # development with auto-reload (nodemon)
```

### 5. Run tests
```bash
npm test
```

---

## Role-Based Access Control

| Action                        | Viewer | Analyst | Admin |
|-------------------------------|--------|---------|-------|
| View financial records        | ✅     | ✅      | ✅    |
| Create financial records      | ❌     | ✅      | ✅    |
| Update own financial records  | ❌     | ✅      | ✅    |
| Update any financial record   | ❌     | ❌      | ✅    |
| Delete financial records      | ❌     | ❌      | ✅    |
| View dashboard & analytics    | ❌     | ✅      | ✅    |
| View users list               | ❌     | ❌      | ✅    |
| Update own profile            | ✅     | ✅      | ✅    |
| Update any user / change role | ❌     | ❌      | ✅    |
| Delete users                  | ❌     | ❌      | ✅    |

---

## API Reference

### Authentication

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secure123",
  "role": "viewer"         // optional, defaults to "viewer"
}
```

#### Login
```
POST /api/auth/login

{
  "email": "admin@example.com",
  "password": "admin123"
}

Response:
{
  "token": "<JWT>",
  "user": { "id": 1, "name": "...", "role": "admin", ... }
}
```

#### Get Current User
```
GET /api/auth/me
Authorization: Bearer <token>
```

---

### Users  *(Admin only for list/delete; any user can view/update themselves)*

| Method | Endpoint        | Access      | Description         |
|--------|-----------------|-------------|---------------------|
| GET    | /api/users      | Admin       | List all users      |
| GET    | /api/users/:id  | Auth        | Get user by ID      |
| PUT    | /api/users/:id  | Auth/Admin  | Update user         |
| DELETE | /api/users/:id  | Admin       | Delete user         |

Query params for `GET /api/users`: `?status=active|inactive`

---

### Financial Records

| Method | Endpoint          | Access           | Description             |
|--------|-------------------|------------------|-------------------------|
| GET    | /api/records      | Auth (any role)  | List records (paginated)|
| GET    | /api/records/:id  | Auth (any role)  | Get record by ID        |
| POST   | /api/records      | Analyst + Admin  | Create record           |
| PUT    | /api/records/:id  | Analyst + Admin  | Update record           |
| DELETE | /api/records/:id  | Admin only       | Soft-delete record      |

**Query filters for `GET /api/records`:**
```
?type=income|expense
&category=Salary
&startDate=2024-01-01
&endDate=2024-03-31
&page=1
&limit=20
```

**Create/Update body:**
```json
{
  "amount": 1500.00,
  "type": "income",
  "category": "Salary",
  "date": "2024-06-01",
  "notes": "Monthly salary"
}
```

---

### Dashboard  *(Analyst + Admin)*

| Endpoint                        | Description                        |
|---------------------------------|------------------------------------|
| GET /api/dashboard              | Full dashboard (all metrics)       |
| GET /api/dashboard/summary      | Total income, expenses, net balance|
| GET /api/dashboard/categories   | Totals grouped by category         |
| GET /api/dashboard/trends/monthly | Monthly income vs expense trends |
| GET /api/dashboard/trends/weekly  | Last 12 weeks trends             |
| GET /api/dashboard/activity     | Recent records (default: 10)       |

**Query params:**
```
/api/dashboard/summary?startDate=2024-01-01&endDate=2024-12-31
/api/dashboard/categories?type=expense
/api/dashboard/trends/monthly?year=2024
/api/dashboard/activity?limit=5
```

**Sample summary response:**
```json
{
  "summary": {
    "total_income": 17200,
    "total_expenses": 4900,
    "net_balance": 12300,
    "total_records": 15
  }
}
```

---

## Error Responses

All errors follow a consistent format:

```json
{ "error": "Human-readable error message" }
```

Validation errors:
```json
{
  "errors": [
    { "field": "amount", "message": "Amount must be a positive number" },
    { "field": "type",   "message": "Type must be income or expense" }
  ]
}
```

| Status | Meaning                        |
|--------|--------------------------------|
| 200    | Success                        |
| 201    | Created                        |
| 401    | Missing/invalid/expired token  |
| 403    | Insufficient role              |
| 404    | Resource not found             |
| 409    | Conflict (duplicate email)     |
| 422    | Validation error               |
| 429    | Rate limit exceeded            |
| 500    | Internal server error          |

---

## Assumptions & Design Decisions

1. **SQLite for storage** — chosen for zero-config simplicity; switching to PostgreSQL/MySQL requires only changing the `db.js` driver.
2. **Soft deletes on records** — financial data is sensitive; deleted records are hidden via `deleted_at` timestamp rather than permanently removed.
3. **Role hierarchy**: `viewer < analyst < admin`. Viewers have read-only access to records but cannot access analytics/dashboard.
4. **Analysts can create and edit their own records** but cannot delete. Only admins can delete.
5. **JWT expiry is 8 hours** — reasonable for a workday session. Refresh tokens are out of scope.
6. **Rate limiting** — 100 requests per 15 minutes per IP applied globally.
7. **Password hashing** — bcrypt with 10 salt rounds.
8. **No soft delete for users** — user deletion is hard delete; records created by deleted users remain (FK is set at insert time).

---

## Optional Enhancements Included

- ✅ JWT authentication
- ✅ Pagination for record listing
- ✅ Category & date filtering / search
- ✅ Soft delete for financial records
- ✅ Rate limiting
- ✅ Unit + integration tests (Jest + Supertest)
- ✅ Seed script for sample data
