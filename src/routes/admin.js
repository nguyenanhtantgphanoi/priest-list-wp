const crypto = require("node:crypto");

const SESSION_COOKIE = "admin_session";
const SESSION_TTL_MS = Number(process.env.SESSION_TTL_MS || 1000 * 60 * 60 * 12);

const sessions = new Map();

function asString(value) {
  return String(value || "").trim();
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return salt + ":" + hash;
}

function verifyPassword(password, passwordHash) {
  if (!passwordHash || !passwordHash.includes(":")) {
    return false;
  }

  const [salt, storedHash] = String(passwordHash).split(":");
  const computedHash = crypto.scryptSync(String(password || ""), salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(storedHash, "hex"), Buffer.from(computedHash, "hex"));
}

function sanitizeUser(user) {
  return {
    id: String(user._id),
    username: asString(user.username),
    displayName: asString(user.displayName || user.username),
    role: asString(user.role || "admin"),
    isActive: Boolean(user.isActive !== false),
    isDefaultSuperadmin: Boolean(user.isDefaultSuperadmin),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function createSession(user) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, {
    userId: String(user._id),
    username: asString(user.username),
    displayName: asString(user.displayName || user.username),
    role: asString(user.role || "admin"),
    expiresAt: Date.now() + SESSION_TTL_MS,
  });
  return token;
}

function getSessionFromRequest(request) {
  const token = request.cookies[SESSION_COOKIE];
  if (!token) {
    return null;
  }

  const session = sessions.get(token);
  if (!session) {
    return null;
  }

  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }

  session.expiresAt = Date.now() + SESSION_TTL_MS;
  return { token, ...session };
}

function clearExpiredSessions() {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      sessions.delete(token);
    }
  }
}

function navTabs(active) {
  const tabs = [
    { key: "priests", label: "Priests", href: "/admin" },
    { key: "parishes", label: "Deaneries and Parishes", href: "/admin/parishes" },
    { key: "users", label: "Users", href: "/admin/users" },
  ];

  return tabs
    .map((tab) => {
      const activeClass = tab.key === active ? " active" : "";
      return '<a class="tab-link' + activeClass + '" href="' + tab.href + '">' + tab.label + "</a>";
    })
    .join("");
}

function adminShellStyles(theme = "teal") {
  if (theme === "amber") {
    return `
      :root {
        --bg: #f6f4ee;
        --panel: #fffdf7;
        --ink: #202022;
        --muted: #707174;
        --accent: #b45309;
        --accent-soft: #fef3c7;
        --danger: #b91c1c;
        --line: #d7d3c6;
      }
    `;
  }

  if (theme === "blue") {
    return `
      :root {
        --bg: #eef4ff;
        --panel: #ffffff;
        --ink: #14213d;
        --muted: #5a6478;
        --accent: #2563eb;
        --accent-soft: #dbeafe;
        --danger: #b91c1c;
        --line: #c7d2fe;
      }
    `;
  }

  return `
    :root {
      --bg: #f2f5f8;
      --panel: #ffffff;
      --ink: #1f2a37;
      --muted: #6b7280;
      --accent: #0d9488;
      --accent-soft: #ccfbf1;
      --danger: #dc2626;
      --line: #d1d5db;
    }
  `;
}

function adminNavHtml(activeTab) {
  return `
    <nav class="top-tabs" aria-label="Admin navigation">
      <div class="tabs-left">
        ${navTabs(activeTab)}
      </div>
      <div class="tabs-right">
        <span id="currentUserText" class="current-user"></span>
        <button id="logoutBtn" class="btn-muted" type="button">Logout</button>
      </div>
    </nav>
  `;
}

function adminNavStyles() {
  return `
    .top-tabs {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.6rem;
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 0.45rem;
      flex-wrap: wrap;
    }
    .tabs-left {
      display: flex;
      gap: 0.45rem;
      flex-wrap: wrap;
    }
    .tabs-right {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      margin-left: auto;
      flex-wrap: wrap;
    }
    .tab-link {
      padding: 0.5rem 0.8rem;
      border-radius: 10px;
      color: #0f172a;
      text-decoration: none;
      font-weight: 700;
      border: 1px solid transparent;
    }
    .tab-link.active {
      background: var(--accent-soft);
      border-color: var(--line);
      color: #0b3b36;
    }
    .current-user {
      color: var(--muted);
      font-size: 0.86rem;
      padding: 0 0.3rem;
    }
  `;
}

function navScript() {
  return `
    async function loadCurrentUser() {
      try {
        const response = await fetch("/api/auth/me", { credentials: "same-origin" });
        if (!response.ok) {
          window.location.href = "/login";
          return;
        }
        const user = await response.json();
        const text = user.displayName + " (" + user.role + ")";
        const userNode = document.getElementById("currentUserText");
        if (userNode) {
          userNode.textContent = text;
        }
      } catch (_error) {
        window.location.href = "/login";
      }
    }

    async function logout() {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
        });
      } finally {
        window.location.href = "/login";
      }
    }

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", logout);
    }

    loadCurrentUser();
  `;
}

function buildLoginPage(errorMessage = "") {
  const safeError = asString(errorMessage).replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Admin Login</title>
    <style>
      :root {
        --ink: #1f2937;
        --muted: #6b7280;
        --panel: #ffffff;
        --line: #d1d5db;
        --accent: #1d4ed8;
        --danger: #b91c1c;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        color: var(--ink);
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        background:
          radial-gradient(circle at 10% 10%, #dbeafe 0, #dbeafe 22%, transparent 22%),
          radial-gradient(circle at 84% 86%, #bfdbfe 0, #bfdbfe 18%, transparent 18%),
          #eff6ff;
      }
      .card {
        width: min(420px, 92vw);
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 14px;
        box-shadow: 0 12px 34px rgba(0, 0, 0, 0.08);
      }
      .card h1 {
        margin: 0;
        padding: 1.2rem 1.2rem 0.4rem;
        font-size: 1.25rem;
      }
      .card p {
        margin: 0;
        padding: 0 1.2rem 0.9rem;
        color: var(--muted);
      }
      form {
        padding: 0 1.2rem 1.2rem;
        display: grid;
        gap: 0.75rem;
      }
      label {
        display: grid;
        gap: 0.35rem;
        font-size: 0.92rem;
      }
      input {
        width: 100%;
        border: 1px solid var(--line);
        border-radius: 10px;
        padding: 0.6rem 0.7rem;
        font: inherit;
      }
      button {
        border: 0;
        border-radius: 10px;
        background: var(--accent);
        color: #fff;
        padding: 0.6rem 0.7rem;
        font-weight: 700;
        cursor: pointer;
      }
      .error {
        margin: 0;
        padding: 0 1.2rem 0.8rem;
        color: var(--danger);
        min-height: 1.2rem;
        font-size: 0.9rem;
      }
      .hint {
        margin: 0;
        padding: 0 1.2rem 1rem;
        color: var(--muted);
        font-size: 0.84rem;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <h1>Admin Login</h1>
      <p>Sign in to access parish and priest management.</p>
      <div id="errorText" class="error">${safeError}</div>
      <form id="loginForm">
        <label>Username
          <input id="username" autocomplete="username" required />
        </label>
        <label>Password
          <input id="password" type="password" autocomplete="current-password" required />
        </label>
        <button type="submit">Login</button>
      </form>
      <p class="hint">Default superadmin credentials are read from environment variables.</p>
    </main>

    <script>
      async function submitLogin(event) {
        event.preventDefault();
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        const errorText = document.getElementById("errorText");

        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ username, password }),
          });

          if (!response.ok) {
            const body = await response.json();
            throw new Error(body.error || "Login failed.");
          }

          window.location.href = "/admin";
        } catch (error) {
          errorText.textContent = error.message || "Login failed.";
        }
      }

      document.getElementById("loginForm").addEventListener("submit", submitLogin);
    </script>
  </body>
