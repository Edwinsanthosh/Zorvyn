const currentUserText = document.getElementById("currentUserText");
const currentTokenText = document.getElementById("currentTokenText");

let token = localStorage.getItem("token") || "";
let refreshToken = localStorage.getItem("refreshToken") || "";
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

function setStoredAuth(nextToken, nextUser) {
  token = nextToken || "";
  currentUser = nextUser || null;

  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }

  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  } else {
    localStorage.removeItem("refreshToken");
  }

  if (currentUser) {
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
  } else {
    localStorage.removeItem("currentUser");
  }

  updateAuthView();
}

function setRefreshToken(nextRefreshToken) {
  refreshToken = nextRefreshToken || "";

  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  } else {
    localStorage.removeItem("refreshToken");
  }
}

function showEndpointResult(resultId, data, ok = true, message = "Request complete") {
  const resultBox = document.getElementById(resultId);
  if (!resultBox) {
    return;
  }

  const statusText = ok ? "Success" : "Error";
  resultBox.textContent = `${statusText}: ${message}\n\n${JSON.stringify(data, null, 2)}`;
  resultBox.className = `endpoint-result ${ok ? "result-success" : "result-error"}`;
}

function buildRecordsListQuery() {
  const query = new URLSearchParams();
  const page = document.getElementById("listPage").value || "1";
  const limit = document.getElementById("listLimit").value || "5";
  const category = document.getElementById("listCategory").value.trim();
  const type = document.getElementById("listType").value;
  const date = document.getElementById("listDate").value;
  const fromDate = document.getElementById("listFromDate").value;
  const toDate = document.getElementById("listToDate").value;
  const minAmount = document.getElementById("listMinAmount").value;
  const maxAmount = document.getElementById("listMaxAmount").value;

  query.set("page", page);
  query.set("limit", limit);

  if (category) {
    query.set("category", category);
  }

  if (type) {
    query.set("type", type);
  }

  if (date) {
    query.set("date", date);
  }

  if (fromDate) {
    query.set("fromDate", fromDate);
  }

  if (toDate) {
    query.set("toDate", toDate);
  }

  if (minAmount) {
    query.set("minAmount", minAmount);
  }

  if (maxAmount) {
    query.set("maxAmount", maxAmount);
  }

  return query.toString();
}

async function apiCall(url, resultId, options = {}) {
  const headers = { ...(options.headers || {}) };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json();

  if (response.status === 401 && refreshToken && !options._retryAfterRefresh) {
    const refreshed = await tryRefreshToken(resultId);

    if (refreshed) {
      return apiCall(url, resultId, {
        ...options,
        _retryAfterRefresh: true
      });
    }
  }

  if (!response.ok) {
    showEndpointResult(resultId, data, false, data.message || "Request failed");
    const error = new Error(data.message || "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  showEndpointResult(resultId, data, true, data.message || `${options.method || "GET"} success`);
  return data;
}

async function tryRefreshToken(resultId) {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ refreshToken })
    });

    const data = await response.json();

    if (!response.ok) {
      setRefreshToken("");
      setStoredAuth("", null);
      showEndpointResult(resultId, data, false, "Session expired. Please login again");
      return false;
    }

    setRefreshToken(data.refreshToken);
    setStoredAuth(data.token, data.user);
    return true;
  } catch (error) {
    setRefreshToken("");
    setStoredAuth("", null);
    showEndpointResult(resultId, { message: "Could not refresh token" }, false, "Session expired");
    return false;
  }
}

