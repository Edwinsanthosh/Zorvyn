const express = require("express");
const path = require("path");
require("dotenv").config();

const rateLimitMiddleware = require("./middleware/rateLimitMiddleware");
const authRoutes = require("./routes/authRoutes");
const recordRoutes = require("./routes/recordRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const userRoutes = require("./routes/userRoutes");
const { notFoundMiddleware, errorMiddleware } = require("./middleware/errorMiddleware");
const setupSwagger = require("../config/swagger");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));
setupSwagger(app);

// This is a simple custom rate limiter to avoid too many requests in demo project.
app.use("/api/auth", rateLimitMiddleware({ windowMs: 60 * 1000, maxRequests: 10 }));
app.use("/api/records", rateLimitMiddleware({ windowMs: 60 * 1000, maxRequests: 30 }));
app.use("/api/dashboard", rateLimitMiddleware({ windowMs: 60 * 1000, maxRequests: 30 }));

app.get("/api", (req, res) => {
  res.json({
    message: "Finance dashboard backend is running"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
