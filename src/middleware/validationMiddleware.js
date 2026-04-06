const createError = require("../utils/createError");

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidDate(dateValue) {
  return !Number.isNaN(new Date(dateValue).getTime());
}

function validateRecord(req, res, next) {
  const { title, category, amount, type, date } = req.body;

  if (!title || !category || amount === undefined || !type || !date) {
    return next(createError("title, category, amount, type and date are required", 400));
  }

  if (typeof title !== "string" || typeof category !== "string") {
    return next(createError("title and category should be text", 400));
  }

  if (!title.trim() || !category.trim()) {
    return next(createError("title and category should not be empty", 400));
  }

  if (typeof Number(amount) !== "number" || Number.isNaN(Number(amount))) {
    return next(createError("amount should be a valid number", 400));
  }

  if (Number(amount) < 0) {
    return next(createError("amount should be zero or more", 400));
  }

  if (type !== "income" && type !== "expense") {
    return next(createError("type should be income or expense", 400));
  }

  if (!isValidDate(date)) {
    return next(createError("date should be valid", 400));
  }

  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(createError("email and password are required", 400));
  }

  if (!isValidEmail(email)) {
    return next(createError("email format is invalid", 400));
  }

  next();
}

function validateRegister(req, res, next) {
  const { name, email, password, role, status } = req.body;

  if (!name || !email || !password) {
    return next(createError("name, email and password are required", 400));
  }

  if (!name.trim()) {
    return next(createError("name should not be empty", 400));
  }

  if (!isValidEmail(email)) {
    return next(createError("email format is invalid", 400));
  }

  if (password.length < 6) {
    return next(createError("password should have at least 6 characters", 400));
  }

  if (role && role !== "Viewer" && role !== "Analyst" && role !== "Admin") {
    return next(createError("role should be Viewer, Analyst or Admin", 400));
  }

  if (status && status !== "active" && status !== "inactive") {
    return next(createError("status should be active or inactive", 400));
  }

  next();
}

function validateUserRoleUpdate(req, res, next) {
  const { role } = req.body;

  if (!role) {
    return next(createError("role is required", 400));
  }

  if (role !== "Viewer" && role !== "Analyst" && role !== "Admin") {
    return next(createError("role should be Viewer, Analyst or Admin", 400));
  }

  next();
}

function validateUserStatusUpdate(req, res, next) {
  const { status } = req.body;

  if (!status) {
    return next(createError("status is required", 400));
  }

  if (status !== "active" && status !== "inactive") {
    return next(createError("status should be active or inactive", 400));
  }

  next();
}

module.exports = {
  validateRecord,
  validateLogin,
  validateRegister,
  validateUserRoleUpdate,
  validateUserStatusUpdate
};
