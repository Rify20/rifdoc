const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const filePreview = document.getElementById('filePreview');
const toolButtons = document.querySelectorAll('.tool-btn');

function renderFile(file) {
  if (!file) {
    filePreview.innerHTML = '<p>Belum ada file dipilih.</p>';
    return;
  }

  const safeName = file.name.replace(/[<>]/g, '');
  const sizeKb = (file.size / 1024).toFixed(1);

  filePreview.innerHTML = `
    <strong>File dipilih:</strong>
    <p>Nama: ${safeName}</p>
    <p>Ukuran: ${sizeKb} KB</p>
    <p>Status: siap untuk proses tahap berikutnya.</p>
  `;
}

function handleFiles(files) {
  if (!files || files.length === 0) return;
  renderFile(files[0]);
}

dropzone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (event) => {
  handleFiles(event.target.files);
});

['dragenter', 'dragover'].forEach((eventName) => {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    event.stopPropagation();
    dropzone.classList.add('dragover');
  });
});

['dragleave', 'drop'].forEach((eventName) => {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    event.stopPropagation();
    dropzone.classList.remove('dragover');
  });
});

dropzone.addEventListener('drop', (event) => {
  const files = event.dataTransfer.files;
  handleFiles(files);
});

toolButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const title = button.parentElement.querySelector('h3')?.textContent || 'Tool';
    alert(`${title} akan menjadi fitur aktif pada tahap pengembangan berikutnya.`);
  });
});