</html>`;
}

function buildPriestsPage() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Priest Admin</title>
    <style>
      ${adminShellStyles("teal")}
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        color: var(--ink);
        background:
          radial-gradient(circle at 15% 10%, #dff3ef 0, #dff3ef 18%, transparent 18%),
          radial-gradient(circle at 80% 20%, #dbeafe 0, #dbeafe 17%, transparent 17%),
          var(--bg);
        min-height: 100vh;
      }
      .wrap {
        width: 96vw;
        margin: 1.2rem 2rem 2rem;
        display: grid;
        gap: 1rem;
      }
      .layout {
        display: grid;
        grid-template-columns: 340px 1fr;
        gap: 1rem;
      }
      .card {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 14px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
      }
      .card h2 {
        margin: 0;
        padding: 1rem 1rem 0.25rem;
        font-size: 1.1rem;
      }
      .card p {
        margin: 0;
        padding: 0 1rem 0.9rem;
        color: var(--muted);
      }
      form {
        padding: 0 1rem 1rem;
        display: grid;
        gap: 0.7rem;
      }
      label {
        display: grid;
        gap: 0.35rem;
        font-size: 0.92rem;
      }
      input, textarea, select {
        width: 100%;
        border: 1px solid var(--line);
        border-radius: 10px;
        padding: 0.58rem 0.7rem;
        font: inherit;
      }
      textarea { min-height: 90px; resize: vertical; }
      .actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      button {
        border: 0;
        border-radius: 10px;
        padding: 0.55rem 0.8rem;
        font-weight: 600;
        cursor: pointer;
      }
      .btn-primary { background: var(--accent); color: #fff; }
      .btn-muted { background: #e5e7eb; color: var(--ink); }
      .btn-danger { background: var(--danger); color: #fff; }
      .table-wrap { overflow: auto; padding: 0 0.8rem 0.8rem; }
      table { width: 100%; border-collapse: collapse; min-width: 620px; }
      th, td {
        text-align: left;
        padding: 0.7rem;
        border-bottom: 1px solid var(--line);
        font-size: 0.93rem;
        vertical-align: top;
      }
      th { font-size: 0.82rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
      .row-actions { display: flex; gap: 0.4rem; }
      .chip {
        font-size: 0.75rem;
        border-radius: 999px;
        padding: 0.2rem 0.45rem;
        background: #ecfeff;
        border: 1px solid #99f6e4;
      }
      .status {
        margin: 0.4rem 1rem 0.9rem;
        min-height: 1.2rem;
        color: var(--muted);
        font-size: 0.9rem;
      }
      .list-tools {
        padding: 0 1rem 0.8rem;
        display: grid;
        gap: 0.65rem;
      }
      .pager {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.6rem;
        flex-wrap: wrap;
      }
      .pager-controls {
        display: flex;
        align-items: center;
        gap: 0.45rem;
      }
      .page-numbers {
        display: flex;
        align-items: center;
        gap: 0.3rem;
        flex-wrap: wrap;
      }
      .page-numbers button {
        min-width: 34px;
      }
      .page-active {
        background: var(--accent);
        color: #fff;
      }
      .pager-meta {
        color: var(--muted);
        font-size: 0.88rem;
      }
      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 999px;
        object-fit: cover;
        border: 1px solid var(--line);
        background: #f3f4f6;
      }
      .avatar-empty {
        width: 40px;
        height: 40px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.74rem;
        color: var(--muted);
        border: 1px dashed var(--line);
        background: #f9fafb;
      }
      .rip-fields {
        border: 1px dashed var(--line);
        border-radius: 10px;
        padding: 0.65rem;
        background: #fafafa;
      }
      .hidden {
        display: none;
      }
      ${adminNavStyles()}
      @media (max-width: 920px) {
        .layout { grid-template-columns: 1fr; }
        .wrap {
          margin: 1rem 1rem 1.4rem;
          width: auto;
        }
      }
    </style>
  </head>
  <body>
    <main class="wrap">
      ${adminNavHtml("priests")}

      <section class="layout">
        <section class="card">
          <h2>Priest Profile</h2>
          <p>Create or update profile documents.</p>
          <form id="priestForm">
            <input type="hidden" id="docId" />
            <label>Name *<input id="name" required /></label>
            <label>Nickname<input id="nickname" /></label>
            <label>State
              <select id="state">
                <option value="active-diocese">active-diocese</option>
                <option value="active-religious">active-religious</option>
                <option value="retired-diocese">retired-diocese</option>
                <option value="rip-diocese">rip-diocese</option>
              </select>
            </label>
            <label>Avatar URL<input id="avatarUrl" /></label>
            <label>Sinh Nam<input id="sinhNam" /></label>
            <label>Le Quan Thay<input id="leQuanThay" /></label>
            <label>Thu Phong Linh Muc<input id="thuPhongLinhMuc" /></label>
            <label>Dia Chi<input id="diaChi" /></label>
            <label>Giao Vu<textarea id="giaoVu"></textarea></label>
            <div id="ripFields" class="rip-fields hidden">
              <label>Que quan<input id="queQuan" /></label>
              <label>Ngay mat<input id="ngayMat" /></label>
              <label>Noi an tang<input id="noiAnTang" /></label>
            </div>
            <div class="actions">
              <button class="btn-primary" type="submit">Save profile</button>
              <button class="btn-muted" id="resetForm" type="button">Clear</button>
            </div>
          </form>
        </section>

        <section class="card">
          <h2>Priest Documents</h2>
          <p>Stored in MongoDB collection: priest.</p>
          <div class="list-tools">
            <label>Quick search (name/state)
              <input id="searchText" placeholder="Type name or state..." />
            </label>
            <div class="pager">
              <div class="pager-controls">
                <label>Rows per page
                  <select id="pageSize">
                    <option value="10">10</option>
                    <option value="20" selected>20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </label>
                <button class="btn-muted" id="prevPage" type="button">Prev</button>
                <button class="btn-muted" id="nextPage" type="button">Next</button>
                <div id="pageNumbers" class="page-numbers"></div>
              </div>
              <div id="pagerMeta" class="pager-meta"></div>
            </div>
          </div>
          <div id="statusText" class="status"></div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Avatar</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Ordination</th>
                  <th>Address</th>
                  <th>Mission</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="rows"></tbody>
            </table>
          </div>
        </section>
      </section>
    </main>

    <script>
      ${navScript()}

      const form = document.getElementById("priestForm");
      const rows = document.getElementById("rows");
      const statusText = document.getElementById("statusText");
      const docId = document.getElementById("docId");
      const name = document.getElementById("name");
      const nickname = document.getElementById("nickname");
      const state = document.getElementById("state");
      const avatarUrl = document.getElementById("avatarUrl");
      const sinhNam = document.getElementById("sinhNam");
      const leQuanThay = document.getElementById("leQuanThay");
      const thuPhongLinhMuc = document.getElementById("thuPhongLinhMuc");
      const diaChi = document.getElementById("diaChi");
      const giaoVu = document.getElementById("giaoVu");
      const queQuan = document.getElementById("queQuan");
      const ngayMat = document.getElementById("ngayMat");
      const noiAnTang = document.getElementById("noiAnTang");
      const ripFields = document.getElementById("ripFields");
      const resetForm = document.getElementById("resetForm");
      const searchText = document.getElementById("searchText");
      const pageSize = document.getElementById("pageSize");
      const prevPage = document.getElementById("prevPage");
      const nextPage = document.getElementById("nextPage");
      const pagerMeta = document.getElementById("pagerMeta");
      const pageNumbers = document.getElementById("pageNumbers");

      let cache = [];
      let currentPage = 1;

      function escapeHtml(value) {
        return String(value || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      function applyFilter(data) {
        const query = searchText.value.trim().toLowerCase();
        if (!query) {
          return data;
        }

        return data.filter((item) => {
          const nameValue = String(item.name || "").toLowerCase();
          const stateValue = String(item.state || "").toLowerCase();
          return nameValue.includes(query) || stateValue.includes(query);
        });
      }

      function getPaginationState(totalItems) {
        const size = Number(pageSize.value) || 20;
        const totalPages = Math.max(1, Math.ceil(totalItems / size));
        if (currentPage > totalPages) {
          currentPage = totalPages;
        }
        if (currentPage < 1) {
          currentPage = 1;
        }

        const start = (currentPage - 1) * size;
        const end = start + size;

        return {
          size,
          totalPages,
          start,
          end,
        };
      }

      function updatePager(filteredCount) {
        const state = getPaginationState(filteredCount);
        const hasItems = filteredCount > 0;
        const startIndex = hasItems ? state.start + 1 : 0;
        const endIndex = hasItems ? Math.min(state.end, filteredCount) : 0;

        prevPage.disabled = currentPage <= 1;
        nextPage.disabled = currentPage >= state.totalPages;

        pagerMeta.textContent =
          "Showing " + startIndex + "-" + endIndex + " of " + filteredCount +
          " | Page " + currentPage + " / " + state.totalPages;

        renderPageNumberButtons(state.totalPages);
      }

      function renderPageNumberButtons(totalPages) {
        pageNumbers.innerHTML = "";

        const maxButtons = 7;
        let start = Math.max(1, currentPage - 3);
        let end = Math.min(totalPages, start + maxButtons - 1);

        if (end - start + 1 < maxButtons) {
          start = Math.max(1, end - maxButtons + 1);
        }

        for (let page = start; page <= end; page += 1) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = page === currentPage ? "page-active" : "btn-muted";
          button.textContent = String(page);
          button.setAttribute("data-page", String(page));
          pageNumbers.appendChild(button);
        }
      }

      function getPagedData(filtered) {
        const state = getPaginationState(filtered.length);
        return filtered.slice(state.start, state.end);
      }

      function setStatus(message, isError = false) {
        statusText.textContent = message;
        statusText.style.color = isError ? "#b91c1c" : "#4b5563";
      }

      function getPayload() {
        const isRip = state.value === "rip-diocese";
        return {
          name: name.value,
          nickname: nickname.value,
          state: state.value,
          avatarUrl: avatarUrl.value,
          sinhNam: sinhNam.value,
          leQuanThay: leQuanThay.value,
          thuPhongLinhMuc: thuPhongLinhMuc.value,
          diaChi: diaChi.value,
          giaoVu: giaoVu.value,
          queQuan: isRip ? queQuan.value : "",
          ngayMat: isRip ? ngayMat.value : "",
          noiAnTang: isRip ? noiAnTang.value : "",
        };
      }

      function syncRipFields() {
        const isRip = state.value === "rip-diocese";
        ripFields.classList.toggle("hidden", !isRip);
        if (!isRip) {
          queQuan.value = "";
          ngayMat.value = "";
          noiAnTang.value = "";
        }
      }

      function clearForm() {
        docId.value = "";
        form.reset();
        state.value = "active-diocese";
        syncRipFields();
        name.focus();
      }

      function fillForm(item) {
        docId.value = item.id;
        name.value = item.name || "";
        nickname.value = item.nickname || "";
        state.value = item.state || "active-diocese";
        avatarUrl.value = item.avatarUrl || "";
        sinhNam.value = item.sinhNam || "";
        leQuanThay.value = item.leQuanThay || "";
        thuPhongLinhMuc.value = item.thuPhongLinhMuc || "";
        diaChi.value = item.diaChi || "";
        giaoVu.value = item.giaoVu || "";
        queQuan.value = item.queQuan || "";
        ngayMat.value = item.ngayMat || "";
        noiAnTang.value = item.noiAnTang || "";
        syncRipFields();
      }

      function renderRows(data) {
        rows.innerHTML = "";

        if (!data.length) {
          const tr = document.createElement("tr");
          tr.innerHTML = '<td colspan="7">No priest documents found.</td>';
          rows.appendChild(tr);
          return;
        }

        data.forEach((item) => {
          const safeAvatar = escapeHtml(item.avatarUrl || "");
          const avatarCell = safeAvatar
            ? "<img class='avatar' src='" + safeAvatar + "' alt='avatar' loading='lazy' referrerpolicy='no-referrer' />"
            : "<span class='avatar-empty'>No Img</span>";
          const nameCell =
            "<strong>" + escapeHtml(item.name || "") + "</strong>" +
            (item.nickname ? "<br /><small>Nickname: " + escapeHtml(item.nickname) + "</small>" : "") +
            "<br /><small>" + item.id + "</small>";
          const ripInfo = item.state === "rip-diocese"
            ? "<br /><small>Que quan: " + escapeHtml(item.queQuan || "-") +
              " | Ngay mat: " + escapeHtml(item.ngayMat || "-") +
              " | Noi an tang: " + escapeHtml(item.noiAnTang || "-") + "</small>"
            : "";
          const tr = document.createElement("tr");
          tr.innerHTML =
            "<td>" + avatarCell + "</td>" +
            "<td>" + nameCell + "</td>" +
            "<td><span class='chip'>" + escapeHtml(item.state || "active-diocese") + "</span></td>" +
            "<td>Sinh nam: " + escapeHtml(item.sinhNam || "-") + "<br />Le quan thay: " + escapeHtml(item.leQuanThay || "-") + "<br />Thu phong: " + escapeHtml(item.thuPhongLinhMuc || "-") + ripInfo + "</td>" +
            "<td>" + escapeHtml(item.diaChi || "-") + "</td>" +
            "<td>" + escapeHtml(item.giaoVu || "-") + "</td>" +
            "<td><div class='row-actions'>" +
            "<button class='btn-muted' data-id='" + item.id + "' data-action='edit' type='button'>Edit</button>" +
            "<button class='btn-danger' data-id='" + item.id + "' data-action='delete' type='button'>Delete</button>" +
            "</div></td>";
          rows.appendChild(tr);
        });
      }

      function refreshListView() {
        const filtered = applyFilter(cache);
        const paged = getPagedData(filtered);
        renderRows(paged);
        updatePager(filtered.length);
        setStatus(
          "Showing " + paged.length + " on current page, " + filtered.length +
          " matched, " + cache.length + " total priest document(s)."
        );
      }

      async function loadPriests() {
        try {
          setStatus("Loading priest documents...");
          const response = await fetch("/api/priests");
          const data = await response.json();
          cache = data;
          currentPage = 1;
          refreshListView();
          setStatus("Loaded " + data.length + " priest document(s).");
        } catch (error) {
          setStatus(error.message || "Failed to load priest documents.", true);
        }
      }

      function refreshFilteredView() {
        currentPage = 1;
        refreshListView();
      }

      function goToPreviousPage() {
        currentPage -= 1;
        refreshListView();
      }

      function goToNextPage() {
        currentPage += 1;
        refreshListView();
      }

      function goToPage(pageNumber) {
        currentPage = pageNumber;
        refreshListView();
      }

      function changePageSize() {
        currentPage = 1;
        refreshListView();
      }

      async function savePriest(event) {
        event.preventDefault();
        const id = docId.value;
        const method = id ? "PUT" : "POST";
        const url = id ? "/api/priests/" + id : "/api/priests";

        try {
          setStatus("Saving priest document...");
          const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(getPayload()),
          });

          if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody.error || "Failed to save document.");
          }

          clearForm();
          await loadPriests();
          setStatus("Priest document saved.");
        } catch (error) {
          setStatus(error.message || "Failed to save priest document.", true);
        }
      }

      async function deletePriest(id) {
        if (!confirm("Delete this priest document?")) {
          return;
        }

        try {
          setStatus("Deleting priest document...");
          const response = await fetch("/api/priests/" + id, { method: "DELETE" });

          if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(errorBody.error || "Failed to delete document.");
          }

          if (docId.value === id) {
            clearForm();
          }

          await loadPriests();
          setStatus("Priest document deleted.");
        } catch (error) {
          setStatus(error.message || "Failed to delete priest document.", true);
        }
      }

      rows.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) {
          return;
        }

        const id = button.getAttribute("data-id");
        const action = button.getAttribute("data-action");

        if (action === "edit") {
          const selected = cache.find((item) => item.id === id);
          if (selected) {
            fillForm(selected);
            setStatus("Editing selected priest document.");
          }
          return;
        }

        if (action === "delete") {
          deletePriest(id);
        }
      });

      pageNumbers.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-page]");
        if (!button) {
          return;
        }

        const page = Number(button.getAttribute("data-page"));
        if (Number.isInteger(page) && page > 0) {
          goToPage(page);
        }
      });

      form.addEventListener("submit", savePriest);
      resetForm.addEventListener("click", clearForm);
      state.addEventListener("change", syncRipFields);
      searchText.addEventListener("input", refreshFilteredView);
      prevPage.addEventListener("click", goToPreviousPage);
      nextPage.addEventListener("click", goToNextPage);
      pageSize.addEventListener("change", changePageSize);

      syncRipFields();
      loadPriests();
    </script>
  </body>
</html>`;
}

