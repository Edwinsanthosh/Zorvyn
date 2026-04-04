const responseBox = document.getElementById("responseBox");
const messageLine = document.getElementById("messageLine");
const statusBadge = document.getElementById("statusBadge");
const currentUserText = document.getElementById("currentUserText");
const currentTokenText = document.getElementById("currentTokenText");
const testCasesGrid = document.getElementById("testCasesGrid");
const testSummary = document.getElementById("testSummary");
const passSummary = document.getElementById("passSummary");
const failSummary = document.getElementById("failSummary");

let token = localStorage.getItem("token") || "";
let currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
let lastCreatedRecordId = "";

function updateAuthView() {
  if (currentUser) {
    currentUserText.textContent = `${currentUser.name} (${currentUser.role})`;
  } else {
    currentUserText.textContent = "No user logged in";
  }

  if (token) {
    currentTokenText.textContent = `${token.slice(0, 24)}...`;
  } else {
    currentTokenText.textContent = "No token stored";
  }
}

function saveAuthState() {
  return {
    token,
    currentUser
  };
}

function restoreAuthState(savedState) {
  token = savedState.token;
  currentUser = savedState.currentUser;

  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }

  if (currentUser) {
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
  } else {
    localStorage.removeItem("currentUser");
  }

  updateAuthView();
}

function showResult(data, ok = true, message = "Request complete") {
  responseBox.textContent = JSON.stringify(data, null, 2);
  messageLine.textContent = message;
  statusBadge.textContent = ok ? "Success" : "Error";
  statusBadge.className = `status-badge ${ok ? "success" : "error"}`;
}

