// ===========================
// Board State
// ===========================
let currentBoardType = '';
let currentBoardEl = '';
let currentCountEl = '';
let currentFilter = 'all';
let selectedFile = null;
let currentViewDoc = null;

// ===========================
// Seed Data (pre-populated entries without PDF — user uploads PDF separately)
// ===========================
const SEED_DATA = {
  letter: [
    {
      id: 'seed-letter-2026q1',
      title: '나무늘보 투자조합 2026년 1분기 주주서한',
      date: '2026-03-29',
      summary: 'YTD -1.8% (S&P500 -7.14% 대비 초과), 웨스트 파마슈티컈 투자 배경, 이란-미국 충돌의 포트폴리오 영향 분석',
      category: '',
      fileName: null,
      fileSize: null,
      fileData: null,
      isSeed: true,
      uploadedAt: '2026-03-30T00:00:00.000Z',
    }
  ],
  report: [
    {
      id: 'seed-report-bhp-2025',
      title: 'BHP, 데(大)이터 센터 시대의 떠오르는 별',
      date: '2025-07-18',
      summary: 'AI 데이터센터 구리 수요 분석 → BHP 수혜주. PER 11배 저평가, FCF Yield 8.28%, 2025 Q1 구리 생산 1위',
      category: '기업분석',
      fileName: null,
      fileSize: null,
      fileData: null,
      isSeed: true,
      uploadedAt: '2025-07-18T00:00:00.000Z',
    }
  ]
};

// ===========================
// Init
// ===========================
function initBoard(type, boardElId, countElId) {
  currentBoardType = type;
  currentBoardEl = boardElId;
  currentCountEl = countElId;

  // Initialize seed data once
  initializeSeedData(type);

  const dateInput = document.getElementById('uploadDate');
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  renderBoard();
}

function initializeSeedData(type) {
  const seedKey = getStorageKey(type) + '_seeded';
  if (localStorage.getItem(seedKey)) return;

  const existing = getDocs(type);
  const seeds = SEED_DATA[type] || [];
  const merged = [...seeds, ...existing];
  saveDocs(type, merged);
  localStorage.setItem(seedKey, '1');
}

// ===========================
// Storage
// ===========================
function getStorageKey(type) {
  return `portfolio_${type}_docs`;
}

