"use client";
import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';

export default function RifDoc() {
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
      alert("Gagal memproses file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', minHeight: '100vh', backgroundColor: '#ffffff' }}>
      <div style={{ background: '#000', color: '#fff', padding: '15px 50px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, letterSpacing: '-1px' }}>RIF<span style={{color: '#ff0000'}}>DOC</span></h2>
        <small>v1.0 Ready</small>
      </div>

      <div style={{ maxWidth: '600px', margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
        <h1 style={{ fontSize: '40px', marginBottom: '10px' }}>Merge PDF</h1>
        <p style={{ color: '#666', marginBottom: '40px' }}>Pilih beberapa file PDF untuk digabungkan menjadi satu.</p>

        <div style={{ border: '2px dashed #ccc', padding: '40px', borderRadius: '12px', cursor: 'pointer', position: 'relative' }}>
          <input type="file" multiple accept=".pdf" onChange={handleFile} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
          <p style={{ margin: 0, fontWeight: 'bold' }}>+ Tambah File PDF</p>
        </div>

        {files.length > 0 && (
          <div style={{ marginTop: '30px', textAlign: 'left', border: '1px solid #eee', padding: '20px', borderRadius: '8px' }}>
            <p style={{ fontWeight: 'bold' }}>File yang dipilih:</p>
            {files.map((f, i) => (
              <div key={i} style={{ padding: '5px 0', fontSize: '14px', borderBottom: '1px solid #f9f9f9', display: 'flex', justifyContent: 'space-between' }}>
                <span>{f.name}</span>
                <span onClick={() => setFiles(files.filter((_, idx) => idx !== i))} style={{color: 'red', cursor: 'pointer'}}>Hapus</span>
              </div>
            ))}
            <button 
              onClick={mergePdfs} 
              disabled={loading}
              style={{ width: '100%', marginTop: '20px', padding: '15px', backgroundColor: '#ff0000', color: '#fff', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {loading ? "PROSES..." : "GABUNGKAN SEKARANG"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
