// File: scripts/app.js

document.addEventListener("DOMContentLoaded", () => {
  /* -----------------------------------
     1. Khai báo biến & tham chiếu DOM
  ----------------------------------- */
  const subCatSelect = document.getElementById("filter-subcategory");
  const taskTypeSelect = document.getElementById("filter-tasktype");
  const domainSelect = document.getElementById("filter-domain");
  const videoContainer = document.getElementById("video-container");
  const paginationContainer = document.getElementById("pagination");

  const itemsPerPage = 21;  // Số video/card mỗi trang (có thể thay đổi)
  let currentPage = 1;      // Trang hiện tại

  let dataset = [];         // Mảng chứa toàn bộ bản ghi JSON
  let uniqueSubCats = new Set();
  let uniqueTaskTypes = new Set();
  let uniqueDomains = new Set();  // Tập domain duy nhất

  /* -----------------------------------
     2. Hàm lấy YouTube Embed URL
  ----------------------------------- */
  function getYouTubeEmbedUrl(youtubeUrl) {
    try {
      const urlObj = new URL(youtubeUrl);
      const hostname = urlObj.hostname.toLowerCase();

      if (hostname.includes("youtube.com")) {
        const videoId = urlObj.searchParams.get("v");
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }
      if (hostname.includes("youtu.be")) {
        const pathname = urlObj.pathname; 
        const videoId = pathname.slice(1);
        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }
      return null;
    } catch (err) {
      console.error("Invalid YouTube URL:", youtubeUrl);
      return null;
    }
  }

  /* -----------------------------------
     3. Hàm splitOptions (hỗ trợ mảng & string)
  ----------------------------------- */
  function splitOptions(optionsField) {
    // Nếu record.options là array
    if (Array.isArray(optionsField)) {
      return optionsField
        .map(opt => (typeof opt === "string" ? opt.trim() : ""))
        .filter(opt => opt !== "");
    }
    // Nếu record.options là string, tách bằng regex
    if (typeof optionsField === "string") {
      const regex = /([A-Z]\.\s*[^A-Z]*)/g;
      const matches = optionsField.match(regex);
      if (matches) {
        return matches.map(opt => opt.trim());
      }
      // Fallback: tách theo dấu phẩy
      return optionsField
        .split(",")
        .map(opt => opt.trim())
        .filter(opt => opt !== "");
    }
    // Nếu không phải array hoặc string, trả về mảng rỗng
    return [];
  }

  /* -----------------------------------
     4. Hàm tạo phần tử media (iframe hoặc <video>)
  ----------------------------------- */
  function createMediaElement(record) {
    const url = record.url;
    const embedUrl = getYouTubeEmbedUrl(url);

    if (embedUrl) {
      const iframe = document.createElement("iframe");
      iframe.width = "100%";
      iframe.height = "180";
      iframe.src = embedUrl + "?rel=0";
      iframe.frameBorder = "0";
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      return iframe;
    } else {
      const videoEl = document.createElement("video");
      videoEl.src = url;
      videoEl.controls = true;
      videoEl.setAttribute("preload", "metadata");
      videoEl.style.width = "100%";
      return videoEl;
    }
  }

  /* -----------------------------------
     5. Hàm tạo một Video Card (media + metadata)
  ----------------------------------- */
  function createVideoCard(record) {
    const card = document.createElement("div");
    card.classList.add("video-card");

    // 5.1. Phần media: iframe hoặc video
    const mediaEl = createMediaElement(record);
    card.appendChild(mediaEl);

    // 5.2. Phần metadata
    const metaDiv = document.createElement("div");
    metaDiv.classList.add("video-metadata");

    // Sub-category
    if (record.sub_category) {
      const p = document.createElement("p");
      p.innerHTML = `<span class="meta-label">Sub-category:</span> ${record.sub_category}`;
      metaDiv.appendChild(p);
    }

    // Task Type
    if (record.task_type) {
      const p = document.createElement("p");
      p.innerHTML = `<span class="meta-label">Task Type:</span> ${record.task_type}`;
      metaDiv.appendChild(p);
    }

    // Domain
    if (record.domain) {
      const p = document.createElement("p");
      p.innerHTML = `<span class="meta-label">Domain:</span> ${record.domain}`;
      metaDiv.appendChild(p);
    }

    // Question
    if (record.question) {
      const p = document.createElement("p");
      p.innerHTML = `<span class="meta-label">Question:</span> ${record.question}`;
      metaDiv.appendChild(p);
    }

    // Options (array hoặc string)
    const opts = splitOptions(record.options);
    if (opts.length > 0) {
      const pLabel = document.createElement("p");
      pLabel.innerHTML = `<span class="meta-label">Options:</span>`;
      metaDiv.appendChild(pLabel);

      const ul = document.createElement("ul");
      ul.style.paddingLeft = "1.2rem";
      ul.style.marginTop = "-0.3rem";
      opts.forEach(opt => {
        const li = document.createElement("li");
        li.textContent = opt;
        li.style.fontSize = "0.9rem";
        li.style.marginBottom = "0.2rem";
        ul.appendChild(li);
      });
      metaDiv.appendChild(ul);
    }

    // Answer
    if (record.answer) {
      const p = document.createElement("p");
      p.innerHTML = `<span class="meta-label">Answer:</span> ${record.answer}`;
      metaDiv.appendChild(p);
    }

    card.appendChild(metaDiv);
    return card;
  }

  /* -----------------------------------
     6. Hàm khởi tạo dropdown filter
  ----------------------------------- */
  function initFilters() {
    // 6.1. Reset tất cả dropdown về “All”
    subCatSelect.innerHTML = '<option value="">-- All --</option>';
    taskTypeSelect.innerHTML = '<option value="">-- All --</option>';
    domainSelect.innerHTML = '<option value="">-- All --</option>';

    // 6.2. Đổ giá trị Sub-category
    Array.from(uniqueSubCats).sort().forEach(subcat => {
      const opt = document.createElement("option");
      opt.value = subcat;
      opt.textContent = subcat;
      subCatSelect.appendChild(opt);
    });

    // 6.3. Đổ giá trị Task Type
    Array.from(uniqueTaskTypes).sort().forEach(tt => {
      const opt = document.createElement("option");
      opt.value = tt;
      opt.textContent = tt;
      taskTypeSelect.appendChild(opt);
    });

    // 6.4. Đổ giá trị Domain
    Array.from(uniqueDomains).sort().forEach(dm => {
      const opt = document.createElement("option");
      opt.value = dm;
      opt.textContent = dm;
      domainSelect.appendChild(opt);
    });
  }

  /* -----------------------------------
     7. Hàm renderCards() với joint filtering
  ----------------------------------- */
  function renderCards() {
    videoContainer.innerHTML = "";

    // 7.1. Lọc dataset theo 3 dropdown: sub_category, task_type, domain
    const selSub = subCatSelect.value;
    const selTask = taskTypeSelect.value;
    const selDomain = domainSelect.value;

    const filtered = dataset.filter(rec => {
      const okSub = selSub === "" || rec.sub_category === selSub;
      const okTask = selTask === "" || rec.task_type === selTask;
      const okDomain = selDomain === "" || rec.domain === selDomain;
      // Phải thỏa cả ba để đưa vào filtered
      return okSub && okTask && okDomain;
    });

    // 7.2. Tính tổng items & totalPages
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // 7.3. Điều chỉnh currentPage nếu vượt giới hạn
    if (currentPage > totalPages && totalPages > 0) {
      currentPage = totalPages;
    }
    if (currentPage < 1) {
      currentPage = 1;
    }

    // 7.4. Tính slice cho page hiện tại
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = filtered.slice(startIndex, endIndex);

    // 7.5. Nếu không có phần tử, hiển thị thông báo
    if (pageItems.length === 0) {
      videoContainer.innerHTML = "<p>Cannot find videos by that filter</p>";
    } else {
      // Tạo & chèn từng video-card
      pageItems.forEach(rec => {
        const card = createVideoCard(rec);
        videoContainer.appendChild(card);
      });
    }

    // 7.6. Render pagination (ellipsis) dựa trên totalItems & totalPages
    renderPagination(totalItems, totalPages);
  }

  /* -----------------------------------
     8. Hàm renderPagination() với ellipsis
  ----------------------------------- */
  function renderPagination(totalItems, totalPages) {
    paginationContainer.innerHTML = "";

    // Nếu chỉ một trang hoặc không có record → không hiển thị pagination
    if (totalPages <= 1) return;

    // 8.1. Nút "‹" (Prev)
    const prevBtn = document.createElement("button");
    prevBtn.innerHTML = "‹";
    prevBtn.classList.add("arrow", "prev-arrow");
    prevBtn.disabled = (currentPage === 1);
    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderCards();
      }
    });
    paginationContainer.appendChild(prevBtn);

    // 8.2. Luôn hiện nút "1" (trang đầu)
    createPageButton(1);

    // 8.3. Nếu khoảng giữa "1" và nhóm xung quanh currentPage rộng -> tạo ellipsis
    if (currentPage - 3 > 1) {
      createEllipsis();
    }

    // 8.4. Hiển thị nhóm pages từ startGroup → endGroup
    const startGroup = Math.max(2, currentPage - 2);
    const endGroup = Math.min(totalPages - 1, currentPage + 2);
    for (let page = startGroup; page <= endGroup; page++) {
      createPageButton(page);
    }

    // 8.5. Nếu khoảng giữa endGroup và totalPages rộng -> tạo ellipsis
    if (currentPage + 3 < totalPages) {
      createEllipsis();
    }

    // 8.6. Luôn hiện nút last page (totalPages)
    if (totalPages > 1) {
      createPageButton(totalPages);
    }

    // 8.7. Nút "›" (Next)
    const nextBtn = document.createElement("button");
    nextBtn.innerHTML = "›";
    nextBtn.classList.add("arrow", "next-arrow");
    nextBtn.disabled = (currentPage === totalPages);
    nextBtn.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderCards();
      }
    });
    paginationContainer.appendChild(nextBtn);

    // ---- Hàm phụ trợ tạo nút số và ellipsis ----
    function createPageButton(page) {
      const btn = document.createElement("button");
      btn.textContent = page;
      if (page === currentPage) {
        btn.classList.add("active");
      }
      btn.addEventListener("click", () => {
        if (page !== currentPage) {
          currentPage = page;
          renderCards();
        }
      });
      paginationContainer.appendChild(btn);
    }

    function createEllipsis() {
      const span = document.createElement("span");
      span.textContent = "…";
      span.style.padding = "0 0.5rem";
      span.style.fontSize = "1.1rem";
      span.style.color = "#666";
      paginationContainer.appendChild(span);
    }
  }

  /* -----------------------------------
     9. Bắt sự kiện khi filter thay đổi
  ----------------------------------- */
  subCatSelect.addEventListener("change", () => {
    currentPage = 1;  // Reset về trang 1 khi filter thay đổi
    renderCards();
  });
  taskTypeSelect.addEventListener("change", () => {
    currentPage = 1;
    renderCards();
  });
  domainSelect.addEventListener("change", () => {
    currentPage = 1;
    renderCards();
  });

  /* -----------------------------------
     10. Fetch JSON & khởi tạo lần đầu
  ----------------------------------- */
  fetch("data/video_mme.json")
    .then(response => {
      if (!response.ok) throw new Error("Không tải được JSON");
      return response.json();
    })
    .then(records => {
      if (!Array.isArray(records)) {
        console.error("JSON trả về không phải mảng!", records);
        videoContainer.innerHTML = `<p style="color: red;">Dữ liệu không đúng định dạng.</p>`;
        return;
      }

      dataset = records;

      // 10.1. Thu uniqueSubCats, uniqueTaskTypes, uniqueDomains
      dataset.forEach(rec => {
        if (rec.sub_category) uniqueSubCats.add(rec.sub_category);
        if (rec.task_type) uniqueTaskTypes.add(rec.task_type);
        if (rec.domain) uniqueDomains.add(rec.domain);
      });

      // 10.2. Khởi tạo dropdown
      initFilters();

      // 10.3. Render lần đầu (trang 1)
      currentPage = 1;
      renderCards();
    })
    .catch(err => {
      console.error("Lỗi khi fetch JSON:", err);
      videoContainer.innerHTML = `<p style="color: red;">Không thể tải dữ liệu JSON.</p>`;
    });
});
