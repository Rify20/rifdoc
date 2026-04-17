const API_BASE = 'https://your-worker-subdomain.workers.dev';

const { PDFDocument, degrees } = PDFLib;

const state = {
  activeTool: 'merge',
  files: [],
};

const toolConfig = {
  merge: {
    title: 'Merge PDF',
    tip: 'Pilih beberapa file PDF lalu gabungkan.',
    accept: '.pdf,application/pdf',
    multiple: true,
    dropzoneTitle: 'Pilih beberapa file PDF',
    dropzoneDesc: 'Urutkan file dari atas ke bawah sesuai hasil gabungan yang kamu inginkan.',
    panel: () => `
      <div class="field">
        <label for="mergeName">Nama file hasil</label>
        <input id="mergeName" type="text" value="rifkdoc-merged.pdf" maxlength="120" />
        <span class="field__help">Contoh: laporan-gabungan.pdf</span>
      </div>
    `,
    run: runMerge,
  },
  split: {
    title: 'Split PDF',
    tip: 'Pisahkan satu PDF berdasarkan range halaman.',
    accept: '.pdf,application/pdf',
    multiple: false,
    dropzoneTitle: 'Pilih satu file PDF',
    dropzoneDesc: 'Contoh range: 1-3, 5, 7-9',
    panel: () => `
      <div class="field">
        <label for="splitRanges">Range halaman</label>
        <input id="splitRanges" type="text" placeholder="1-3,5,7-9" />
        <span class="field__help">Pisah ke satu file baru berisi hanya halaman yang ditulis di sini.</span>
      </div>
      <div class="field">
        <label for="splitName">Nama file hasil</label>
        <input id="splitName" type="text" value="rifkdoc-split.pdf" maxlength="120" />
      </div>
    `,
    run: runSplit,
  },
  extract: {
    title: 'Extract Pages',
    tip: 'Ambil halaman tertentu dari satu PDF.',
    accept: '.pdf,application/pdf',
    multiple: false,
    dropzoneTitle: 'Pilih satu file PDF',
    dropzoneDesc: 'Contoh halaman: 2,4,6',
    panel: () => `
      <div class="field">
        <label for="extractPages">Halaman yang diambil</label>
        <input id="extractPages" type="text" placeholder="2,4,6" />
        <span class="field__help">Gunakan nomor halaman dipisahkan koma atau range.</span>
      </div>
      <div class="field">
        <label for="extractName">Nama file hasil</label>
        <input id="extractName" type="text" value="rifkdoc-extract.pdf" maxlength="120" />
      </div>
    `,
    run: runExtract,
  },
  rotate: {
    title: 'Rotate PDF',
    tip: 'Putar semua halaman PDF secara seragam.',
    accept: '.pdf,application/pdf',
    multiple: false,
    dropzoneTitle: 'Pilih satu file PDF',
    dropzoneDesc: 'Pilih sudut rotasi, lalu download hasilnya.',
    panel: () => `
      <div class="form-row">
        <div class="field">
          <label for="rotateAngle">Sudut rotasi</label>
          <select id="rotateAngle">
            <option value="90">90°</option>
            <option value="180">180°</option>
            <option value="270">270°</option>
          </select>
        </div>
        <div class="field">
          <label for="rotateName">Nama file hasil</label>
          <input id="rotateName" type="text" value="rifkdoc-rotated.pdf" maxlength="120" />
        </div>
      </div>
    `,
    run: runRotate,
  },
  jpg: {
    title: 'JPG to PDF',
    tip: 'Ubah banyak gambar menjadi satu PDF yang rapi.',
    accept: 'image/jpeg,image/png,.jpg,.jpeg,.png',
    multiple: true,
    dropzoneTitle: 'Pilih gambar JPG atau PNG',
    dropzoneDesc: 'Urutan file akan menjadi urutan halaman PDF.',
    panel: () => `
      <div class="form-row">
        <div class="field">
          <label for="jpgPageSize">Ukuran halaman</label>
          <select id="jpgPageSize">
            <option value="a4-portrait">A4 Portrait</option>
            <option value="a4-landscape">A4 Landscape</option>
            <option value="fit">Fit to image</option>
          </select>
        </div>
        <div class="field">
          <label for="jpgName">Nama file hasil</label>
          <input id="jpgName" type="text" value="rifkdoc-images.pdf" maxlength="120" />
        </div>
      </div>
    `,
    run: runJpgToPdf,
  },
};

