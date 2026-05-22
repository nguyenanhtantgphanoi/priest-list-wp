async function adminRoutes(fastify) {
  fastify.get("/admin", async function adminPage(_request, reply) {
    return reply.type("text/html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Priest Admin</title>
    <style>
      :root {
        --bg: #f2f5f8;
        --panel: #ffffff;
        --ink: #1f2a37;
        --muted: #6b7280;
        --accent: #0d9488;
        --danger: #dc2626;
        --line: #d1d5db;
      }
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
        margin: 2rem 2rem;
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
      @media (max-width: 920px) {
        .wrap { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <main class="wrap">
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
              <option value="inactive">inactive</option>
              <option value="retired">retired</option>
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
    </main>

    <script>
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
</html>`);
  });

  fastify.get("/admin/parishes", async function parishAdminPage(_request, reply) {
    return reply.type("text/html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Deanery and Parish Admin</title>
    <style>
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
      .top-tabs {
        display: flex;
        gap: 0.5rem;
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 12px;
        padding: 0.45rem;
      }
      .tab-link {
        padding: 0.5rem 0.8rem;
        border-radius: 10px;
        color: #78350f;
        text-decoration: none;
        font-weight: 700;
      }
      .tab-link.active {
        background: var(--accent-soft);
        color: #92400e;
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
      .hero a {
        color: #92400e;
        text-decoration: none;
        font-weight: 700;
      }
      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
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
        min-width: 520px;
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
      @media (max-width: 980px) {
        .grid {
          grid-template-columns: 1fr;
        }
        .inline-form.parish {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <main class="wrap">
      <nav class="top-tabs" aria-label="Admin navigation">
        <a class="tab-link" href="/admin">Priests</a>
        <a class="tab-link active" href="/admin/parishes">Deaneries and Parishes</a>
      </nav>

      <section class="hero">
        <h1>Deanery and Parish Management</h1>
        <p>Each parish belongs to one deanery via <strong>giao_hat</strong>. Manage both lists inline here. <a href="/admin">Open priest manager</a>.</p>
      </section>

      <section class="">
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
          tr.setAttribute("data-id", parish.id);
          const searchIndex = String(
            (parish.name || "") + " " +
            (parish.deaneryName || "") + " " +
            (parish.ten_khac || "") + " " +
            (parish.dia_chi || "")
          ).toLowerCase();
          tr.setAttribute("data-search", searchIndex);
          tr.innerHTML =
            "<td>" + String(index + 1) + "</td>" +
            "<td><input value='" + escapeHtml(parish.name) + "' data-field='name' /></td>" +
            "<td><input value='" + escapeHtml(parish.href || "") + "' data-field='href' /></td>" +
            "<td><input value='" + escapeHtml(parish.ten_khac || "") + "' data-field='ten_khac' /></td>" +
            "<td><input value='" + escapeHtml(parish.dia_chi || "") + "' data-field='dia_chi' /></td>" +
            "<td><select data-field='giao_hat'>" + deaneryOptionsHtml(parish.giao_hat) + "</select></td>" +
            "<td><div class='row-actions'>" +
            "<button type='button' class='btn-muted' data-action='save'>Save</button>" +
            "<button type='button' class='btn-danger' data-action='delete'>Delete</button>" +
            "</div></td>";
          parishRows.appendChild(tr);
        });

        applyParishFilter();
      }

      function applyParishFilter() {
        const query = parishSearch.value.trim().toLowerCase();
        const rows = Array.from(parishRows.querySelectorAll("tr[data-id]"));
        let visible = 0;

        rows.forEach((row) => {
          const haystack = String(row.getAttribute("data-search") || "");
          const matched = !query || haystack.includes(query);
          row.classList.toggle("parish-hidden", !matched);
          if (matched) {
            visible += 1;
          }
        });

        setParishStatus(
          "Showing " + visible + " matched parish(es) out of " + parishCache.length + "."
        );
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

      async function saveParishRow(row) {
        const id = row.getAttribute("data-id");
        const nameInput = row.querySelector("input[data-field='name']");
        const hrefInput = row.querySelector("input[data-field='href']");
        const tenKhacInput = row.querySelector("input[data-field='ten_khac']");
        const diaChiInput = row.querySelector("input[data-field='dia_chi']");
        const deanerySelect = row.querySelector("select[data-field='giao_hat']");
        const payload = {
          name: nameInput ? nameInput.value : "",
          href: hrefInput ? hrefInput.value : "",
          ten_khac: tenKhacInput ? tenKhacInput.value : "",
          dia_chi: diaChiInput ? diaChiInput.value : "",
          giao_hat: deanerySelect ? deanerySelect.value : "",
        };

        try {
          setParishStatus("Saving parish...");
          const response = await fetch("/api/parishes/" + id, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const body = await response.json();
            throw new Error(body.error || "Failed to save parish.");
          }

          await loadAll();
          setParishStatus("Parish saved.");
        } catch (error) {
          setParishStatus(error.message || "Failed to save parish.", true);
        }
      }

      async function deleteParishRow(row) {
        const id = row.getAttribute("data-id");
        if (!confirm("Delete this parish?")) {
          return;
        }

        try {
          setParishStatus("Deleting parish...");
          const response = await fetch("/api/parishes/" + id, { method: "DELETE" });

          if (!response.ok) {
            const body = await response.json();
            throw new Error(body.error || "Failed to delete parish.");
          }

          await loadAll();
          setParishStatus("Parish deleted.");
        } catch (error) {
          setParishStatus(error.message || "Failed to delete parish.", true);
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

        const row = button.closest("tr[data-id]");
        if (!row) {
          return;
        }

        const action = button.getAttribute("data-action");
        if (action === "save") {
          saveParishRow(row);
          return;
        }

        if (action === "delete") {
          deleteParishRow(row);
        }
      });

      parishSearch.addEventListener("input", applyParishFilter);
      deaneryCreateForm.addEventListener("submit", createDeanery);
      parishCreateForm.addEventListener("submit", createParish);

      loadAll();
    </script>
  </body>
</html>`);
  });
}

module.exports = adminRoutes;