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
}

module.exports = adminRoutes;