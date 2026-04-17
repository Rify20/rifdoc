"use client";
import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';

export default function RifPDF() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFile = (e: any) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  const mergePdfs = async () => {
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
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `RifDoc_${Date.now()}.pdf`;
      link.click();
    } catch (err) {
      alert("Error pas gabungin PDF. Coba file lain.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', backgroundColor: '#f8fafc', padding: '20px' }}>
      {/* HEADER */}
      <div style={{ background: '#fff', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '40px' }}>
        <h1 style={{ color: '#e11d48', margin: 0, fontWeight: 900, fontSize: '24px' }}>RIF<span style={{ color: '#1e293b' }}>DOC</span></h1>
        <span style={{ fontSize: '12px', background: '#f1f5f9', padding: '5px 10px', borderRadius: '20px', fontWeight: 'bold' }}>NO LIMITS</span>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '32px', marginBottom: '10px', color: '#0f172a' }}>Merge PDF Gratis</h2>
        <p style={{ color: '#64748b', marginBottom: '30px' }}>Gabungkan banyak file PDF jadi satu dalam hitungan detik.</p>

        {/* DROPZONE */}
        <div style={{ border: '3px dashed #cbd5e1', padding: '50px', borderRadius: '20px', backgroundColor: '#fff', position: 'relative', transition: '0.3s' }}>
          <input 
            type="file" 
            multiple 
            accept=".pdf" 
            onChange={handleFile}
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }}
          />
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>📂</div>
          <p style={{ fontWeight: 'bold', color: '#334155' }}>Klik atau seret PDF ke sini</p>
        </div>

        {/* LIST FILE */}
        {files.length > 0 && (
          <div style={{ marginTop: '30px', background: '#fff', borderRadius: '15px', padding: '20px', textAlign: 'left', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            {files.map((f, i) => (
              <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: '14px', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                <span>📄 {f.name}</span>
                <span style={{ color: '#ef4444', cursor: 'pointer' }} onClick={() => setFiles(files.filter((_, idx) => idx !== i))}>Hapus</span>
              </div>
            ))}
            
            <button 
              onClick={mergePdfs}
              disabled={loading}
              style={{ width: '100%', marginTop: '20px', padding: '15px', backgroundColor: '#e11d48', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}
            >
              {loading ? "Sabar, lagi proses..." : `GABUNGKAN ${files.length} FILE`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
