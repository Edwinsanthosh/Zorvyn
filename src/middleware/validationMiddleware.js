function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidDate(dateValue) {
  return !Number.isNaN(new Date(dateValue).getTime());
}

function validateRecord(req, res, next) {
  const { title, category, amount, type, date } = req.body;

  if (!title || !category || amount === undefined || !type || !date) {
    return res.status(400).json({
      message: "title, category, amount, type and date are required"
    });
  }

  if (typeof title !== "string" || typeof category !== "string") {
    return res.status(400).json({
      message: "title and category should be text"
    });
  }

  if (!title.trim() || !category.trim()) {
    return res.status(400).json({
      message: "title and category should not be empty"
    });
  }

  if (typeof Number(amount) !== "number" || Number.isNaN(Number(amount))) {
    return res.status(400).json({
      message: "amount should be a valid number"
    });
  }

  if (Number(amount) < 0) {
    return res.status(400).json({
      message: "amount should be zero or more"
    });
  }

  if (type !== "income" && type !== "expense") {
    return res.status(400).json({
      message: "type should be income or expense"
    });
  }

  if (!isValidDate(date)) {
    return res.status(400).json({
      message: "date should be valid"
    });
  }

  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "email and password are required"
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      message: "email format is invalid"
    });
  }

  next();
}

function validateRegister(req, res, next) {
  const { name, email, password, role, status } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "name, email and password are required"
    });
  }

  if (!name.trim()) {
    return res.status(400).json({
      message: "name should not be empty"
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      message: "email format is invalid"
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      message: "password should have at least 6 characters"
    });
  }

  if (role && role !== "Viewer" && role !== "Analyst" && role !== "Admin") {
    return res.status(400).json({
      message: "role should be Viewer, Analyst or Admin"
    });
  }

  if (status && status !== "active" && status !== "inactive") {
    return res.status(400).json({
      message: "status should be active or inactive"
    });
  }

  next();
}

function validateUserRoleUpdate(req, res, next) {
  const { role } = req.body;

  if (!role) {
    return res.status(400).json({
      message: "role is required"
    });
  }

  if (role !== "Viewer" && role !== "Analyst" && role !== "Admin") {
    return res.status(400).json({
      message: "role should be Viewer, Analyst or Admin"
    });
  }

  next();
}

function validateUserStatusUpdate(req, res, next) {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      message: "status is required"
    });
  }

  if (status !== "active" && status !== "inactive") {
    return res.status(400).json({
      message: "status should be active or inactive"
    });
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