function getDocs(type) {
  try {
    const raw = localStorage.getItem(getStorageKey(type));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDocs(type, docs) {
  try {
    localStorage.setItem(getStorageKey(type), JSON.stringify(docs));
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      showToast('저장 공간이 부족합니다. 일부 파일을 삭제해주세요.', 'error');
    }
  }
}

// ===========================
// Render Board
// ===========================
function renderBoard(filter) {
  if (filter !== undefined) currentFilter = filter;

  const boardEl = document.getElementById(currentBoardEl);
  const countEl = document.getElementById(currentCountEl);
  if (!boardEl) return;

  let docs = getDocs(currentBoardType);
  docs.sort((a, b) => new Date(b.date) - new Date(a.date));

  let filtered = docs;
  if (currentFilter !== 'all') {
    filtered = docs.filter(d => d.date && d.date.startsWith(currentFilter));
  }

  if (countEl) countEl.textContent = filtered.length;

  if (filtered.length === 0) {
    const emptyLabel = currentBoardType === 'letter' ? '주주서한' : '레포트';
    boardEl.innerHTML = `
      <div class="board-empty">
        <div class="board-empty-icon">${currentBoardType === 'letter' ? '✉️' : '📋'}</div>
        <div class="board-empty-title">아직 등록된 ${emptyLabel}이 없습니다</div>
        <div class="board-empty-desc">우측 상단의 업로드 버튼을 덬러 PDF 파일을 추가하세요</div>
      </div>`;
    return;
  }

  boardEl.innerHTML = filtered.map(doc => buildDocItem(doc)).join('');
}

function buildDocItem(doc) {
  const isLetter = currentBoardType === 'letter';
  const icon = isLetter ? '✉️' : '📊';
  const dateStr = formatDateKo(doc.date);
  const hasPDF = !!doc.fileData;

  const categoryBadge = doc.category
    ? `<span style="background: rgba(61,153,112,0.1); color: var(--blue-light); padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">${escapeHtml(doc.category)}</span>`
    : '';

  const pdfBadge = !hasPDF
    ? `<span style="background: rgba(251,191,36,0.1); color: var(--yellow); padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; border: 1px solid rgba(251,191,36,0.2);">PDF 업로드 필요</span>`
    : '';

  return `
    <div class="board-item" onclick="${hasPDF ? `viewDocument('${doc.id}')` : `promptUploadPDF('${doc.id}')`}">
      <div class="board-item-left">
        <div class="board-item-icon">${icon}</div>
        <div class="board-item-info">
          <div class="board-item-title">${escapeHtml(doc.title)}</div>
          <div class="board-item-meta">
            <span>${dateStr}</span>
            ${doc.fileName ? `<span>·</span><span>${escapeHtml(doc.fileName)}</span>` : ''}
            ${doc.fileSize ? `<span>·</span><span>${formatFileSize(doc.fileSize)}</span>` : ''}
            ${categoryBadge ? `<span>·</span>${categoryBadge}` : ''}
            ${pdfBadge ? `<span>·</span>${pdfBadge}` : ''}
          </div>
          ${doc.summary ? `<div style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">${escapeHtml(doc.summary)}</div>` : ''}
        </div>
      </div>
      <div class="board-item-actions" onclick="event.stopPropagation()">
        ${hasPDF
          ? `<button class="btn btn-secondary btn-sm" onclick="viewDocument('${doc.id}')">
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
               열기
             </button>`
          : `<button class="btn btn-secondary btn-sm" onclick="promptUploadPDF('${doc.id}')">
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
               PDF 첨부
             </button>`
        }
        <button class="btn btn-ghost btn-sm btn-icon" onclick="deleteDocument('${doc.id}')" title="삭제">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
      </div>
    </div>`;
}

// ===========================
// Attach PDF to existing seed entry
// ===========================
let attachTargetId = null;

function promptUploadPDF(id) {
  attachTargetId = id;
  const docs = getDocs(currentBoardType);
  const doc = docs.find(d => d.id === id);
  if (!doc) return;

  openUploadModal();

  // Pre-fill title/date from seed
  const titleInput = document.getElementById('uploadTitle');
  const dateInput = document.getElementById('uploadDate');
  if (titleInput) titleInput.value = doc.title;
  if (dateInput) dateInput.value = doc.date;
  if (doc.category) {
    const catInput = document.getElementById('uploadCategory');
    if (catInput) catInput.value = doc.category;
  }
}

// ===========================
// Filter
// ===========================
function filterDocs(year, btn) {
  currentFilter = year;
  document.querySelectorAll('.chart-toggle button').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderBoard();
}

// ===========================
// Upload Modal
// ===========================
function openUploadModal() {
  attachTargetId = null;
  selectedFile = null;
  if (!document.getElementById('uploadTitle').value) document.getElementById('uploadTitle').value = '';
  const dateInput = document.getElementById('uploadDate');
  if (dateInput && !dateInput.value) dateInput.value = new Date().toISOString().split('T')[0];
  const summaryInput = document.getElementById('uploadSummary');
  if (summaryInput) summaryInput.value = '';
  const fileInput = document.getElementById('fileInput');
  if (fileInput) fileInput.value = '';
  const fileInfo = document.getElementById('fileSelectedInfo');
  if (fileInfo) fileInfo.classList.add('hidden');

  document.getElementById('uploadModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeUploadModal() {
  document.getElementById('uploadModal').classList.remove('open');
  document.body.style.overflow = '';
  selectedFile = null;
  attachTargetId = null;
  // Reset form
  const titleInput = document.getElementById('uploadTitle');
  if (titleInput) titleInput.value = '';
  const fileInput = document.getElementById('fileInput');
  if (fileInput) fileInput.value = '';
  const fileInfo = document.getElementById('fileSelectedInfo');
  if (fileInfo) fileInfo.classList.add('hidden');
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) closeUploadModal();
}

// ===========================
// Drag & Drop
// ===========================
function handleDragOver(event) {
  event.preventDefault();
  document.getElementById('dropzone').classList.add('dragover');
}

function handleDragLeave(event) {
  document.getElementById('dropzone').classList.remove('dragover');
}

function handleDrop(event, type) {
  event.preventDefault();
  document.getElementById('dropzone').classList.remove('dragover');
  const files = event.dataTransfer.files;
  if (files.length > 0) processFile(files[0], type);
}

function handleFileSelect(event, type) {
  const files = event.target.files;
  if (files.length > 0) processFile(files[0], type);
}

function processFile(file, type) {
  if (file.type !== 'application/pdf') {
    showToast('PDF 파일만 업로드할 수 있습니다.', 'error');
    return;
  }
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    showToast('파일 크기는 50MB를 초과할 수 없습니다.', 'error');
    return;
  }
  selectedFile = file;

  const nameEl = document.getElementById('fileSelectedName');
  const infoEl = document.getElementById('fileSelectedInfo');
  if (nameEl) nameEl.textContent = `${file.name} (${formatFileSize(file.size)})`;
  if (infoEl) infoEl.classList.remove('hidden');

  const titleInput = document.getElementById('uploadTitle');
  if (titleInput && !titleInput.value) {
    titleInput.value = file.name.replace('.pdf', '').replace(/_/g, ' ').replace(/-/g, ' ');
  }
}

// ===========================
// Submit Upload
// ===========================
function submitUpload(type) {
  const title = document.getElementById('uploadTitle').value.trim();
  const date = document.getElementById('uploadDate').value;
  const summary = document.getElementById('uploadSummary')?.value.trim() || '';
  const category = document.getElementById('uploadCategory')?.value || '';

  if (!title) { showToast('제목을 입력해주세요.', 'error'); return; }
  if (!date)  { showToast('날짜를 선택해주세요.', 'error'); return; }
  if (!selectedFile) { showToast('PDF 파일을 선택해주세요.', 'error'); return; }

  const reader = new FileReader();
  reader.onload = function(e) {
    const docs = getDocs(type);

    if (attachTargetId) {
      // Attach PDF to existing seed entry
      const idx = docs.findIndex(d => d.id === attachTargetId);
      if (idx !== -1) {
        docs[idx] = {
          ...docs[idx],
          title,
          date,
          summary: summary || docs[idx].summary,
          category: category || docs[idx].category,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          fileData: e.target.result,
          isSeed: false,
          uploadedAt: new Date().toISOString(),
        };
        saveDocs(type, docs);
        closeUploadModal();
        renderBoard();
        showToast('PDF가 성공적으로 첨부되었습니다.');
        return;
      }
    }

    // New document
    const doc = {
      id: generateId(),
      title, date, summary, category,
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      fileData: e.target.result,
      isSeed: false,
      uploadedAt: new Date().toISOString(),
    };
    docs.push(doc);
    saveDocs(type, docs);
    closeUploadModal();
    renderBoard();
    showToast('파일이 성공적으로 업로드되었습니다.');
  };

  reader.onerror = () => showToast('파일 읽기에 실패했습니다.', 'error');
  reader.readAsDataURL(selectedFile);
}

// ===========================
// View Document
// ===========================
function viewDocument(id) {
  const docs = getDocs(currentBoardType);
  const doc = docs.find(d => d.id === id);
  if (!doc || !doc.fileData) {
    showToast('PDF를 먼저 업로드해주세요.', 'error');
    return;
  }

  currentViewDoc = doc;
  document.getElementById('viewerTitle').textContent = doc.title;
  document.getElementById('pdfViewer').src = doc.fileData;
  document.getElementById('viewerModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeViewerModal() {
  document.getElementById('viewerModal').classList.remove('open');
  document.body.style.overflow = '';
  document.getElementById('pdfViewer').src = '';
  currentViewDoc = null;
}

function handleViewerOverlayClick(event) {
  if (event.target === event.currentTarget) closeViewerModal();
}

function downloadCurrentPDF() {
  if (!currentViewDoc) return;
  const a = document.createElement('a');
  a.href = currentViewDoc.fileData;
  a.download = currentViewDoc.fileName || 'document.pdf';
  a.click();
}

// ===========================
// Delete Document
// ===========================
function deleteDocument(id) {
  if (!confirm('이 문서를 삭제하시겠습니까?')) return;

  const docs = getDocs(currentBoardType);
  const filtered = docs.filter(d => d.id !== id);
  saveDocs(currentBoardType, filtered);

  renderBoard();
  showToast('문서가 삭제되었습니다.');
}

// ===========================
// Keyboard Shortcuts
// ===========================
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const viewer = document.getElementById('viewerModal');
    const upload = document.getElementById('uploadModal');
    if (viewer?.classList.contains('open')) closeViewerModal();
    else if (upload?.classList.contains('open')) closeUploadModal();
  }
});

// ===========================
// Utility
// ===========================
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