function buildParishesPage() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Deanery and Parish Admin</title>
    <style>
      ${adminShellStyles("amber")}
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: var(--ink);
        background:
          radial-gradient(circle at 8% 10%, #fef3c7 0, #fef3c7 14%, transparent 14%),
          radial-gradient(circle at 92% 18%, #fde68a 0, #fde68a 12%, transparent 12%),
          var(--bg);
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
      }
      .wrap {
        width: min(1200px, 96vw);
        margin: 1.2rem auto 2rem;
        display: grid;
        gap: 1rem;
      }
      .hero {
        background: linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%);
        border: 1px solid var(--line);
        border-radius: 14px;
        padding: 1rem 1.1rem;
      }
      .hero h1 {
        margin: 0;
        font-size: 1.25rem;
      }
      .hero p {
        margin: 0.45rem 0 0;
        color: var(--muted);
      }
      .grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1rem;
      }
      .card {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 14px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
      }
      .card h2 {
        margin: 0;
        padding: 1rem 1rem 0.2rem;
        font-size: 1.05rem;
      }
      .card p {
        margin: 0;
        padding: 0 1rem 0.8rem;
        color: var(--muted);
      }
      .tools {
        padding: 0 1rem 0.8rem;
        display: grid;
        gap: 0.6rem;
      }
      label {
        display: grid;
        gap: 0.3rem;
        font-size: 0.9rem;
      }
      input, select {
        width: 100%;
        border: 1px solid var(--line);
        border-radius: 10px;
        padding: 0.5rem 0.62rem;
        font: inherit;
        background: #fff;
      }
      .inline-form {
        display: grid;
        grid-template-columns: 1fr 1fr auto;
        gap: 0.45rem;
      }
      .inline-form.parish {
        grid-template-columns: 1fr 1fr 1fr 1fr 220px auto;
      }
      button {
        border: 0;
        border-radius: 10px;
        padding: 0.5rem 0.72rem;
        font-weight: 700;
        cursor: pointer;
      }
      .btn-primary { background: var(--accent); color: #fff; }
      .btn-muted { background: #ede9dd; color: var(--ink); }
      .btn-danger { background: var(--danger); color: #fff; }
      .table-wrap {
        overflow: auto;
        padding: 0 0.8rem 0.8rem;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        min-width: 760px;
      }
      th, td {
        text-align: left;
        vertical-align: middle;
        padding: 0.58rem;
        border-bottom: 1px solid var(--line);
      }
      th {
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--muted);
      }
      .row-actions {
        display: flex;
        gap: 0.38rem;
        flex-wrap: wrap;
      }
      .status {
        margin: 0 1rem 0.8rem;
        color: var(--muted);
        min-height: 1.15rem;
        font-size: 0.9rem;
      }
      .search-input {
        border: 1px solid #c9bba2;
        background: #fffef9;
      }
      .parish-hidden {
        display: none;
      }
      .detail-row > td {
        background: #fffaf0;
      }
      .parish-detail-editor {
        border: 1px solid #e7dcc5;
        border-radius: 12px;
        padding: 0.8rem;
        display: grid;
        gap: 0.8rem;
      }
      .editor-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 0.6rem;
      }
      .editor-grid label {
        font-size: 0.84rem;
      }
      .hint {
        margin: 0;
        color: var(--muted);
        font-size: 0.8rem;
      }
      .file-preview {
        margin: 0;
        padding-left: 1rem;
        font-size: 0.8rem;
        color: #5c4b2f;
      }
      .sub-parish-panel {
        border: 1px dashed #ccb892;
        border-radius: 10px;
        padding: 0.6rem;
        background: #fff;
        display: grid;
        gap: 0.5rem;
      }
      .sub-parish-item {
        border: 1px solid #e5dbc4;
        border-radius: 10px;
        padding: 0.55rem;
        display: grid;
        gap: 0.55rem;
        background: #fffcf4;
      }
      .sub-parish-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.6rem;
      }
      .sub-parish-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.5rem;
      }
      ${adminNavStyles()}
      @media (max-width: 980px) {
        .inline-form.parish {
          grid-template-columns: 1fr;
        }
        .editor-grid {
          grid-template-columns: 1fr;
        }
        .sub-parish-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main class="wrap">
      ${adminNavHtml("parishes")}

      <section class="hero">
        <h1>Deanery and Parish Management</h1>
        <p>Edit a parish row to expand full details and save in MongoDB. Date format: ngay thanh lap/ngay cung hien as dd/mm/yyyy or yyyy, ngay mung le quan thay as dd/mm.</p>
      </section>

      <section class="grid">
        <section class="card">
          <h2>Deaneries</h2>
          <p>Collection: deanery</p>
          <div class="tools">
            <form id="deaneryCreateForm" class="inline-form">
              <label>
                Deanery name
                <input id="newDeaneryName" placeholder="Add deanery..." required />
              </label>
              <label>
                Deanery link
                <input id="newDeaneryHref" placeholder="https://..." />
              </label>
              <button type="submit" class="btn-primary">Add</button>
            </form>
          </div>
          <div id="deaneryStatus" class="status"></div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Link</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="deaneryRows"></tbody>
            </table>
          </div>
        </section>

        <section class="card">
          <h2>Parishes</h2>
          <p>Collection: parish. Field giao_hat references deanery _id.</p>
          <div class="tools">
            <label>
              Search parish
              <input id="parishSearch" class="search-input" placeholder="Type to hide unmatched parishes..." />
            </label>
            <form id="parishCreateForm" class="inline-form parish">
              <label>
                Parish name
                <input id="newParishName" placeholder="Add parish..." required />
              </label>
              <label>
                Parish link
                <input id="newParishHref" placeholder="https://..." />
              </label>
              <label>
                Other name
                <input id="newParishTenKhac" placeholder="Optional alias..." />
              </label>
              <label>
                Address
                <input id="newParishDiaChi" placeholder="Parish address..." />
              </label>
              <label>
                Deanery
                <select id="newParishDeanery" required></select>
              </label>
              <button type="submit" class="btn-primary">Add</button>
            </form>
          </div>
          <div id="parishStatus" class="status"></div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Parish name</th>
                  <th>Link</th>
                  <th>Other name</th>
                  <th>Address</th>
                  <th>Deanery</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="parishRows"></tbody>
            </table>
          </div>
        </section>
      </section>
    </main>

    <script>
      ${navScript()}

      const deaneryRows = document.getElementById("deaneryRows");
      const parishRows = document.getElementById("parishRows");
      const parishSearch = document.getElementById("parishSearch");
      const deaneryStatus = document.getElementById("deaneryStatus");
      const parishStatus = document.getElementById("parishStatus");
      const deaneryCreateForm = document.getElementById("deaneryCreateForm");
      const parishCreateForm = document.getElementById("parishCreateForm");
      const newDeaneryName = document.getElementById("newDeaneryName");
      const newDeaneryHref = document.getElementById("newDeaneryHref");
      const newParishName = document.getElementById("newParishName");
      const newParishHref = document.getElementById("newParishHref");
      const newParishTenKhac = document.getElementById("newParishTenKhac");
      const newParishDiaChi = document.getElementById("newParishDiaChi");
      const newParishDeanery = document.getElementById("newParishDeanery");

      let deaneryCache = [];
      let parishCache = [];
      let expandedParishId = "";

      function escapeHtml(value) {
        return String(value || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      function setDeaneryStatus(message, isError = false) {
        deaneryStatus.textContent = message;
        deaneryStatus.style.color = isError ? "#b91c1c" : "#6b7280";
      }

      function setParishStatus(message, isError = false) {
        parishStatus.textContent = message;
        parishStatus.style.color = isError ? "#b91c1c" : "#6b7280";
      }

      function deaneryOptionsHtml(selectedValue) {
        return deaneryCache
          .map((deanery) => {
            const selected = deanery.id === selectedValue ? " selected" : "";
            return "<option value='" + escapeHtml(deanery.id) + "'" + selected + ">" + escapeHtml(deanery.name) + "</option>";
          })
          .join("");
      }

      function refreshCreateParishDeaneryOptions() {
        newParishDeanery.innerHTML = deaneryOptionsHtml("");
      }

      function renderDeaneryRows() {
        deaneryRows.innerHTML = "";

        if (!deaneryCache.length) {
          const tr = document.createElement("tr");
          tr.innerHTML = "<td colspan='3'>No deaneries found.</td>";
          deaneryRows.appendChild(tr);
          return;
        }

        deaneryCache.forEach((deanery) => {
          const tr = document.createElement("tr");
          tr.setAttribute("data-id", deanery.id);
          tr.innerHTML =
            "<td><input value='" + escapeHtml(deanery.name) + "' data-field='name' /></td>" +
            "<td><input value='" + escapeHtml(deanery.href || "") + "' data-field='href' /></td>" +
            "<td><div class='row-actions'>" +
            "<button type='button' class='btn-muted' data-action='save'>Save</button>" +
            "<button type='button' class='btn-danger' data-action='delete'>Delete</button>" +
            "</div></td>";
          deaneryRows.appendChild(tr);
        });
      }

      function attachmentsPreviewHtml(list) {
        const items = Array.isArray(list) ? list.filter((item) => item && item.name) : [];
        if (!items.length) {
          return "<p class='hint'>No files uploaded.</p>";
        }

        return "<ul class='file-preview'>" +
          items.map((item) => "<li>" + escapeHtml(item.name) + "</li>").join("") +
          "</ul>";
      }

      function subParishEditorHtml(subParish, sourceIndex) {
        const sourceAttr = Number.isInteger(sourceIndex) ? String(sourceIndex) : "-1";
        return "<div class='sub-parish-item' data-source-index='" + sourceAttr + "'>" +
          "<div class='sub-parish-header'>" +
          "<strong>Sub-parish</strong>" +
          "<button type='button' class='btn-danger' data-action='remove-sub-parish'>Remove</button>" +
          "</div>" +
          "<div class='sub-parish-grid'>" +
          "<label>Parish name<input data-field='sub_parish_name' value='" + escapeHtml(subParish.parish_name || "") + "' /></label>" +
          "<label>Other name<input data-field='sub_other_name' value='" + escapeHtml(subParish.other_name || "") + "' /></label>" +
          "<label>Parish link<input data-field='sub_parish_link' value='" + escapeHtml(subParish.parish_link || "") + "' /></label>" +
          "<label>Address<input data-field='sub_address' value='" + escapeHtml(subParish.address || "") + "' /></label>" +
          "<label>Ngay thanh lap<input data-field='sub_ngay_thanh_lap' placeholder='dd/mm/yyyy or yyyy' value='" + escapeHtml(subParish.ngay_thanh_lap || "") + "' /></label>" +
          "<label>Ten thanh quan thay<input data-field='sub_ten_thanh_quan_thay' value='" + escapeHtml(subParish.ten_thanh_quan_thay || "") + "' /></label>" +
          "<label>Ngay mung le quan thay<input data-field='sub_ngay_mung_le_quan_thay' placeholder='dd/mm' value='" + escapeHtml(subParish.ngay_mung_le_quan_thay || "") + "' /></label>" +
          "<label>So nhan danh<input data-field='sub_so_nhan_danh' value='" + escapeHtml(subParish.so_nhan_danh || "") + "' /></label>" +
          "<label>Documents (multi)<input type='file' multiple data-field='sub_documents_upload' /></label>" +
          "<label>Media (multi)<input type='file' multiple data-field='sub_media_upload' /></label>" +
          "</div>" +
          "<div>" +
          "<p class='hint'>Existing documents:</p>" + attachmentsPreviewHtml(subParish.documents || []) +
          "<p class='hint'>Existing media:</p>" + attachmentsPreviewHtml(subParish.media || []) +
          "</div>" +
          "</div>";
      }

      function parishDetailHtml(parish) {
        const subParishes = Array.isArray(parish.giao_ho_truc_thuoc) ? parish.giao_ho_truc_thuoc : [];
        const subParishBlock = subParishes.length
          ? subParishes.map((item, index) => subParishEditorHtml(item || {}, index)).join("")
          : "<p class='hint'>No sub-parishes yet.</p>";

        return "<div class='parish-detail-editor' data-id='" + escapeHtml(parish.id) + "'>" +
          "<div class='editor-grid'>" +
          "<label>Parish name<input data-field='name' value='" + escapeHtml(parish.name || "") + "' /></label>" +
          "<label>Parish link<input data-field='href' value='" + escapeHtml(parish.href || "") + "' /></label>" +
          "<label>Other name<input data-field='ten_khac' value='" + escapeHtml(parish.ten_khac || "") + "' /></label>" +
          "<label>Address<input data-field='dia_chi' value='" + escapeHtml(parish.dia_chi || "") + "' /></label>" +
          "<label>Deanery<select data-field='giao_hat'>" + deaneryOptionsHtml(parish.giao_hat) + "</select></label>" +
          "<label>Ngay thanh lap<input data-field='ngay_thanh_lap' placeholder='dd/mm/yyyy or yyyy' value='" + escapeHtml(parish.ngay_thanh_lap || "") + "' /></label>" +
          "<label>Ten thanh quan thay<input data-field='ten_thanh_quan_thay' value='" + escapeHtml(parish.ten_thanh_quan_thay || "") + "' /></label>" +
          "<label>Ngay mung le quan thay<input data-field='ngay_mung_le_quan_thay' placeholder='dd/mm' value='" + escapeHtml(parish.ngay_mung_le_quan_thay || "") + "' /></label>" +
          "<label>Ngay cung hien<input data-field='ngay_cung_hien' placeholder='dd/mm/yyyy or yyyy' value='" + escapeHtml(parish.ngay_cung_hien || "") + "' /></label>" +
          "<label>So nhan danh<input data-field='so_nhan_danh' value='" + escapeHtml(parish.so_nhan_danh || "") + "' /></label>" +
          "<label>Linh muc chinh xu<input data-field='linh_muc_chinh_xu' value='" + escapeHtml(parish.linh_muc_chinh_xu || "") + "' /></label>" +
          "<label>Documents (multi)<input type='file' multiple data-field='documents_upload' /></label>" +
          "<label>Media (multi)<input type='file' multiple data-field='media_upload' /></label>" +
          "</div>" +
          "<div>" +
          "<p class='hint'>Existing documents:</p>" + attachmentsPreviewHtml(parish.documents || []) +
          "<p class='hint'>Existing media:</p>" + attachmentsPreviewHtml(parish.media || []) +
          "</div>" +
          "<div class='sub-parish-panel'>" +
          "<div class='sub-parish-header'>" +
          "<strong>Giao ho truc thuoc</strong>" +
          "<button type='button' class='btn-muted' data-action='add-sub-parish' data-id='" + escapeHtml(parish.id) + "'>Add sub-parish</button>" +
          "</div>" +
          "<div class='sub-parish-list'>" + subParishBlock + "</div>" +
          "</div>" +
          "<div class='row-actions'>" +
          "<button type='button' class='btn-primary' data-action='save-detail' data-id='" + escapeHtml(parish.id) + "'>Save</button>" +
          "<button type='button' class='btn-muted' data-action='cancel-detail' data-id='" + escapeHtml(parish.id) + "'>Collapse</button>" +
          "</div>" +
          "</div>";
      }

      function renderParishRows() {
        parishRows.innerHTML = "";

        if (!parishCache.length) {
          const tr = document.createElement("tr");
          tr.innerHTML = "<td colspan='7'>No parishes found.</td>";
          parishRows.appendChild(tr);
          return;
        }

        parishCache.forEach((parish, index) => {
          const tr = document.createElement("tr");
          tr.setAttribute("data-kind", "main");
          tr.setAttribute("data-id", parish.id);
          const searchIndex = String(
            (parish.name || "") + " " +
            (parish.deaneryName || "") + " " +
            (parish.ten_khac || "") + " " +
            (parish.dia_chi || "")
          ).toLowerCase();
          tr.setAttribute("data-search", searchIndex);

          const isExpanded = expandedParishId === parish.id;
          tr.innerHTML =
            "<td>" + String(index + 1) + "</td>" +
            "<td>" + escapeHtml(parish.name || "-") + "</td>" +
            "<td>" + (parish.href ? "<a href='" + escapeHtml(parish.href) + "' target='_blank' rel='noopener noreferrer'>Open</a>" : "-") + "</td>" +
            "<td>" + escapeHtml(parish.ten_khac || "-") + "</td>" +
            "<td>" + escapeHtml(parish.dia_chi || "-") + "</td>" +
            "<td>" + escapeHtml(parish.deaneryName || "-") + "</td>" +
            "<td><div class='row-actions'>" +
            "<button type='button' class='btn-muted' data-action='edit' data-id='" + escapeHtml(parish.id) + "'>" + (isExpanded ? "Collapse" : "Edit") + "</button>" +
            "<button type='button' class='btn-danger' data-action='delete' data-id='" + escapeHtml(parish.id) + "'>Delete</button>" +
            "</div></td>";
          parishRows.appendChild(tr);

          if (isExpanded) {
            const detailRow = document.createElement("tr");
            detailRow.className = "detail-row";
            detailRow.setAttribute("data-kind", "detail");
            detailRow.setAttribute("data-parent-id", parish.id);
            detailRow.innerHTML = "<td colspan='7'>" + parishDetailHtml(parish) + "</td>";
            parishRows.appendChild(detailRow);
          }
        });

        applyParishFilter();
      }

      function applyParishFilter() {
        const query = parishSearch.value.trim().toLowerCase();
        const rows = Array.from(parishRows.querySelectorAll("tr[data-kind='main']"));
        let visible = 0;

        rows.forEach((row) => {
          const id = String(row.getAttribute("data-id") || "");
          const haystack = String(row.getAttribute("data-search") || "");
          const matched = !query || haystack.includes(query);
          row.classList.toggle("parish-hidden", !matched);

          const detailRow = parishRows.querySelector("tr[data-kind='detail'][data-parent-id='" + id + "']");
          if (detailRow) {
            detailRow.classList.toggle("parish-hidden", !matched);
          }

          if (matched) {
            visible += 1;
          }
        });

        setParishStatus("Showing " + visible + " matched parish(es) out of " + parishCache.length + ".");
      }

      function isValidDateOrYear(value) {
        return !value || /^(\\d{1,2}\\/\\d{1,2}\\/\\d{4}|\\d{4})$/.test(String(value).trim());
      }

      function isValidDayMonth(value) {
        return !value || /^\\d{1,2}\\/\\d{1,2}$/.test(String(value).trim());
      }

      function readFilesAsAttachments(fileList) {
        const files = Array.from(fileList || []);
        return Promise.all(files.map((file) => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function onload() {
              resolve({
                name: file.name,
                type: file.type || "",
                size: file.size || 0,
                dataUrl: String(reader.result || ""),
              });
            };
            reader.onerror = function onerror() {
              reject(new Error("Failed to read file: " + file.name));
            };
            reader.readAsDataURL(file);
          });
        }));
      }

      async function fetchDeaneries() {
        const response = await fetch("/api/deaneries");
        if (!response.ok) {
          const body = await response.json();
          throw new Error(body.error || "Failed to load deaneries.");
        }
        deaneryCache = await response.json();
      }

      async function fetchParishes() {
        const response = await fetch("/api/parishes");
        if (!response.ok) {
          const body = await response.json();
          throw new Error(body.error || "Failed to load parishes.");
        }
        parishCache = await response.json();
      }

      async function loadAll() {
        try {
          setDeaneryStatus("Loading deaneries...");
          setParishStatus("Loading parishes...");
          await fetchDeaneries();
          await fetchParishes();
          renderDeaneryRows();
          refreshCreateParishDeaneryOptions();
          renderParishRows();
          setDeaneryStatus("Loaded " + deaneryCache.length + " deanery(ies).");
        } catch (error) {
          setDeaneryStatus(error.message || "Load failed.", true);
          setParishStatus(error.message || "Load failed.", true);
        }
      }

      async function createDeanery(event) {
        event.preventDefault();
        const payload = {
          name: newDeaneryName.value,
          href: newDeaneryHref.value,
        };

        try {
          setDeaneryStatus("Creating deanery...");
          const response = await fetch("/api/deaneries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const body = await response.json();
            throw new Error(body.error || "Failed to create deanery.");
          }

          newDeaneryName.value = "";
          newDeaneryHref.value = "";
          await loadAll();
          setDeaneryStatus("Deanery created.");
        } catch (error) {
          setDeaneryStatus(error.message || "Failed to create deanery.", true);
        }
      }

      async function createParish(event) {
        event.preventDefault();
        const payload = {
          name: newParishName.value,
          href: newParishHref.value,
          ten_khac: newParishTenKhac.value,
          dia_chi: newParishDiaChi.value,
          giao_hat: newParishDeanery.value,
        };

        try {
          setParishStatus("Creating parish...");
          const response = await fetch("/api/parishes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const body = await response.json();
            throw new Error(body.error || "Failed to create parish.");
          }

          newParishName.value = "";
          newParishHref.value = "";
          newParishTenKhac.value = "";
          newParishDiaChi.value = "";
          await loadAll();
          setParishStatus("Parish created.");
        } catch (error) {
          setParishStatus(error.message || "Failed to create parish.", true);
        }
      }

      async function saveDeaneryRow(row) {
        const id = row.getAttribute("data-id");
        const nameInput = row.querySelector("input[data-field='name']");
        const hrefInput = row.querySelector("input[data-field='href']");
        const payload = {
          name: nameInput ? nameInput.value : "",
          href: hrefInput ? hrefInput.value : "",
        };

        try {
          setDeaneryStatus("Saving deanery...");
          const response = await fetch("/api/deaneries/" + id, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const body = await response.json();
            throw new Error(body.error || "Failed to save deanery.");
          }

          await loadAll();
          setDeaneryStatus("Deanery saved.");
        } catch (error) {
          setDeaneryStatus(error.message || "Failed to save deanery.", true);
        }
      }

      async function deleteDeaneryRow(row) {
        const id = row.getAttribute("data-id");
        if (!confirm("Delete this deanery?")) {
          return;
        }

        try {
          setDeaneryStatus("Deleting deanery...");
          const response = await fetch("/api/deaneries/" + id, { method: "DELETE" });

          if (!response.ok) {
            const body = await response.json();
            throw new Error(body.error || "Failed to delete deanery.");
          }

          await loadAll();
          setDeaneryStatus("Deanery deleted.");
        } catch (error) {
          setDeaneryStatus(error.message || "Failed to delete deanery.", true);
        }
      }

      function getRowValue(container, field) {
        const node = container.querySelector("[data-field='" + field + "']");
        return node ? node.value : "";
      }

      async function saveParishDetail(parishId) {
        const detailRow = parishRows.querySelector("tr[data-kind='detail'][data-parent-id='" + parishId + "']");
        if (!detailRow) {
          setParishStatus("Open the parish row before saving.", true);
          return;
        }

        const editor = detailRow.querySelector(".parish-detail-editor");
        const parish = parishCache.find((item) => item.id === parishId) || {};

        const ngayThanhLap = getRowValue(editor, "ngay_thanh_lap").trim();
        const ngayMungLeQuanThay = getRowValue(editor, "ngay_mung_le_quan_thay").trim();
        const ngayCungHien = getRowValue(editor, "ngay_cung_hien").trim();

        if (!isValidDateOrYear(ngayThanhLap)) {
          setParishStatus("Ngay thanh lap must be dd/mm/yyyy or yyyy.", true);
          return;
        }
        if (!isValidDayMonth(ngayMungLeQuanThay)) {
          setParishStatus("Ngay mung le quan thay must be dd/mm.", true);
          return;
        }
        if (!isValidDateOrYear(ngayCungHien)) {
          setParishStatus("Ngay cung hien must be dd/mm/yyyy or yyyy.", true);
          return;
        }

        const mainDocumentInput = editor.querySelector("input[data-field='documents_upload']");
        const mainMediaInput = editor.querySelector("input[data-field='media_upload']");
        const newDocuments = await readFilesAsAttachments(mainDocumentInput ? mainDocumentInput.files : []);
        const newMedia = await readFilesAsAttachments(mainMediaInput ? mainMediaInput.files : []);

        const currentSubParishes = Array.isArray(parish.giao_ho_truc_thuoc) ? parish.giao_ho_truc_thuoc : [];
        const subParishNodes = Array.from(editor.querySelectorAll(".sub-parish-item"));
        const subParishes = [];

        for (const node of subParishNodes) {
          const sourceIndex = Number(node.getAttribute("data-source-index"));
          const source = Number.isInteger(sourceIndex) && sourceIndex >= 0 ? currentSubParishes[sourceIndex] || {} : {};
          const subNgayThanhLap = getRowValue(node, "sub_ngay_thanh_lap").trim();
          const subNgayMungLe = getRowValue(node, "sub_ngay_mung_le_quan_thay").trim();

          if (!isValidDateOrYear(subNgayThanhLap)) {
            setParishStatus("Sub-parish ngay thanh lap must be dd/mm/yyyy or yyyy.", true);
            return;
          }
          if (!isValidDayMonth(subNgayMungLe)) {
            setParishStatus("Sub-parish ngay mung le quan thay must be dd/mm.", true);
            return;
          }

          const subName = getRowValue(node, "sub_parish_name").trim();
          if (!subName) {
            continue;
          }

          const subDocumentsInput = node.querySelector("input[data-field='sub_documents_upload']");
          const subMediaInput = node.querySelector("input[data-field='sub_media_upload']");
          const newSubDocuments = await readFilesAsAttachments(subDocumentsInput ? subDocumentsInput.files : []);
          const newSubMedia = await readFilesAsAttachments(subMediaInput ? subMediaInput.files : []);

          subParishes.push({
            parish_name: subName,
            other_name: getRowValue(node, "sub_other_name"),
            parish_link: getRowValue(node, "sub_parish_link"),
            address: getRowValue(node, "sub_address"),
            ngay_thanh_lap: subNgayThanhLap,
            ten_thanh_quan_thay: getRowValue(node, "sub_ten_thanh_quan_thay"),
            ngay_mung_le_quan_thay: subNgayMungLe,
            so_nhan_danh: getRowValue(node, "sub_so_nhan_danh"),
            documents: (Array.isArray(source.documents) ? source.documents : []).concat(newSubDocuments),
            media: (Array.isArray(source.media) ? source.media : []).concat(newSubMedia),
          });
        }

        const payload = {
          name: getRowValue(editor, "name"),
          href: getRowValue(editor, "href"),
          ten_khac: getRowValue(editor, "ten_khac"),
          dia_chi: getRowValue(editor, "dia_chi"),
          giao_hat: getRowValue(editor, "giao_hat"),
          ngay_thanh_lap: ngayThanhLap,
          ten_thanh_quan_thay: getRowValue(editor, "ten_thanh_quan_thay"),
          ngay_mung_le_quan_thay: ngayMungLeQuanThay,
          ngay_cung_hien: ngayCungHien,
          so_nhan_danh: getRowValue(editor, "so_nhan_danh"),
          linh_muc_chinh_xu: getRowValue(editor, "linh_muc_chinh_xu"),
          giao_ho_truc_thuoc: subParishes,
          documents: (Array.isArray(parish.documents) ? parish.documents : []).concat(newDocuments),
          media: (Array.isArray(parish.media) ? parish.media : []).concat(newMedia),
        };

        try {
          setParishStatus("Saving parish detail...");
          const response = await fetch("/api/parishes/" + parishId, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const body = await response.json();
            throw new Error(body.error || "Failed to save parish.");
          }

          expandedParishId = "";
          await loadAll();
          setParishStatus("Parish saved.");
        } catch (error) {
          setParishStatus(error.message || "Failed to save parish.", true);
        }
      }

      async function deleteParishById(parishId) {
        if (!confirm("Delete this parish?")) {
          return;
        }

        try {
          setParishStatus("Deleting parish...");
          const response = await fetch("/api/parishes/" + parishId, { method: "DELETE" });

          if (!response.ok) {
            const body = await response.json();
            throw new Error(body.error || "Failed to delete parish.");
          }

          if (expandedParishId === parishId) {
            expandedParishId = "";
          }
          await loadAll();
          setParishStatus("Parish deleted.");
        } catch (error) {
          setParishStatus(error.message || "Failed to delete parish.", true);
        }
      }

      function addSubParishEditor(parishId) {
        const detailRow = parishRows.querySelector("tr[data-kind='detail'][data-parent-id='" + parishId + "']");
        if (!detailRow) {
          return;
        }

        const list = detailRow.querySelector(".sub-parish-list");
        if (!list) {
          return;
        }

        const hint = list.querySelector(".hint");
        if (hint) {
          hint.remove();
        }

        const wrapper = document.createElement("div");
        wrapper.innerHTML = subParishEditorHtml({}, -1);
        const item = wrapper.firstElementChild;
        if (item) {
          list.appendChild(item);
        }
      }

      deaneryRows.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) {
          return;
        }

        const row = button.closest("tr[data-id]");
        if (!row) {
          return;
        }

        const action = button.getAttribute("data-action");
        if (action === "save") {
          saveDeaneryRow(row);
          return;
        }

        if (action === "delete") {
          deleteDeaneryRow(row);
        }
      });

      parishRows.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) {
          return;
        }

        const action = button.getAttribute("data-action");
        const parishId = button.getAttribute("data-id") || "";

        if (action === "edit") {
          expandedParishId = expandedParishId === parishId ? "" : parishId;
          renderParishRows();
          return;
        }

        if (action === "delete") {
          deleteParishById(parishId);
          return;
        }

        if (action === "cancel-detail") {
          expandedParishId = "";
          renderParishRows();
          return;
        }

        if (action === "save-detail") {
          saveParishDetail(parishId);
          return;
        }

        if (action === "add-sub-parish") {
          addSubParishEditor(parishId);
          return;
        }

        if (action === "remove-sub-parish") {
          const node = button.closest(".sub-parish-item");
          if (node) {
            node.remove();
          }
        }
      });

      parishSearch.addEventListener("input", applyParishFilter);
      deaneryCreateForm.addEventListener("submit", createDeanery);
      parishCreateForm.addEventListener("submit", createParish);

      loadAll();
    </script>
  </body>