async function loginUser(email, password, resultId) {
  const data = await apiCall("/api/auth/login", resultId, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  setRefreshToken(data.refreshToken);
  setStoredAuth(data.token, data.user);
  return data;
}

document.querySelectorAll(".quick-login").forEach((button) => {
  button.addEventListener("click", async () => {
    try {
      await loginUser(button.dataset.email, button.dataset.password, "loginResult");
    } catch (error) {
      console.log(error.message);
    }
  });
});

document.getElementById("clearTokenButton").addEventListener("click", () => {
  setRefreshToken("");
  setStoredAuth("", null);
  showEndpointResult("loginResult", { message: "Token cleared from browser storage" }, true, "Token cleared");
});

document.getElementById("registerForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const data = await apiCall("/api/auth/register", "registerResult", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: document.getElementById("registerName").value,
        email: document.getElementById("registerEmail").value,
        password: document.getElementById("registerPassword").value,
        role: document.getElementById("registerRole").value
      })
    });

    setRefreshToken(data.refreshToken);
    setStoredAuth(data.token, data.user);
  } catch (error) {
    console.log(error.message);
  }
});

document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await loginUser(
      document.getElementById("loginEmail").value,
      document.getElementById("loginPassword").value,
      "loginResult"
    );
  } catch (error) {
    console.log(error.message);
  }
});

document.getElementById("pingApiButton").addEventListener("click", async () => {
  try {
    await apiCall("/api", "pingResult");
  } catch (error) {
    console.log(error.message);
  }
});

document.getElementById("summaryButton").addEventListener("click", async () => {
  try {
    await apiCall("/api/dashboard/summary", "summaryResult");
  } catch (error) {
    console.log(error.message);
  }
});

document.getElementById("categoriesButton").addEventListener("click", async () => {
  try {
    await apiCall("/api/dashboard/categories", "categoriesResult");
  } catch (error) {
    console.log(error.message);
  }
});

document.getElementById("recentActivityForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const limit = document.getElementById("recentLimit").value || 5;
    await apiCall(`/api/dashboard/recent-activity?limit=${limit}`, "recentResult");
  } catch (error) {
    console.log(error.message);
  }
});

document.getElementById("trendsForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const type = document.getElementById("trendType").value;
    await apiCall(`/api/dashboard/trends?type=${type}`, "trendsResult");
  } catch (error) {
    console.log(error.message);
  }
});

document.getElementById("recordsListForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const queryString = buildRecordsListQuery();
    const requestUrl = `/api/records?${queryString}`;
    const data = await apiCall(requestUrl, "recordsListResult");
    showEndpointResult(
      "recordsListResult",
      data,
      true,
      `GET success | Request: ${requestUrl}`
    );
  } catch (error) {
    console.log(error.message);
  }
});

document.getElementById("recordOneForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const recordId = document.getElementById("recordOneId").value.trim();
    await apiCall(`/api/records/${recordId}`, "recordOneResult");
  } catch (error) {
    console.log(error.message);
  }
});

document.getElementById("recordCreateForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    const data = await apiCall("/api/records", "recordCreateResult", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: document.getElementById("createTitle").value,
        category: document.getElementById("createCategory").value,
        amount: Number(document.getElementById("createAmount").value),
        type: document.getElementById("createType").value,
        date: document.getElementById("createDate").value,
        note: document.getElementById("createNote").value
      })
    });

    lastCreatedRecordId = data.data?._id || "";

    if (lastCreatedRecordId) {
      document.getElementById("recordOneId").value = lastCreatedRecordId;
      document.getElementById("updateId").value = lastCreatedRecordId;
      document.getElementById("deleteId").value = lastCreatedRecordId;
    }
  } catch (error) {
    console.log(error.message);
  }
});

document.getElementById("recordUpdateForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await apiCall(`/api/records/${document.getElementById("updateId").value.trim()}`, "recordUpdateResult", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: document.getElementById("updateTitle").value,
        category: document.getElementById("updateCategory").value,
        amount: Number(document.getElementById("updateAmount").value),
        type: document.getElementById("updateType").value,
        date: document.getElementById("updateDate").value,
        note: document.getElementById("updateNote").value
      })
    });
  } catch (error) {
    console.log(error.message);
  }
});

document.getElementById("recordDeleteForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await apiCall(`/api/records/${document.getElementById("deleteId").value.trim()}`, "recordDeleteResult", {
      method: "DELETE"
    });
  } catch (error) {
    console.log(error.message);
  }
});

updateAuthView();
