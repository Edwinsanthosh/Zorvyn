const path = require("node:path");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");

const projectRoot = process.cwd();
const {
  validateRecord,
  validateLogin,
  validateRegister
} = require(path.join(projectRoot, "src", "middleware", "validationMiddleware"));
const dashboardController = require(path.join(projectRoot, "src", "controllers", "dashboardController"));
const recordController = require(path.join(projectRoot, "src", "controllers", "recordController"));
const authController = require(path.join(projectRoot, "src", "controllers", "authController"));
const FinancialRecord = require(path.join(projectRoot, "src", "models", "FinancialRecord"));
const User = require(path.join(projectRoot, "src", "models", "User"));
const { createMockRes } = require(path.join(projectRoot, "tests", "helpers"));

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`PASS: ${name}`);
    return true;
  } catch (error) {
    console.log(`FAIL: ${name}`);
    console.log(error.message);
    return false;
  }
}

async function testValidateRegisterAllowsValidUser() {
  const req = {
    body: {
      name: "Arun Kumar",
      email: "arun@example.com",
      password: "arun123",
      role: "Viewer"
    }
  };
  const res = createMockRes();
  let nextCalled = false;

  validateRegister(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
}

async function testValidateRegisterBlocksShortPasswords() {
  const req = {
    body: {
      name: "Arun Kumar",
      email: "arun@example.com",
      password: "123",
      role: "Viewer"
    }
  };
  const res = createMockRes();

  validateRegister(req, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, "password should have at least 6 characters");
}

async function testValidateLoginBlocksInvalidEmail() {
  const req = {
    body: {
      email: "wrong-email",
      password: "secret123"
    }
  };
  const res = createMockRes();

  validateLogin(req, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, "email format is invalid");
}

async function testValidateRecordBlocksNegativeAmount() {
  const req = {
    body: {
      title: "Office Rent",
      category: "Expense",
      amount: -100,
      type: "expense",
      date: "2026-04-04"
    }
  };
  const res = createMockRes();

  validateRecord(req, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, "amount should be zero or more");
}

async function testValidateRegisterBlocksInvalidRole() {
  const req = {
    body: {
      name: "Arun Kumar",
      email: "arun@example.com",
      password: "arun123",
      role: "SuperAdmin"
    }
  };
  const res = createMockRes();

  validateRegister(req, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, "role should be Viewer, Analyst or Admin");
}

async function testValidateRecordAllowsValidPayload() {
  const req = {
    body: {
      title: "Valid Revenue",
      category: "Revenue",
      amount: 500,
      type: "income",
      date: "2026-04-04"
    }
  };
  const res = createMockRes();
  let nextCalled = false;

  validateRecord(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
}

async function testRegisterUserBlocksDuplicateEmail() {
  const originalFindOne = User.findOne;

  User.findOne = async () => ({
    _id: "user1",
    email: "arun@example.com"
  });

  const req = {
    body: {
      name: "Arun Kumar",
      email: "arun@example.com",
      password: "arun123",
      role: "Viewer"
    }
  };
  const res = createMockRes();

  await authController.registerUser(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, "User with this email already exists");

  User.findOne = originalFindOne;
}

async function testLoginUserBlocksWrongCredentials() {
  const originalFindOne = User.findOne;

  User.findOne = async () => ({
    _id: "user1",
    email: "arun@example.com",
    password: await bcrypt.hash("correct123", 10),
    role: "Viewer"
  });

  const req = {
    body: {
      email: "arun@example.com",
      password: "wrongpass"
    }
  };
  const res = createMockRes();

  await authController.loginUser(req, res);

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.message, "Invalid email or password");

  User.findOne = originalFindOne;
}

async function testRegisterUserStoresHashedPassword() {
  const originalFindOne = User.findOne;
  const originalCreate = User.create;

  let createdPayload = null;
  User.findOne = async () => null;
  User.create = async (payload) => {
    createdPayload = payload;
    return {
      id: "user2",
      name: payload.name,
      email: payload.email,
      role: payload.role
    };
  };

  const req = {
    body: {
      name: "Kavin Raj",
      email: "kavin@example.com",
      password: "kavin123",
      role: "Analyst"
    }
  };
  const res = createMockRes();

  await authController.registerUser(req, res);

  assert.equal(res.statusCode, 201);
  assert.notEqual(createdPayload.password, "kavin123");
  assert.equal(await bcrypt.compare("kavin123", createdPayload.password), true);

  User.findOne = originalFindOne;
  User.create = originalCreate;
}

async function testLoginUserAllowsHashedPasswordMatch() {
  const originalFindOne = User.findOne;

  User.findOne = async () => ({
    id: "user3",
    name: "Nivetha Sri",
    email: "nivetha@example.com",
    password: await bcrypt.hash("nivetha123", 10),
    role: "Admin"
  });

  const req = {
    body: {
      email: "nivetha@example.com",
      password: "nivetha123"
    }
  };
  const res = createMockRes();

  await authController.loginUser(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.user.role, "Admin");

  User.findOne = originalFindOne;
}

async function testLoginUserBlocksInactiveUser() {
  const originalFindOne = User.findOne;

  User.findOne = async () => ({
    id: "user4",
    name: "Inactive User",
    email: "inactive@example.com",
    password: await bcrypt.hash("inactive123", 10),
    role: "Viewer",
    status: "inactive"
  });

  const req = {
    body: {
      email: "inactive@example.com",
      password: "inactive123"
    }
  };
  const res = createMockRes();

  await authController.loginUser(req, res);

  assert.equal(res.statusCode, 403);
  assert.equal(res.body.message, "User account is inactive");

  User.findOne = originalFindOne;
}

async function testDashboardSummaryTotals() {
  const originalFind = FinancialRecord.find;

  FinancialRecord.find = async () => [
    { amount: 5000, type: "income", category: "Revenue" },
    { amount: 1200, type: "expense", category: "Expense" },
    { amount: 700, type: "expense", category: "Tools" }
  ];

  const res = createMockRes();
  await dashboardController.getDashboardSummary({}, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.totalIncome, 5000);
  assert.equal(res.body.totalExpense, 1900);
  assert.equal(res.body.totalBalance, 3100);

  FinancialRecord.find = originalFind;
}

async function testRecentActivityLimit() {
  const originalFind = FinancialRecord.find;

  FinancialRecord.find = () => ({
    sort() {
      return this;
    },
    limit() {
      return Promise.resolve([{ title: "Latest 1" }, { title: "Latest 2" }]);
    }
  });

  const res = createMockRes();
  await dashboardController.getRecentActivity({ query: { limit: "2" } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.count, 2);

  FinancialRecord.find = originalFind;
}

async function testTrendDataMonthly() {
  const originalFind = FinancialRecord.find;

  FinancialRecord.find = async () => [
    { amount: 5000, type: "income", date: "2026-04-01" },
    { amount: 1200, type: "expense", date: "2026-04-10" },
    { amount: 3000, type: "income", date: "2026-05-01" }
  ];

  const res = createMockRes();
  await dashboardController.getTrendData({ query: { type: "monthly" } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data[0].period, "2026-04");
  assert.equal(res.body.data[0].balance, 3800);

  FinancialRecord.find = originalFind;
}

async function testCategoryTotalsReturnsSplitValues() {
  const originalFind = FinancialRecord.find;

  FinancialRecord.find = async () => [
    { amount: 1000, type: "income", category: "Revenue" },
    { amount: 200, type: "expense", category: "Revenue" },
    { amount: 300, type: "expense", category: "Tools" }
  ];

  const res = createMockRes();
  await dashboardController.getCategoryTotals({}, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.categoryTotals.Revenue.income, 1000);
  assert.equal(res.body.categoryTotals.Revenue.expense, 200);
  assert.equal(res.body.categoryTotals.Tools.total, 300);

  FinancialRecord.find = originalFind;
}

async function testTrendDataWeeklyReturnsWeeklyMode() {
  const originalFind = FinancialRecord.find;

  FinancialRecord.find = async () => [
    { amount: 800, type: "income", date: "2026-04-01" },
    { amount: 200, type: "expense", date: "2026-04-02" }
  ];

  const res = createMockRes();
  await dashboardController.getTrendData({ query: { type: "weekly" } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.trendType, "weekly");
  assert.equal(res.body.data.length, 1);

  FinancialRecord.find = originalFind;
}

async function testCreateRecordReturnsCreatedData() {
  const originalCreate = FinancialRecord.create;

  FinancialRecord.create = async (payload) => ({
    _id: "abc123",
    ...payload
  });

  const req = {
    user: {
      _id: "user123"
    },
    body: {
      title: "April Revenue",
      category: "Revenue",
      amount: 4500,
      type: "income",
      date: "2026-04-04",
      note: "Monthly income"
    }
  };
  const res = createMockRes();

  await recordController.createRecord(req, res);

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.data.title, "April Revenue");
  assert.equal(res.body.data.user, "user123");

  FinancialRecord.create = originalCreate;
}

async function testGetSingleRecordReturns404WhenMissing() {
  const originalFindOne = FinancialRecord.findOne;

  FinancialRecord.findOne = async () => null;

  const res = createMockRes();
  await recordController.getSingleRecord({ params: { id: "missing-id" } }, res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.message, "Record not found");

  FinancialRecord.findOne = originalFindOne;
}

async function testUpdateRecordReturns404WhenMissing() {
  const originalFindOne = FinancialRecord.findOne;

  FinancialRecord.findOne = async () => null;

  const req = {
    params: { id: "missing-id" },
    body: {
      title: "Updated",
      category: "Revenue",
      amount: 100,
      type: "income",
      date: "2026-04-04",
      note: ""
    }
  };
  const res = createMockRes();

  await recordController.updateRecord(req, res);

  assert.equal(res.statusCode, 404);
  assert.equal(res.body.message, "Record not found");

  FinancialRecord.findOne = originalFindOne;
}

async function testGetAllRecordsReturnsPaginationShape() {
  const originalCountDocuments = FinancialRecord.countDocuments;
  const originalFind = FinancialRecord.find;

  FinancialRecord.countDocuments = async () => 12;
  FinancialRecord.find = () => ({
    sort() {
      return this;
    },
    skip() {
      return this;
    },
    limit() {
      return Promise.resolve([{ title: "Record 1" }, { title: "Record 2" }]);
    }
  });

  const req = {
    user: {
      role: "Admin"
    },
    query: {
      page: "2",
      limit: "2"
    }
  };
  const res = createMockRes();

  await recordController.getAllRecords(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.page, 2);
  assert.equal(res.body.limit, 2);
  assert.equal(res.body.total, 12);
  assert.equal(res.body.data.length, 2);

  FinancialRecord.countDocuments = originalCountDocuments;
  FinancialRecord.find = originalFind;
}

async function testViewerGetsOnlyOwnRecordFilter() {
  const originalCountDocuments = FinancialRecord.countDocuments;
  const originalFind = FinancialRecord.find;
  let countFilter = null;
  let findFilter = null;

  FinancialRecord.countDocuments = async (filter) => {
    countFilter = filter;
    return 2;
  };

  FinancialRecord.find = (filter) => {
    findFilter = filter;
    return {
      sort() {
        return this;
      },
      skip() {
        return this;
      },
      limit() {
        return Promise.resolve([{ title: "Viewer Record" }]);
      }
    };
  };

  const req = {
    user: {
      role: "Viewer",
      _id: "viewer1"
    },
    query: {
      page: "1",
      limit: "5"
    }
  };
  const res = createMockRes();

  await recordController.getAllRecords(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(countFilter.user, "viewer1");
  assert.equal(findFilter.user, "viewer1");

  FinancialRecord.countDocuments = originalCountDocuments;
  FinancialRecord.find = originalFind;
}

async function testDashboardSummaryUsesViewerOwnershipFilter() {
  const originalFind = FinancialRecord.find;
  let usedFilter = null;

  FinancialRecord.find = async (filter) => {
    usedFilter = filter;
    return [{ amount: 500, type: "income", category: "Revenue" }];
  };

  const req = {
    user: {
      role: "Viewer",
      _id: "viewer1"
    }
  };
  const res = createMockRes();

  await dashboardController.getDashboardSummary(req, res);

  assert.equal(res.statusCode, 200);
  assert.equal(usedFilter.user, "viewer1");

  FinancialRecord.find = originalFind;
}

async function testDeleteRecordSoftDeletes() {
  const originalFindOne = FinancialRecord.findOne;
  let saved = false;

  FinancialRecord.findOne = async () => ({
    _id: "abc123",
    isDeleted: false,
    deletedAt: null,
    async save() {
      saved = true;
    }
  });

  const res = createMockRes();
  await recordController.deleteRecord({ params: { id: "abc123" } }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.message, "Record soft deleted successfully");
  assert.equal(saved, true);

  FinancialRecord.findOne = originalFindOne;
}

async function main() {
  const tests = [
    ["validateRegister allows valid user", testValidateRegisterAllowsValidUser],
    ["validateRegister blocks short password", testValidateRegisterBlocksShortPasswords],
    ["validateRegister blocks invalid role", testValidateRegisterBlocksInvalidRole],
    ["validateLogin blocks invalid email", testValidateLoginBlocksInvalidEmail],
    ["validateRecord blocks negative amount", testValidateRecordBlocksNegativeAmount],
    ["validateRecord allows valid payload", testValidateRecordAllowsValidPayload],
    ["registerUser blocks duplicate email", testRegisterUserBlocksDuplicateEmail],
    ["registerUser stores hashed password", testRegisterUserStoresHashedPassword],
    ["loginUser blocks wrong credentials", testLoginUserBlocksWrongCredentials],
    ["loginUser allows hashed password match", testLoginUserAllowsHashedPasswordMatch],
    ["loginUser blocks inactive user", testLoginUserBlocksInactiveUser],
    ["dashboard summary returns totals", testDashboardSummaryTotals],
    ["dashboard summary uses viewer ownership filter", testDashboardSummaryUsesViewerOwnershipFilter],
    ["category totals return income and expense split", testCategoryTotalsReturnsSplitValues],
    ["recent activity respects limit", testRecentActivityLimit],
    ["trend data returns monthly balance", testTrendDataMonthly],
    ["trend data returns weekly mode", testTrendDataWeeklyReturnsWeeklyMode],
    ["getAllRecords returns pagination shape", testGetAllRecordsReturnsPaginationShape],
    ["viewer gets only own record filter", testViewerGetsOnlyOwnRecordFilter],
    ["getSingleRecord returns 404 when missing", testGetSingleRecordReturns404WhenMissing],
    ["createRecord returns created data", testCreateRecordReturnsCreatedData],
    ["updateRecord returns 404 when missing", testUpdateRecordReturns404WhenMissing],
    ["deleteRecord performs soft delete", testDeleteRecordSoftDeletes]
  ];

  let passed = 0;

  for (const [name, fn] of tests) {
    const ok = await runTest(name, fn);
    if (ok) {
      passed += 1;
    }
  }

  console.log(`\n${passed}/${tests.length} tests passed`);

  if (passed !== tests.length) {
    process.exit(1);
  }
}

main();