async function apiCall(url, options = {}) {
  const headers = { ...(options.headers || {}) };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json();

  if (!response.ok) {
    showResult(data, false, data.message || "Request failed");
    const error = new Error(data.message || "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  showResult(data, true, data.message || `${options.method || "GET"} success`);
  return data;
}

async function pingApi() {
  return apiCall("/api");
}

async function loginUser(email, password) {
  const data = await apiCall("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  token = data.token;
  currentUser = data.user;
  localStorage.setItem("token", token);
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  updateAuthView();
  return data;
}

function makeUniqueEmail(prefix) {
  return `${prefix}${Date.now()}@example.com`;
}

const testCases = [
  {
    id: "api-ping",
    name: "API health route responds",
    method: "GET",
    path: "/api",
    note: "Checks that the backend root API status works.",
    async run() {
      const data = await pingApi();
      if (data.message !== "Finance dashboard backend is running") {
        throw new Error("Unexpected API message");
      }
      return "API status message matched";
    }
  },
  {
    id: "register-valid",
    name: "Register valid user",
    method: "POST",
    path: "/api/auth/register",
    note: "Creates a fresh user and stores login token only during test run.",
    async run() {
      const data = await apiCall("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: "Saranya Visual",
          email: makeUniqueEmail("saranya"),
          password: "saranya123",
          role: "Viewer"
        })
      });

      token = data.token;
      currentUser = data.user;
      updateAuthView();

      if (data.user.role !== "Viewer") {
        throw new Error("Registered role is not Viewer");
      }

      return "User registered with Viewer role";
    }
  },
  {
    id: "register-invalid-role",
    name: "Register rejects invalid role",
    method: "POST",
    path: "/api/auth/register",
    note: "Validation case for role field.",
    async run() {
      try {
        await apiCall("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: "Broken Role",
            email: makeUniqueEmail("brokenrole"),
            password: "broken123",
            role: "SuperAdmin"
          })
        });
      } catch (error) {
        if (error.status === 400) {
          return "Invalid role correctly rejected";
        }
        throw error;
      }

      throw new Error("Invalid role should have failed");
    }
  },
  {
    id: "login-admin",
    name: "Admin login returns token",
    method: "POST",
    path: "/api/auth/login",
    note: "Uses seeded admin account.",
    async run() {
      const data = await loginUser("nivetha@example.com", "nivetha123");

      if (data.user.role !== "Admin") {
        throw new Error("Expected Admin role");
      }

      return "Admin login successful";
    }
  },
  {
    id: "dashboard-summary",
    name: "Dashboard summary loads",
    method: "GET",
    path: "/api/dashboard/summary",
    note: "Checks top-level totals response.",
    async run() {
      await loginUser("arun@example.com", "arun123");
      const data = await apiCall("/api/dashboard/summary");

      if (typeof data.totalBalance !== "number") {
        throw new Error("Summary does not contain totalBalance");
      }

      return `Balance received: ${data.totalBalance}`;
    }
  },
  {
    id: "dashboard-categories",
    name: "Category totals load",
    method: "GET",
    path: "/api/dashboard/categories",
    note: "Checks category aggregation structure.",
    async run() {
      await loginUser("arun@example.com", "arun123");
      const data = await apiCall("/api/dashboard/categories");

      if (!data.categoryTotals || typeof data.categoryTotals !== "object") {
        throw new Error("Category totals missing");
      }

      return "Category totals returned";
    }
  },
  {
    id: "dashboard-trends",
    name: "Weekly trends load",
    method: "GET",
    path: "/api/dashboard/trends?type=weekly",
    note: "Checks trend endpoint for weekly mode.",
    async run() {
      await loginUser("arun@example.com", "arun123");
      const data = await apiCall("/api/dashboard/trends?type=weekly");

      if (data.trendType !== "weekly") {
        throw new Error("Trend type did not stay weekly");
      }

      return `Returned ${data.data.length} weekly points`;
    }
  },
  {
    id: "records-list",
    name: "Records list returns pagination data",
    method: "GET",
    path: "/api/records?page=1&limit=5",
    note: "Checks page, total, and data fields.",
    async run() {
      await loginUser("arun@example.com", "arun123");
      const data = await apiCall("/api/records?page=1&limit=5");

      if (!Array.isArray(data.data)) {
        throw new Error("Record list data is not an array");
      }

      return `Loaded ${data.data.length} records`;
    }
  },
  {
    id: "record-create",
    name: "Analyst can create record",
    method: "POST",
    path: "/api/records",
    note: "Creates one record for later tests.",
    async run() {
      await loginUser("kavin@example.com", "kavin123");
      const data = await apiCall("/api/records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: "Visual Test Revenue",
          category: "Revenue",
          amount: 7777,
          type: "income",
          date: "2026-04-04",
          note: "Created from frontend testcase"
        })
      });

      lastCreatedRecordId = data.data._id;
      return `Created record ${lastCreatedRecordId}`;
    }
  },
  {
    id: "record-one",
    name: "Fetch one record by id",
    method: "GET",
    path: "/api/records/:id",
    note: "Uses the last created record if available.",
    async run() {
      if (!lastCreatedRecordId) {
        throw new Error("Create record testcase first");
      }

      await loginUser("arun@example.com", "arun123");
      const data = await apiCall(`/api/records/${lastCreatedRecordId}`);

      if (data._id !== lastCreatedRecordId) {
        throw new Error("Fetched record id mismatch");
      }

      return "Single record fetch matched id";
    }
  },
  {
    id: "record-update",
    name: "Analyst can update record",
    method: "PUT",
    path: "/api/records/:id",
    note: "Updates the created record title.",
    async run() {
      if (!lastCreatedRecordId) {
        throw new Error("Create record testcase first");
      }

      await loginUser("kavin@example.com", "kavin123");
      const data = await apiCall(`/api/records/${lastCreatedRecordId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: "Visual Test Revenue Updated",
          category: "Revenue",
          amount: 8888,
          type: "income",
          date: "2026-04-04",
          note: "Updated from frontend testcase"
        })
      });

      if (data.data.title !== "Visual Test Revenue Updated") {
        throw new Error("Record title was not updated");
      }

      return "Record update succeeded";
    }
  },
  {
    id: "viewer-create-denied",
    name: "Viewer cannot create record",
    method: "POST",
    path: "/api/records",
    note: "Role access negative case.",
    async run() {
      await loginUser("arun@example.com", "arun123");

      try {
        await apiCall("/api/records", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            title: "Viewer Should Fail",
            category: "Revenue",
            amount: 100,
            type: "income",
            date: "2026-04-04",
            note: ""
          })
        });
      } catch (error) {
        if (error.status === 403) {
          return "Viewer create blocked with 403";
        }
        throw error;
      }

      throw new Error("Viewer create should have failed");
    }
  },
  {
    id: "record-delete",
    name: "Admin can soft delete record",
    method: "DELETE",
    path: "/api/records/:id",
    note: "Deletes the created test record as cleanup.",
    async run() {
      if (!lastCreatedRecordId) {
        throw new Error("Create record testcase first");
      }

      await loginUser("nivetha@example.com", "nivetha123");
      const data = await apiCall(`/api/records/${lastCreatedRecordId}`, {
        method: "DELETE"
      });

      if (!String(data.message).toLowerCase().includes("soft deleted")) {
        throw new Error("Soft delete message missing");
      }

      return "Soft delete completed";
    }
  }
];

function getMethodClass(method) {
  return method.toLowerCase();
}

function updateTestSummary() {
  const cards = [...document.querySelectorAll(".test-card")];
  const done = cards.filter((card) => !card.classList.contains("pending")).length;
  const passCount = cards.filter((card) => card.classList.contains("pass")).length;
  const failCount = cards.filter((card) => card.classList.contains("fail")).length;

  testSummary.textContent = `${done} / ${cards.length} done`;
  passSummary.textContent = `${passCount} passed`;
  failSummary.textContent = `${failCount} failed`;
  passSummary.className = `mini-pill ${passCount ? "success-pill" : "neutral-pill"}`;
  failSummary.className = `mini-pill ${failCount ? "error-pill" : "neutral-pill"}`;
}

function setCardState(testId, state, text) {
  const card = document.getElementById(`card-${testId}`);
  const meta = document.getElementById(`meta-${testId}`);

  if (!card || !meta) {
    return;
  }

  card.classList.remove("pending", "pass", "fail");
  card.classList.add(state);
  meta.textContent = text;
  updateTestSummary();
}

function renderTestCards() {
  testCasesGrid.innerHTML = "";

  testCases.forEach((testCase) => {
    const card = document.createElement("article");
    card.className = "test-card pending";
    card.id = `card-${testCase.id}`;
    card.innerHTML = `
      <div class="test-top">
        <div>
          <h4 class="test-name">${testCase.name}</h4>
          <div class="test-path">${testCase.path}</div>
        </div>
        <span class="test-method ${getMethodClass(testCase.method)}">${testCase.method}</span>
      </div>
      <div class="test-info">${testCase.note}</div>
      <div class="test-meta" id="meta-${testCase.id}">Status: Not run</div>
      <div class="test-actions">
        <button class="try-button" data-run-test="${testCase.id}">Run Test</button>
      </div>
    `;
    testCasesGrid.appendChild(card);
  });

  document.querySelectorAll("[data-run-test]").forEach((button) => {
    button.addEventListener("click", async () => {
      await runOneTest(button.dataset.runTest);
    });
  });

  updateTestSummary();
}

async function runOneTest(testId) {
  const testCase = testCases.find((item) => item.id === testId);

  if (!testCase) {
    return;
  }

  const savedAuthState = saveAuthState();
  setCardState(testId, "pending", "Status: Running...");

  try {
    const info = await testCase.run();
    setCardState(testId, "pass", `Status: Passed | ${info}`);
  } catch (error) {
    setCardState(testId, "fail", `Status: Failed | ${error.message}`);
  } finally {
    restoreAuthState(savedAuthState);
  }
}

async function runAllTests() {
  for (const testCase of testCases) {
    await runOneTest(testCase.id);
  }
}

function resetTestView() {
  renderTestCards();
  showResult({ message: "Test view reset" }, true, "Test view reset");
}

document.querySelectorAll(".quick-login").forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      await loginUser(button.dataset.email, button.dataset.password);
    } catch (error) {
      console.log(error.message);
    }
  });
});

document.getElementById("runAllTestsButton").addEventListener("click", async () => {
  await runAllTests();
});

document.getElementById("resetTestViewButton").addEventListener("click", resetTestView);

document.getElementById("pingApiButton").addEventListener("click", async () => {
  try {
    await pingApi();
  } catch (error) {
    console.log(error.message);
  }
});

document.getElementById("clearTokenButton").addEventListener("click", () => {
  token = "";
  currentUser = null;
  localStorage.removeItem("token");
  localStorage.removeItem("currentUser");
  updateAuthView();
  showResult({ message: "Token cleared from browser storage" }, true, "Token cleared");
});

updateAuthView();
renderTestCards();
