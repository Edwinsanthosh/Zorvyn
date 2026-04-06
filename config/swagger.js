const swaggerUi = require("swagger-ui-express");

function createSwaggerSpec() {
  const localServer = process.env.API_BASE_URL || "http://localhost:5000";

  return {
    openapi: "3.0.0",
    info: {
      title: "Zorvyn Finance Dashboard API",
      version: "1.0.0",
      description: "Simple finance dashboard backend with auth, user roles, records, dashboard APIs, and soft delete support."
    },
    servers: [
      { url: localServer, description: "Local server" },
      { url: "https://zorvyn-o2e7.onrender.com", description: "Hosted Render server" }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        RegisterBody: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", example: "Meena" },
            email: { type: "string", example: "meena@example.com" },
            password: { type: "string", example: "meena123" },
            role: { type: "string", example: "Viewer" }
          }
        },
        LoginBody: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", example: "nivetha@example.com" },
            password: { type: "string", example: "nivetha123" }
          }
        },
        RefreshBody: {
          type: "object",
          required: ["refreshToken"],
          properties: {
            refreshToken: { type: "string", example: "your_refresh_token_here" }
          }
        },
        UserCreateBody: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", example: "Priya" },
            email: { type: "string", example: "priya@example.com" },
            password: { type: "string", example: "priya123" },
            role: { type: "string", example: "Analyst" },
            status: { type: "string", example: "active" }
          }
        },
        RecordBody: {
          type: "object",
          required: ["title", "category", "amount", "type", "date"],
          properties: {
            title: { type: "string", example: "April Revenue" },
            category: { type: "string", example: "Revenue" },
            amount: { type: "number", example: 45000 },
            type: { type: "string", example: "income" },
            date: { type: "string", example: "2026-04-04" },
            note: { type: "string", example: "Collected from branch" }
          }
        }
      }
    },
    tags: [
      { name: "Health", description: "Basic server health route" },
      { name: "Auth", description: "Authentication and token routes" },
      { name: "Users", description: "Admin user management routes" },
      { name: "Records", description: "Financial record CRUD routes" },
      { name: "Dashboard", description: "Dashboard summary and trend routes" }
    ],
    paths: {
      "/api": {
        get: {
          tags: ["Health"],
          summary: "Get API health status",
          responses: {
            200: {
              description: "Server is running"
            }
          }
        }
      },
      "/api/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a new user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegisterBody" }
              }
            }
          },
          responses: {
            201: { description: "User registered successfully" },
            400: { description: "Validation error or duplicate email" }
          }
        }
      },
      "/api/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginBody" }
              }
            }
          },
          responses: {
            200: { description: "Login successful" },
            401: { description: "Invalid credentials" },
            403: { description: "Inactive user" }
          }
        }
      },
      "/api/auth/refresh": {
        post: {
          tags: ["Auth"],
          summary: "Refresh access token",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RefreshBody" }
              }
            }
          },
          responses: {
            200: { description: "Token refreshed successfully" },
            401: { description: "Refresh token invalid or expired" }
          }
        }
      },
      "/api/auth/logout": {
        post: {
          tags: ["Auth"],
          summary: "Logout user by clearing refresh token",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RefreshBody" }
              }
            }
          },
          responses: {
            200: { description: "Logout successful" }
          }
        }
      },
      "/api/users": {
        get: {
          tags: ["Users"],
          summary: "Get all users",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Users fetched successfully" },
            403: { description: "Admin only route" }
          }
        },
        post: {
          tags: ["Users"],
          summary: "Create user by admin",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserCreateBody" }
              }
            }
          },
          responses: {
            201: { description: "User created successfully" },
            403: { description: "Admin only route" }
          }
        }
      },
      "/api/users/{id}/role": {
        patch: {
          tags: ["Users"],
          summary: "Update user role",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" }
            }
          ],
          responses: {
            200: { description: "User role updated successfully" },
            404: { description: "User not found" }
          }
        }
      },
      "/api/users/{id}/status": {
        patch: {
          tags: ["Users"],
          summary: "Update user status",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" }
            }
          ],
          responses: {
            200: { description: "User status updated successfully" },
            404: { description: "User not found" }
          }
        }
      },
      "/api/records": {
        get: {
          tags: ["Records"],
          summary: "Get all records with pagination and filters",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "page", in: "query", schema: { type: "number" } },
            { name: "limit", in: "query", schema: { type: "number" } },
            { name: "category", in: "query", schema: { type: "string" } },
            { name: "type", in: "query", schema: { type: "string" } },
            { name: "date", in: "query", schema: { type: "string" } },
            { name: "fromDate", in: "query", schema: { type: "string" } },
            { name: "toDate", in: "query", schema: { type: "string" } },
            { name: "minAmount", in: "query", schema: { type: "number" } },
            { name: "maxAmount", in: "query", schema: { type: "number" } }
          ],
          responses: {
            200: { description: "Records fetched successfully" }
          }
        },
        post: {
          tags: ["Records"],
          summary: "Create a financial record",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RecordBody" }
              }
            }
          },
          responses: {
            201: { description: "Record created successfully" },
            403: { description: "Allowed for Analyst and Admin only" }
          }
        }
      },
      "/api/records/{id}": {
        get: {
          tags: ["Records"],
          summary: "Get a single record",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" }
            }
          ],
          responses: {
            200: { description: "Record fetched successfully" },
            404: { description: "Record not found" }
          }
        },
        put: {
          tags: ["Records"],
          summary: "Update a record",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" }
            }
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RecordBody" }
              }
            }
          },
          responses: {
            200: { description: "Record updated successfully" },
            403: { description: "Allowed for Analyst and Admin only" }
          }
        },
        delete: {
          tags: ["Records"],
          summary: "Soft delete a record",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" }
            }
          ],
          responses: {
            200: { description: "Record soft deleted successfully" },
            403: { description: "Admin only route" }
          }
        }
      },
      "/api/records/{id}/restore": {
        patch: {
          tags: ["Records"],
          summary: "Restore a soft deleted record",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" }
            }
          ],
          responses: {
            200: { description: "Record restored successfully" },
            403: { description: "Admin only route" }
          }
        }
      },
      "/api/dashboard/summary": {
        get: {
          tags: ["Dashboard"],
          summary: "Get dashboard summary",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Summary fetched successfully" }
          }
        }
      },
      "/api/dashboard/categories": {
        get: {
          tags: ["Dashboard"],
          summary: "Get category totals",
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: "Category totals fetched successfully" }
          }
        }
      },
      "/api/dashboard/recent-activity": {
        get: {
          tags: ["Dashboard"],
          summary: "Get recent activity",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "limit", in: "query", schema: { type: "number" } }
          ],
          responses: {
            200: { description: "Recent activity fetched successfully" }
          }
        }
      },
      "/api/dashboard/trends": {
        get: {
          tags: ["Dashboard"],
          summary: "Get monthly or weekly trend data",
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: "type", in: "query", schema: { type: "string", example: "monthly" } }
          ],
          responses: {
            200: { description: "Trend data fetched successfully" }
          }
        }
      }
    }
  };
}

function setupSwagger(app) {
  const swaggerSpec = createSwaggerSpec();
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = setupSwagger;
