# Finance Dashboard Backend

This is a simple backend project for a finance dashboard system.

The project is made in a basic way on purpose. The code is kept easy to read and easy to explain, like a student project for practice or placements.

## Tech Used

- Node.js
- Express.js
- JSON Web Token (JWT)
- MongoDB
- Mongoose

## Features

- User roles:
  - Viewer
  - Analyst
  - Admin
- User management for Admin
- User status management using active and inactive
- Login with JWT
- Financial records CRUD
- Dashboard summary
- Simple role-based middleware
- Basic validation
- Basic pagination in records list
- Soft delete for financial records
- Simple rate limiting
- Simple frontend to view API output
- Basic unit tests for validation and controller logic

## Project Structure

```text
config/
  db.js
src/
  app.js
  server.js
  controllers/
    authController.js
    recordController.js
    dashboardController.js
  middleware/
    authMiddleware.js
    rateLimitMiddleware.js
    roleMiddleware.js
    validationMiddleware.js
  models/
    User.js
    FinancialRecord.js
  routes/
    authRoutes.js
    recordRoutes.js
    dashboardRoutes.js
public/
  index.html
  styles.css
  app.js
```

## How to Run

1. Install packages:

```bash
npm install
```

2. Start the server:

```bash
npm start
```

For development:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Server will run on:

```bash
http://localhost:5000
```

Open this in browser to use the frontend:

```bash
http://localhost:5000
```

## Environment File

Create a `.env` file like this:

```env
PORT=5000
MONGODB_URL=mongodb://127.0.0.1:27017/zorvyn
JWT_SECRET=simple_secret_key
```

## Demo Login Users

Sample users are added automatically when the database is empty.

Example users:

| Role | Email | Password |
|------|-------|----------|
| Viewer | arun@example.com | arun123 |
| Analyst | kavin@example.com | kavin123 |
| Admin | nivetha@example.com | nivetha123 |

You can also create more users using the register API.

## Sample Financial Records

Some sample finance records are also added automatically on first run.

## API Endpoints

### 1. Auth

#### `POST /api/auth/register`

Request body:

```json
{
  "name": "Edwin",
  "email": "edwin@example.com",
  "password": "edwin123",
  "role": "Viewer"
}
```

Notes:

- `role` is optional
- if `role` is not passed, user will be created as `Viewer`

#### `POST /api/auth/login`

Request body:

```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

Inactive users cannot log in.

### 2. User Management

All user management routes need Admin access.

#### `GET /api/users`

Returns all users without passwords.

#### `POST /api/users`

Creates a new user.

Sample body:

```json
{
  "name": "Meena",
  "email": "meena@example.com",
  "password": "meena123",
  "role": "Analyst",
  "status": "active"
}
```

#### `PATCH /api/users/:id/role`

Updates user role.

```json
{
  "role": "Admin"
}
```

#### `PATCH /api/users/:id/status`

Updates user status.

```json
{
  "status": "inactive"
}
```

### 3. Financial Records

All record routes need `Authorization: Bearer <token>`

#### `GET /api/records`

Optional query:

- `page`
- `limit`

Example:

```bash
GET /api/records?page=1&limit=5
```

#### `GET /api/records/:id`

#### `POST /api/records`

Allowed roles:

- Analyst
- Admin

Sample body:

```json
{
  "title": "New Revenue",
  "category": "Revenue",
  "amount": 4500,
  "type": "income",
  "date": "2026-04-03",
  "note": "April entry"
}
```

#### `PUT /api/records/:id`

Allowed roles:

- Analyst
- Admin

#### `DELETE /api/records/:id`

Allowed role:

- Admin

This route does soft delete.
The record stays in database, but `isDeleted` becomes `true`.

Viewer users can only see their own records.
Analyst and Admin can see all records.

### 4. Dashboard

#### `GET /api/dashboard/summary`

This returns:

- total records
- total income
- total expense
- total balance
- category breakdown

#### `GET /api/dashboard/categories`

This returns category-wise totals with:

- income per category
- expense per category
- combined total per category

#### `GET /api/dashboard/recent-activity`

Optional query:

- `limit`

Example:

```bash
GET /api/dashboard/recent-activity?limit=5
```

This returns the latest records for dashboard activity section.

#### `GET /api/dashboard/trends`

Optional query:

- `type=monthly`
- `type=weekly`

Example:

```bash
GET /api/dashboard/trends?type=monthly
```

This returns trend data for:

- income
- expense
- balance

## Role Access Summary

- Viewer:
  - Can see only own records
  - Can see dashboard summary only for own records
- Analyst:
  - Can see all records
  - Can add and update records
  - Can see dashboard summary
- Admin:
  - Full access
  - Can manage users
  - Can update user role and active status

## Assumptions

- This project is for learning/demo purpose.
- MongoDB is running locally on `mongodb://127.0.0.1:27017`.
- Authentication is basic and not production-ready.
- Passwords are stored in hashed format using `bcryptjs`.

## Limitations

- No refresh token support.
- Validation is basic and can be improved.
- Only basic unit tests are added. Full integration tests are not added yet.
- Error handling is simple and not centralized.
- Rate limiting is stored in memory, so it resets when server restarts.
- Soft deleted records are hidden from normal APIs, but there is no restore API yet.
- Old databases created before ownership support may need reseeding or manual update for record user links.

## Notes

- The code is intentionally kept simple instead of highly optimized.
- Some decisions are basic on purpose so the project feels realistic for a student-level backend.