</html>`;
}

function buildUsersPage() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>User Management</title>
    <style>
      ${adminShellStyles("blue")}
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: var(--ink);
        background:
          radial-gradient(circle at 15% 12%, #dbeafe 0, #dbeafe 18%, transparent 18%),
          radial-gradient(circle at 88% 20%, #bfdbfe 0, #bfdbfe 16%, transparent 16%),
          var(--bg);
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
      }
      .wrap {
        width: min(1180px, 96vw);
        margin: 1.2rem auto 2rem;
        display: grid;
        gap: 1rem;
      }
      .card {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 14px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
      }
      .card h2 {
        margin: 0;
        padding: 1rem 1rem 0.2rem;
        font-size: 1.06rem;
      }
      .card p {
        margin: 0;
        padding: 0 1rem 0.8rem;
        color: var(--muted);
      }
      .tools {
        padding: 0 1rem 0.8rem;
      }
      .create-grid {
        display: grid;
        grid-template-columns: 1.4fr 1.2fr 1fr 1fr 1fr auto;
        gap: 0.45rem;
        align-items: end;
      }
      label {
        display: grid;
        gap: 0.35rem;
        font-size: 0.9rem;
      }
      input, select {
        width: 100%;
        border: 1px solid var(--line);
        border-radius: 10px;
        padding: 0.5rem 0.62rem;
        font: inherit;
      }
      button {
        border: 0;
        border-radius: 10px;
        padding: 0.5rem 0.72rem;
        font-weight: 700;
        cursor: pointer;
      }
      .btn-primary { background: var(--accent); color: #fff; }
      .btn-muted { background: #e5e7eb; color: var(--ink); }
      .btn-danger { background: var(--danger); color: #fff; }
      .status {
        margin: 0 1rem 0.8rem;
        color: var(--muted);
        min-height: 1.2rem;
      }
      .table-wrap {
        overflow: auto;
        padding: 0 0.8rem 0.8rem;
      }
      table {
        width: 100%;
        min-width: 820px;
        border-collapse: collapse;
      }
      th, td {
        text-align: left;
        vertical-align: top;
        border-bottom: 1px solid var(--line);
        padding: 0.58rem;
      }
      th {
        color: var(--muted);
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .row-actions {
        display: flex;
        gap: 0.35rem;
      }
      .row-stack {
        display: grid;
        gap: 0.45rem;
      }
      .badge {
        display: inline-flex;
        border-radius: 999px;
        border: 1px solid var(--line);
        padding: 0.15rem 0.45rem;
        font-size: 0.76rem;
        color: var(--muted);
      }
      ${adminNavStyles()}
      @media (max-width: 980px) {
        .create-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main class="wrap">
      ${adminNavHtml("users")}

      <section class="card">
        <h2>User Management</h2>
        <p>Only superadmin can access this page.</p>
        <div class="tools">
          <form id="createForm" class="create-grid">
            <label>
              Username
              <input id="createUsername" required />
            </label>
            <label>
              Display name
              <input id="createDisplayName" />
            </label>
            <label>
              Password
              <input id="createPassword" type="password" required />
            </label>
            <label>
              Role
              <select id="createRole">
                <option value="admin" selected>admin</option>
                <option value="superadmin">superadmin</option>
              </select>
            </label>
            <label>
              Status
              <select id="createActive">
                <option value="true" selected>active</option>
                <option value="false">disabled</option>
              </select>
            </label>
            <button type="submit" class="btn-primary">Create</button>
          </form>
        </div>
        <div id="statusText" class="status"></div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Display Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Password</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="rows"></tbody>
          </table>
        </div>
      </section>
    </main>

    <script>
      ${navScript()}

      const createForm = document.getElementById("createForm");
      const createUsername = document.getElementById("createUsername");
      const createDisplayName = document.getElementById("createDisplayName");
      const createPassword = document.getElementById("createPassword");
      const createRole = document.getElementById("createRole");
      const createActive = document.getElementById("createActive");
      const rows = document.getElementById("rows");
      const statusText = document.getElementById("statusText");

      let cache = [];

      function escapeHtml(value) {
        return String(value || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/\"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      function setStatus(message, isError = false) {
        statusText.textContent = message;
        statusText.style.color = isError ? "#b91c1c" : "#5a6478";
      }

      function renderRows() {
        rows.innerHTML = "";

        if (!cache.length) {
          const tr = document.createElement("tr");
          tr.innerHTML = "<td colspan='6'>No users found.</td>";
          rows.appendChild(tr);
          return;
        }

        cache.forEach((user) => {
          const tr = document.createElement("tr");
          tr.setAttribute("data-id", user.id);
          tr.innerHTML =
            "<td><div class='row-stack'><strong>" + escapeHtml(user.username) + "</strong>" +
            (user.isDefaultSuperadmin ? "<span class='badge'>default superadmin</span>" : "") +
            "</div></td>" +
            "<td><input data-field='displayName' value='" + escapeHtml(user.displayName || "") + "' /></td>" +
            "<td><select data-field='role'>" +
            "<option value='admin'" + (user.role === "admin" ? " selected" : "") + ">admin</option>" +
            "<option value='superadmin'" + (user.role === "superadmin" ? " selected" : "") + ">superadmin</option>" +
            "</select></td>" +
            "<td><select data-field='isActive'>" +
            "<option value='true'" + (user.isActive ? " selected" : "") + ">active</option>" +
            "<option value='false'" + (!user.isActive ? " selected" : "") + ">disabled</option>" +
            "</select></td>" +
            "<td><input data-field='password' type='password' placeholder='Leave blank to keep' /></td>" +
            "<td><div class='row-actions'>" +
            "<button class='btn-muted' data-action='save' type='button'>Save</button>" +
            "<button class='btn-danger' data-action='delete' type='button'>Delete</button>" +
            "</div></td>";
          rows.appendChild(tr);
        });
      }

      async function loadUsers() {
        try {
          setStatus("Loading users...");
          const response = await fetch("/api/users", { credentials: "same-origin" });

          if (response.status === 403) {
            throw new Error("Only superadmin can access user management.");
          }

          if (!response.ok) {
            const body = await response.json();
            throw new Error(body.error || "Failed to load users.");
          }

          cache = await response.json();
          renderRows();
          setStatus("Loaded " + cache.length + " user(s).");
        } catch (error) {
          setStatus(error.message || "Failed to load users.", true);
        }
      }

      async function createUser(event) {
        event.preventDefault();

        const payload = {
          username: createUsername.value,
          displayName: createDisplayName.value,
          password: createPassword.value,
          role: createRole.value,
          isActive: createActive.value === "true",
        };

        try {
          setStatus("Creating user...");
          const response = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const body = await response.json();
            throw new Error(body.error || "Failed to create user.");
          }

          createForm.reset();
          createRole.value = "admin";
          createActive.value = "true";
          await loadUsers();
          setStatus("User created.");
        } catch (error) {
          setStatus(error.message || "Failed to create user.", true);
        }
      }

      async function saveUser(row) {
        const id = row.getAttribute("data-id");
        const displayName = row.querySelector("input[data-field='displayName']").value;
        const role = row.querySelector("select[data-field='role']").value;
        const isActive = row.querySelector("select[data-field='isActive']").value === "true";
        const password = row.querySelector("input[data-field='password']").value;

        const payload = {
          displayName,
          role,
          isActive,
        };

        if (password) {
          payload.password = password;
        }

        try {
          setStatus("Saving user...");
          const response = await fetch("/api/users/" + id, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const body = await response.json();
            throw new Error(body.error || "Failed to save user.");
          }

          await loadUsers();
          setStatus("User saved.");
        } catch (error) {
          setStatus(error.message || "Failed to save user.", true);
        }
      }

      async function deleteUser(row) {
        const id = row.getAttribute("data-id");
        if (!confirm("Delete this user?")) {
          return;
        }

        try {
          setStatus("Deleting user...");
          const response = await fetch("/api/users/" + id, {
            method: "DELETE",
            credentials: "same-origin",
          });

          if (!response.ok) {
            const body = await response.json();
            throw new Error(body.error || "Failed to delete user.");
          }

          await loadUsers();
          setStatus("User deleted.");
        } catch (error) {
          setStatus(error.message || "Failed to delete user.", true);
        }
      }

      rows.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) {
          return;
        }

        const row = button.closest("tr[data-id]");
        if (!row) {
          return;
        }

        const action = button.getAttribute("data-action");
        if (action === "save") {
          saveUser(row);
          return;
        }

        if (action === "delete") {
          deleteUser(row);
        }
      });

      createForm.addEventListener("submit", createUser);
      loadUsers();
    </script>
  </body>
</html>`;
}