const elements = {
  fileInput: document.getElementById('fileInput'),
  fileList: document.getElementById('fileList'),
  dropzone: document.getElementById('dropzone'),
  dropzoneTitle: document.getElementById('dropzoneTitle'),
  dropzoneDesc: document.getElementById('dropzoneDesc'),
  toolPanel: document.getElementById('toolPanel'),
  workspaceTitle: document.getElementById('workspaceTitle'),
  workspaceTip: document.getElementById('workspaceTip'),
  runBtn: document.getElementById('runBtn'),
  clearBtn: document.getElementById('clearBtn'),
  resultText: document.getElementById('resultText'),
  apiStatus: document.getElementById('apiStatus'),
};

function setResult(message, type = '') {
  elements.resultText.textContent = message;
  elements.resultText.className = 'result-text';
  if (type) elements.resultText.classList.add(type === 'error' ? 'is-error' : 'is-success');
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function sanitizeFilename(name, fallback = 'rifkdoc-output.pdf') {
  const clean = String(name || '').trim().replace(/[\\/:*?"<>|]+/g, '-');
  return clean || fallback;
}

function getPanelField(id) {
  return document.getElementById(id);
}

function renderTool() {
  const config = toolConfig[state.activeTool];
  elements.workspaceTitle.textContent = config.title;
  elements.workspaceTip.textContent = config.tip;
  elements.dropzoneTitle.textContent = config.dropzoneTitle;
  elements.dropzoneDesc.textContent = config.dropzoneDesc;
  elements.fileInput.accept = config.accept;
  elements.fileInput.multiple = config.multiple;
  elements.toolPanel.innerHTML = config.panel();
  setResult('');
}

function renderFiles() {
  if (!state.files.length) {
    elements.fileList.innerHTML = `
      <div class="empty-state">
        <strong>Belum ada file</strong>
        <p>Tambahkan file untuk mulai memproses dokumen.</p>
      </div>
    `;
    return;
  }

  elements.fileList.innerHTML = state.files.map((file, index) => `
    <div class="file-item">
      <div class="file-item__meta">
        <strong>${escapeHtml(file.name)}</strong>
        <span>${formatBytes(file.size)} • ${index + 1}</span>
      </div>
      <button class="button button--ghost button--sm" data-remove-index="${index}">Hapus</button>
    </div>
  `).join('');
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function setTool(tool) {
  state.activeTool = tool;
  state.files = [];
  document.querySelectorAll('.tool-card').forEach((button) => {
    const active = button.dataset.tool === tool;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
  });
  renderTool();
  renderFiles();
}

function addFiles(fileList) {
  const config = toolConfig[state.activeTool];
  const incoming = Array.from(fileList || []);
  if (!incoming.length) return;

  if (!config.multiple) {
    state.files = [incoming[0]];
  } else {
    state.files = [...state.files, ...incoming];
  }

  renderFiles();
  setResult(`${state.files.length} file siap diproses.`, 'success');
}

function clearAll() {
  state.files = [];
  elements.fileInput.value = '';
  renderFiles();
  setResult('Workspace sudah direset.');
}

function downloadBytes(bytes, filename) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

async function fileToArrayBuffer(file) {
  return await file.arrayBuffer();
}

function parsePageExpression(input, maxPages) {
  if (!input || !input.trim()) throw new Error('Masukkan halaman atau range terlebih dahulu.');
  const pages = new Set();
  const chunks = input.split(',').map((chunk) => chunk.trim()).filter(Boolean);

  for (const chunk of chunks) {
    if (chunk.includes('-')) {
      const [startRaw, endRaw] = chunk.split('-').map((part) => Number(part.trim()));
      if (!Number.isInteger(startRaw) || !Number.isInteger(endRaw) || startRaw <= 0 || endRaw <= 0) {
        throw new Error(`Range tidak valid: ${chunk}`);
      }
      const start = Math.min(startRaw, endRaw);
      const end = Math.max(startRaw, endRaw);
      for (let page = start; page <= end; page += 1) {
        if (page > maxPages) throw new Error(`Halaman ${page} melebihi total halaman PDF (${maxPages}).`);
        pages.add(page);
      }
    } else {
      const page = Number(chunk);
      if (!Number.isInteger(page) || page <= 0) throw new Error(`Nomor halaman tidak valid: ${chunk}`);
      if (page > maxPages) throw new Error(`Halaman ${page} melebihi total halaman PDF (${maxPages}).`);
      pages.add(page);
    }
  }

  return [...pages].sort((a, b) => a - b).map((page) => page - 1);
}

async function runMerge() {
  if (state.files.length < 2) throw new Error('Merge PDF butuh minimal 2 file PDF.');
  const output = await PDFDocument.create();

  for (const file of state.files) {
    const source = await PDFDocument.load(await fileToArrayBuffer(file));
    const pageIndices = source.getPageIndices();
    const copiedPages = await output.copyPages(source, pageIndices);
    copiedPages.forEach((page) => output.addPage(page));
  }

  const bytes = await output.save();
  const filename = sanitizeFilename(getPanelField('mergeName')?.value, 'rifkdoc-merged.pdf');
  downloadBytes(bytes, filename);
  setResult('Merge PDF berhasil. File hasil sudah didownload.', 'success');
}

async function runSplit() {
  if (state.files.length !== 1) throw new Error('Split PDF hanya menerima 1 file PDF.');
  const source = await PDFDocument.load(await fileToArrayBuffer(state.files[0]));
  const indices = parsePageExpression(getPanelField('splitRanges')?.value || '', source.getPageCount());
  const output = await PDFDocument.create();
  const copiedPages = await output.copyPages(source, indices);
  copiedPages.forEach((page) => output.addPage(page));
  const bytes = await output.save();
  const filename = sanitizeFilename(getPanelField('splitName')?.value, 'rifkdoc-split.pdf');
  downloadBytes(bytes, filename);
  setResult('Split PDF berhasil. File hasil sudah didownload.', 'success');
}

async function runExtract() {
  if (state.files.length !== 1) throw new Error('Extract Pages hanya menerima 1 file PDF.');
  const source = await PDFDocument.load(await fileToArrayBuffer(state.files[0]));
  const indices = parsePageExpression(getPanelField('extractPages')?.value || '', source.getPageCount());
  const output = await PDFDocument.create();
  const copiedPages = await output.copyPages(source, indices);
  copiedPages.forEach((page) => output.addPage(page));
  const bytes = await output.save();
  const filename = sanitizeFilename(getPanelField('extractName')?.value, 'rifkdoc-extract.pdf');
  downloadBytes(bytes, filename);
  setResult('Extract Pages berhasil. File hasil sudah didownload.', 'success');
}

async function runRotate() {
  if (state.files.length !== 1) throw new Error('Rotate PDF hanya menerima 1 file PDF.');
  const angle = Number(getPanelField('rotateAngle')?.value || 90);
  const source = await PDFDocument.load(await fileToArrayBuffer(state.files[0]));
  source.getPages().forEach((page) => page.setRotation(degrees(angle)));
  const bytes = await source.save();
  const filename = sanitizeFilename(getPanelField('rotateName')?.value, 'rifkdoc-rotated.pdf');
  downloadBytes(bytes, filename);
  setResult('Rotate PDF berhasil. File hasil sudah didownload.', 'success');
}

async function embedImage(pdfDoc, imageFile) {
  const fileType = imageFile.type.toLowerCase();
  const imageBytes = await fileToArrayBuffer(imageFile);
  if (fileType.includes('png')) return await pdfDoc.embedPng(imageBytes);
  return await pdfDoc.embedJpg(imageBytes);
}

function getPageSize(mode, imageDims) {
  const A4_PORTRAIT = [595.28, 841.89];
  const A4_LANDSCAPE = [841.89, 595.28];

  if (mode === 'fit') return [imageDims.width, imageDims.height];
  if (mode === 'a4-landscape') return A4_LANDSCAPE;
  return A4_PORTRAIT;
}

async function runJpgToPdf() {
  if (!state.files.length) throw new Error('JPG to PDF membutuhkan minimal 1 gambar.');
  const pdfDoc = await PDFDocument.create();
  const mode = getPanelField('jpgPageSize')?.value || 'a4-portrait';

  for (const file of state.files) {
    const embedded = await embedImage(pdfDoc, file);
    const dims = embedded.scale(1);
    const [pageWidth, pageHeight] = getPageSize(mode, dims);
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    let targetWidth = pageWidth - 40;
    let targetHeight = (dims.height / dims.width) * targetWidth;

    if (targetHeight > pageHeight - 40) {
      targetHeight = pageHeight - 40;
      targetWidth = (dims.width / dims.height) * targetHeight;
    }

    const x = (pageWidth - targetWidth) / 2;
    const y = (pageHeight - targetHeight) / 2;

    page.drawImage(embedded, {
      x,
      y,
      width: targetWidth,
      height: targetHeight,
    });
  }

  const bytes = await pdfDoc.save();
  const filename = sanitizeFilename(getPanelField('jpgName')?.value, 'rifkdoc-images.pdf');
  downloadBytes(bytes, filename);
  setResult('JPG to PDF berhasil. File hasil sudah didownload.', 'success');
}

async function runActiveTool() {
  try {
    setResult('Sedang memproses file...');
    await toolConfig[state.activeTool].run();
  } catch (error) {
    setResult(error?.message || 'Terjadi kesalahan saat memproses file.', 'error');
  }
}

async function checkApiStatus() {
  try {
    const response = await fetch(`${API_BASE}/health`, { method: 'GET' });
    if (!response.ok) throw new Error('Health check gagal');
    const data = await response.json();
    elements.apiStatus.textContent = data.status === 'ok' ? 'online' : 'unknown';
    elements.apiStatus.classList.add('is-online');
  } catch {
    elements.apiStatus.textContent = 'set API URL';
    elements.apiStatus.classList.add('is-offline');
  }
}

function bindEvents() {
  document.querySelectorAll('.tool-card').forEach((button) => {
    button.addEventListener('click', () => setTool(button.dataset.tool));
  });

  document.querySelectorAll('[data-target-tool]').forEach((button) => {
    button.addEventListener('click', () => {
      const targetTool = button.dataset.targetTool;
      if (targetTool) setTool(targetTool);
      document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  document.getElementById('scrollToolsBtn')?.addEventListener('click', () => {
    document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  elements.dropzone.addEventListener('click', () => elements.fileInput.click());
  elements.dropzone.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      elements.fileInput.click();
    }
  });

  elements.fileInput.addEventListener('change', (event) => addFiles(event.target.files));

  ['dragenter', 'dragover'].forEach((eventName) => {
    elements.dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      elements.dropzone.classList.add('is-dragover');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    elements.dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      event.stopPropagation();
      elements.dropzone.classList.remove('is-dragover');
    });
  });

  elements.dropzone.addEventListener('drop', (event) => addFiles(event.dataTransfer?.files));

  elements.fileList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove-index]');
    if (!button) return;
    const index = Number(button.dataset.removeIndex);
    if (!Number.isInteger(index)) return;
    state.files.splice(index, 1);
    renderFiles();
    setResult('File dihapus dari antrian.');
  });

  elements.clearBtn.addEventListener('click', clearAll);
  elements.runBtn.addEventListener('click', runActiveTool);
}

function init() {
  bindEvents();
  renderTool();
  renderFiles();
  checkApiStatus();
}

init();
