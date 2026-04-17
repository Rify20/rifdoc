"use client";
import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Upload, FileText, Download, Loader2, Trash2 } from 'lucide-react';

export default function RifPDF() {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const mergeAndDownload = async () => {
    if (files.length === 0) return;
    setLoading(true);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `RifPDF_Merged_${Date.now()}.pdf`;
      link.click();
    } catch (error) {
      alert("Gagal memproses PDF. Pastikan file tidak diproteksi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <nav className="bg-white border-b p-4 flex justify-between items-center shadow-sm">
        <h1 className="text-2xl font-black text-red-600 tracking-tighter">RIF<span className="text-slate-800">PDF</span></h1>
        <p className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded">No Limits Edition</p>
      </nav>

      <main className="max-w-4xl mx-auto py-12 px-6 text-center">
        <h2 className="text-4xl font-bold text-slate-900 mb-4">Gabungkan PDF dengan Cepat</h2>
        <p className="text-slate-600 mb-8 text-lg">Proses 100% di browser kamu. File tidak pernah menyentuh server kami (Aman & Tanpa Limit).</p>

        {/* Upload Zone */}
        <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-12 mb-8 hover:border-red-400 transition-colors cursor-pointer relative">
          <input 
            type="file" 
            multiple 
            accept=".pdf" 
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <Upload className="mx-auto text-slate-400 mb-4" size={48} />
          <p className="text-slate-600 font-semibold">Klik atau seret file PDF ke sini</p>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-4 mb-8">
            {files.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <FileText className="text-red-500" size={20} />
                  <span className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{file.name}</span>
                </div>
                <button onClick={() => removeFile(idx)} className="text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <button 
              onClick={mergeAndDownload}
              disabled={loading}
              className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-200 disabled:bg-slate-400"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Download size={20} />}
              {loading ? "Memproses..." : `Gabungkan ${files.length} File`}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}