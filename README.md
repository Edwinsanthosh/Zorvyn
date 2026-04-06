# Finance Dashboard Backend

A simple finance dashboard backend built with `Node.js`, `Express`, `MongoDB`, and `Mongoose`.

This project is intentionally kept practical and easy to follow. It includes authentication, role-based access, finance record CRUD, dashboard summary APIs, basic validation, seeded demo data, and a small frontend for testing APIs visually.

## Stack

- `Node.js`
- `Express.js`
- `MongoDB`
- `Mongoose`
- `JWT`
- `bcryptjs`

## Main Features

- JWT-based register and login
- Refresh token flow for renewing access tokens
- Passwords stored in hashed format using `bcryptjs`
- User roles:
  - `Viewer`
  - `Analyst`
  - `Admin`
- User management for admins
- User status support:
  - `active`
  - `inactive`
- Financial record CRUD
- Soft delete for records
- Restore API for soft-deleted records
- Dashboard aggregation APIs
- Role-based route protection
- Basic request validation
- Centralized error handler
- Pagination for records
- Filtering for records
- In-memory rate limiting
- Seed data for users and records
- Lightweight test runner
- Swagger API documentation
- Frontend pages for:
  - visual testcase view
  - custom API testing

## Project Structure

```text
config/
  db.js

public/
  index.html
  tests.html
  tests.js
  api-tester.html
  api-tester.js
  styles.css

src/
  app.js
  server.js
  controllers/
    authController.js
    dashboardController.js
    recordController.js
    userController.js
  data/
    seedData.js
  middleware/
    authMiddleware.js
    rateLimitMiddleware.js
    roleMiddleware.js
    validationMiddleware.js
  models/
    FinancialRecord.js
    User.js
  routes/
    authRoutes.js
    dashboardRoutes.js
    recordRoutes.js
    userRoutes.js

tests/
  helpers.js
  runTests.js
```

## Setup

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
PORT=5000
MONGODB_URL=mongodb://127.0.0.1:27017/zorvyn
JWT_SECRET=simple_secret_key
REFRESH_SECRET=refresh_secret_key
```

Run in development:

```bash
npm run dev
```

Run in normal mode:

```bash
npm start
```

Run tests:

```bash
npm test
```

If Swagger dependencies were just added in your local copy, run:

```bash
npm install
```

Server default URL:

```text
http://localhost:5000
```

## Frontend Pages

The backend also serves a small frontend from the `public` folder.

- Home page:
  - `http://localhost:5000/`
- Swagger docs page:
  - `http://localhost:5000/api-docs`
- Visual testcase page:
  - `http://localhost:5000/tests.html`
- Custom API tester page:
  - `http://localhost:5000/api-tester.html`

## Authentication

### Register

`POST /api/auth/register`

Sample body:

```json
{
  "name": "Meena",
  "email": "meena@example.com",
  "password": "meena123",
  "role": "Viewer"
}
```

Notes:

- `role` is optional
- default role is `Viewer`
- password is hashed before saving
- response also returns a refresh token

### Login

`POST /api/auth/login`

Sample body:

```json
{
  "email": "nivetha@example.com",
  "password": "nivetha123"
}
```

Notes:

- inactive users cannot log in
- successful login returns JWT token and user details
- login also returns a refresh token

### Refresh token

`POST /api/auth/refresh`

Sample body:

```json
{
  "refreshToken": "your_refresh_token_here"
}
```

Returns:

- new access token
- new refresh token

### Logout

`POST /api/auth/logout`

Sample body:

```json
{
  "refreshToken": "your_refresh_token_here"
}
```

## Roles

### Viewer

- can view only their own records
- can view dashboard data based on only their own records
- cannot create, update, or delete records

### Analyst

- can view records
- can create records
- can update records
- cannot delete records

### Admin

- full record access
- can delete records
- can manage users

## User Management APIs

All user management routes require `Admin` role.

### Get all users

`GET /api/users`

Returns all users without passwords.

### Create user by admin

`POST /api/users`

Sample body:

```json
{
  "name": "Priya",
  "email": "priya@example.com",
  "password": "priya123",
  "role": "Analyst",
  "status": "active"
}
```

### Update user role

`PATCH /api/users/:id/role`

Sample body:

```json
{
  "role": "Admin"
}
```

### Update user status

`PATCH /api/users/:id/status`

Sample body:

```json
{
  "status": "inactive"
}
```

## Financial Record APIs

All record routes require:

```text
Authorization: Bearer <token>
```

### Get all records

`GET /api/records`

Supports pagination:

- `page`
- `limit`

Supports filtering:

- `category`
- `type`
- `date`
- `fromDate`
- `toDate`
- `minAmount`
- `maxAmount`

Example:

```text
/api/records?page=1&limit=5&type=income&fromDate=2026-04-01&toDate=2026-04-10
```

### Get one record

`GET /api/records/:id`

### Create record

`POST /api/records`

Allowed roles:

- `Analyst`
- `Admin`

Sample body:

```json
{
  "title": "April Revenue",
  "category": "Revenue",
  "amount": 45000,
  "type": "income",
  "date": "2026-04-04",
  "note": "Collected from branch"
}
```

### Update record

`PUT /api/records/:id`

Allowed roles:

- `Analyst`
- `Admin`

### Delete record

`DELETE /api/records/:id`

Allowed role:

- `Admin`

This is a soft delete. The document stays in the database, but:

- `isDeleted` becomes `true`
- `deletedAt` is set

### Restore deleted record

`PATCH /api/records/:id/restore`

Allowed role:

- `Admin`

This restores a soft-deleted record by setting:

- `isDeleted` back to `false`
- `deletedAt` back to `null`

## Dashboard APIs

All dashboard routes require login.

### Summary

`GET /api/dashboard/summary`

Returns values like:

- total income
- total expense
- total balance
- total records
- category breakdown

### Category totals

`GET /api/dashboard/categories`

Returns totals grouped by category.

### Recent activity

`GET /api/dashboard/recent-activity`

Optional query:

- `limit`

### Trends

`GET /api/dashboard/trends`

Optional query:

- `type=monthly`
- `type=weekly`

## Validation

Basic request validation is implemented in `validationMiddleware`.

It checks fields like:

- required fields
- email format
- password length
- valid role values
- valid status values
- non-empty title and category
- non-negative amount
- valid date values

There is also basic Mongoose schema validation in the models.

## Seed Data

Seed data is added automatically when the database is empty.

### Demo Users

| Role | Status | Email | Password |
|------|--------|-------|----------|
| Viewer | active | arun@example.com | arun123 |
| Viewer | active | meena@example.com | meena123 |
| Analyst | active | kavin@example.com | kavin123 |
| Analyst | active | priya@example.com | priya123 |
| Admin | active | nivetha@example.com | nivetha123 |
| Admin | inactive | suresh@example.com | suresh123 |

### Seeded Records

The project seeds multiple finance records across:

- revenue
- office expense
- operations
- tools
- marketing
- equipment
- training
- services

This helps with:

- dashboard totals
- trend data
- pagination
- filtering demos
- role-based record visibility

## Tests

This project includes a lightweight custom test runner.

Run:

```bash
npm test
```

The tests cover areas like:

- register and login validation
- invalid role checks
- duplicate user flow
- dashboard summary logic
- recent activity
- trends
- pagination shape
- missing record handling
- soft delete behavior
- role-based access behavior

## Notes

- Viewers only see their own records because records are linked to a user.
- Analysts and admins can view broader data based on route rules.
- Passwords are hashed before storing in MongoDB.
- Rate limiting is simple and stored in memory.
- The frontend is only for demo/testing and is not a production UI.
- Errors now go through one central error middleware so responses stay more consistent.

## Limitations

- Rate limiting resets when the server restarts
- Tests are lightweight and not full DB integration tests
- Date is stored as a string in records, which is simple for demo use but not ideal for larger real-world systems

## Developer Notes

This project is written in a clean but simple style. The goal was to keep the code readable and easy to explain in interviews, demos, or academic presentations without adding unnecessary architecture.
