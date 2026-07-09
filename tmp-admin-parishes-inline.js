
      
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
          .replace(/"/g, "&quot;")
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
        return !value || /^(\d{1,2}\/\d{1,2}\/\d{4}|\d{4})$/.test(String(value).trim());
      }

      function isValidDayMonth(value) {
        return !value || /^\d{1,2}\/\d{1,2}$/.test(String(value).trim());
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
    
