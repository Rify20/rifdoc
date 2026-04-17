"use client";
import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';

export default function RifDocFinal() {
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
      link.download = `RifDoc_Merged_${Date.now()}.pdf`;
      link.click();
    } catch (err) {
      alert("Gagal menggabungkan PDF. Pastikan file tidak rusak.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', backgroundColor: '#fdfdfd', color: '#333' }}>
      <nav style={{ background: '#fff', padding: '20px 50px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, color: '#e11d48', fontWeight: '900', letterSpacing: '-1px' }}>RIF<span style={{color: '#1e293b'}}>DOC</span></h1>
        <div style={{ fontSize: '12px', fontWeight: 'bold', background: '#ffe4e6', color: '#e11d48', padding: '5px 12px', borderRadius: '15px' }}>PRO EDITION</div>
      </nav>

      <div style={{ maxWidth: '800px', margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '42px', fontWeight: '800', marginBottom: '10px' }}>Gabungkan PDF Gratis</h2>
        <p style={{ color: '#666', fontSize: '18px', marginBottom: '40px' }}>Solusi cepat olah dokumen tanpa limit ukuran file.</p>

        <div style={{ border: '3px dashed #ddd', borderRadius: '24px', padding: '60px', backgroundColor: '#fff', cursor: 'pointer', position: 'relative' }}>
          <input type="file" multiple accept=".pdf" onChange={handleFile} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
          <div style={{ fontSize: '50px' }}>📄</div>
          <p style={{ fontWeight: '600', marginTop: '10px' }}>Pilih atau Tarik file PDF kamu ke sini</p>
        </div>

        {files.length > 0 && (
          <div style={{ marginTop: '30px', textAlign: 'left', background: '#fff', borderRadius: '16px', border: '1px solid #eee', padding: '20px' }}>
            <h4 style={{ margin: '0 0 15px 0' }}>File Terpilih ({files.length}):</h4>
            {files.map((f, i) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #fafafa', display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span>{f.name}</span>
                <span style={{ color: 'red', cursor: 'pointer' }} onClick={() => setFiles(files.filter((_, idx) => idx !== i))}>Hapus</span>
              </div>
            ))}
            <button 
              onClick={mergePdfs} 
              disabled={loading}
              style={{ width: '100%', marginTop: '25px', padding: '18px', backgroundColor: '#e11d48', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
            >
              {loading ? "Sedang Menggabungkan..." : "GABUNGKAN PDF SEKARANG"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}