let files = [];
let currentTool = "merge";

const dropArea = document.getElementById("drop-area");
const fileInput = document.getElementById("fileInput");

// TOOL SWITCH
function setTool(tool) {
  currentTool = tool;
  document.getElementById("tool-title").innerText = tool.toUpperCase() + " PDF";
}

// DARK MODE
function toggleDark() {
  document.body.classList.toggle("dark");
}

// FILE INPUT
dropArea.onclick = () => fileInput.click();

fileInput.onchange = (e) => {
  files = [...e.target.files];
  preview(files[0]);
};

// DRAG
dropArea.ondragover = (e) => {
  e.preventDefault();
};

dropArea.ondrop = (e) => {
  e.preventDefault();
  files = [...e.dataTransfer.files];
  preview(files[0]);
};

// PREVIEW
async function preview(file) {
  const reader = new FileReader();

  reader.onload = async function () {
    const pdf = await pdfjsLib.getDocument(new Uint8Array(this.result)).promise;
    const page = await pdf.getPage(1);

    const canvas = document.getElementById("preview");
    const ctx = canvas.getContext("2d");

    const viewport = page.getViewport({ scale: 1 });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: ctx, viewport }).promise;
  };

  reader.readAsArrayBuffer(file);
}

// MAIN PROCESS
async function runTool() {
  if (!files.length) return alert("Upload file dulu!");

  switch (currentTool) {
    case "merge":
      mergePDF();
      break;
    case "split":
      splitPDF();
      break;
    case "rotate":
      rotatePDF();
      break;
    case "extract":
      extractPages();
      break;
  }
}

// MERGE
async function mergePDF() {
  const { PDFDocument } = PDFLib;
  const merged = await PDFDocument.create();

  for (let f of files) {
    const pdf = await PDFDocument.load(await f.arrayBuffer());
    const pages = await merged.copyPages(pdf, pdf.getPageIndices());
    pages.forEach(p => merged.addPage(p));
  }

  download(await merged.save(), "merged.pdf");
}

// SPLIT
async function splitPDF() {
  const { PDFDocument } = PDFLib;
  const pdf = await PDFDocument.load(await files[0].arrayBuffer());

  for (let i = 0; i < pdf.getPageCount(); i++) {
    const newPdf = await PDFDocument.create();
    const [page] = await newPdf.copyPages(pdf, [i]);
    newPdf.addPage(page);

    download(await newPdf.save(), `page-${i+1}.pdf`);
  }
}

// ROTATE
async function rotatePDF() {
  const { PDFDocument, degrees } = PDFLib;
  const pdf = await PDFDocument.load(await files[0].arrayBuffer());

  pdf.getPages().forEach(p => p.setRotation(degrees(90)));

  download(await pdf.save(), "rotated.pdf");
}

// EXTRACT
async function extractPages() {
  const { PDFDocument } = PDFLib;
  const pdf = await PDFDocument.load(await files[0].arrayBuffer());

  const newPdf = await PDFDocument.create();
  const pages = await newPdf.copyPages(pdf, [0,1]); // contoh ambil 2 halaman
  pages.forEach(p => newPdf.addPage(p));

  download(await newPdf.save(), "extract.pdf");
}

// DOWNLOAD
function download(bytes, name) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
}