async function adminRoutes(fastify) {
  const users = () => fastify.mongo.db.collection("admin_user");

  async function ensureDefaultSuperadmin() {
    const envUsername = asString(process.env.SUPERADMIN_USERNAME || "superadmin");
    const envPassword = asString(process.env.SUPERADMIN_PASSWORD || "superadmin123");
    const envDisplayName = asString(process.env.SUPERADMIN_DISPLAY_NAME || "Default Superadmin");

    if (!envUsername || !envPassword) {
      throw new Error("SUPERADMIN_USERNAME and SUPERADMIN_PASSWORD are required.");
    }

    const now = new Date();
    const existing = await users().findOne({ username: envUsername });

    if (!existing) {
      await users().insertOne({
        username: envUsername,
        displayName: envDisplayName,
        passwordHash: hashPassword(envPassword),
        role: "superadmin",
        isActive: true,
        isDefaultSuperadmin: true,
        createdAt: now,
        updatedAt: now,
      });
      return;
    }

    if (existing.isDefaultSuperadmin) {
      await users().updateOne(
        { _id: existing._id },
        {
          $set: {
            displayName: envDisplayName || existing.displayName || envUsername,
            passwordHash: hashPassword(envPassword),
            role: "superadmin",
            isActive: true,
            updatedAt: now,
          },
        }
      );
    }
  }

  function sendAuthCookie(reply, token) {
    reply.setCookie(SESSION_COOKIE, token, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: Math.floor(SESSION_TTL_MS / 1000),
    });
  }

  function clearAuthCookie(reply) {
    reply.clearCookie(SESSION_COOKIE, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  function requirePageAuth(request, reply, requireSuperadmin = false) {
    const session = getSessionFromRequest(request);
    if (!session) {
      reply.redirect("/login");
      return null;
    }

    if (requireSuperadmin && session.role !== "superadmin") {
      reply.code(403).type("text/plain").send("Forbidden: superadmin only.");
      return null;
    }

    return session;
  }

  function requireApiAuth(request, reply, requireSuperadmin = false) {
    const session = getSessionFromRequest(request);
    if (!session) {
      reply.code(401).send({ error: "Authentication required." });
      return null;
    }

    if (requireSuperadmin && session.role !== "superadmin") {
      reply.code(403).send({ error: "Forbidden: superadmin only." });
      return null;
    }

    return session;
  }

  fastify.get("/login", async function loginPage(request, reply) {
    clearExpiredSessions();

    const session = getSessionFromRequest(request);
    if (session) {
      return reply.redirect("/admin");
    }

    return reply.type("text/html").send(buildLoginPage());
  });

  fastify.post("/api/auth/login", async function loginApi(request, reply) {
    clearExpiredSessions();
    await ensureDefaultSuperadmin();

    const username = asString(request.body && request.body.username).toLowerCase();
    const password = asString(request.body && request.body.password);

    if (!username || !password) {
      return reply.code(400).send({ error: "username and password are required." });
    }

    const user = await users().findOne({ username });
    if (!user || !user.isActive) {
      return reply.code(401).send({ error: "Invalid username or password." });
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return reply.code(401).send({ error: "Invalid username or password." });
    }

    const token = createSession(user);
    sendAuthCookie(reply, token);

    return reply.send(sanitizeUser(user));
  });

  fastify.get("/api/auth/me", async function meApi(request, reply) {
    const session = requireApiAuth(request, reply, false);
    if (!session) {
      return;
    }

    return reply.send({
      id: session.userId,
      username: session.username,
      displayName: session.displayName,
      role: session.role,
    });
  });

  fastify.post("/api/auth/logout", async function logoutApi(request, reply) {
    const session = getSessionFromRequest(request);
    if (session) {
      sessions.delete(session.token);
    }
    clearAuthCookie(reply);
    return reply.send({ ok: true });
  });

  fastify.get("/admin", async function adminPage(request, reply) {
    const session = requirePageAuth(request, reply, false);
    if (!session) {
      return;
    }

    return reply.type("text/html").send(buildPriestsPage());
  });

  fastify.get("/admin/parishes", async function parishAdminPage(request, reply) {
    const session = requirePageAuth(request, reply, false);
    if (!session) {
      return;
    }

    return reply.type("text/html").send(buildParishesPage());
  });

  fastify.get("/admin/users", async function usersAdminPage(request, reply) {
    const session = requirePageAuth(request, reply, true);
    if (!session) {
      return;
    }

    return reply.type("text/html").send(buildUsersPage());
  });

  fastify.get("/api/users", async function listUsersApi(request, reply) {
    const session = requireApiAuth(request, reply, true);
    if (!session) {
      return;
    }

    await ensureDefaultSuperadmin();
    const docs = await users().find({}).sort({ username: 1 }).toArray();
    return docs.map(sanitizeUser);
  });

  fastify.post("/api/users", async function createUserApi(request, reply) {
    const session = requireApiAuth(request, reply, true);
    if (!session) {
      return;
    }

    const username = asString(request.body && request.body.username).toLowerCase();
    const displayName = asString(request.body && request.body.displayName) || username;
    const password = asString(request.body && request.body.password);
    const role = asString(request.body && request.body.role) || "admin";
    const isActive = Boolean(request.body && request.body.isActive !== false);

    if (!username || !password) {
      return reply.code(400).send({ error: "username and password are required." });
    }

    if (!["admin", "superadmin"].includes(role)) {
      return reply.code(400).send({ error: "role must be admin or superadmin." });
    }

    const existed = await users().findOne({ username });
    if (existed) {
      return reply.code(409).send({ error: "username already exists." });
    }

    const now = new Date();
    const doc = {
      username,
      displayName,
      passwordHash: hashPassword(password),
      role,
      isActive,
      isDefaultSuperadmin: false,
      createdAt: now,
      updatedAt: now,
    };

    const result = await users().insertOne(doc);
    return reply.code(201).send(sanitizeUser({ _id: result.insertedId, ...doc }));
  });

  fastify.put("/api/users/:id", async function updateUserApi(request, reply) {
    const session = requireApiAuth(request, reply, true);
    if (!session) {
      return;
    }

    const { id } = request.params;
    if (!fastify.mongo.ObjectId.isValid(id)) {
      return reply.code(400).send({ error: "Invalid id." });
    }

    const objectId = new fastify.mongo.ObjectId(id);
    const current = await users().findOne({ _id: objectId });
    if (!current) {
      return reply.code(404).send({ error: "User not found." });
    }

    const displayName = asString(request.body && request.body.displayName) || current.displayName || current.username;
    const requestedRole = asString(request.body && request.body.role) || current.role;
    const role = current.isDefaultSuperadmin ? "superadmin" : requestedRole;
    const isActive = current.isDefaultSuperadmin ? true : Boolean(request.body && request.body.isActive !== false);
    const password = asString(request.body && request.body.password);

    if (!["admin", "superadmin"].includes(role)) {
      return reply.code(400).send({ error: "role must be admin or superadmin." });
    }

    const updateDoc = {
      displayName,
      role,
      isActive,
      updatedAt: new Date(),
    };

    if (password) {
      updateDoc.passwordHash = hashPassword(password);
    }

    await users().updateOne({ _id: objectId }, { $set: updateDoc });
    const updated = await users().findOne({ _id: objectId });
    return reply.send(sanitizeUser(updated));
  });

  fastify.delete("/api/users/:id", async function deleteUserApi(request, reply) {
    const session = requireApiAuth(request, reply, true);
    if (!session) {
      return;
    }

    const { id } = request.params;
    if (!fastify.mongo.ObjectId.isValid(id)) {
      return reply.code(400).send({ error: "Invalid id." });
    }

    const objectId = new fastify.mongo.ObjectId(id);
    const current = await users().findOne({ _id: objectId });
    if (!current) {
      return reply.code(404).send({ error: "User not found." });
    }

    if (current.isDefaultSuperadmin) {
      return reply.code(409).send({ error: "Default superadmin cannot be deleted." });
    }

    if (String(current._id) === session.userId) {
      return reply.code(409).send({ error: "You cannot delete the current logged-in user." });
    }

    if (current.role === "superadmin") {
      const superadminCount = await users().countDocuments({ role: "superadmin" });
      if (superadminCount <= 1) {
        return reply.code(409).send({ error: "Cannot delete last superadmin." });
      }
    }

    await users().deleteOne({ _id: objectId });
    return reply.code(204).send();
  });
}

module.exports = adminRoutes;
