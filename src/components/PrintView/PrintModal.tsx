import React, { useState } from 'react';
import { SpjDocument, DesaProfile } from '../../types';
import { SuratPesananDoc } from './SuratPesananDoc';
import { FakturDoc } from './FakturDoc';
import { BeritaAcaraDoc } from './BeritaAcaraDoc';
import { DaftarHadirDoc } from './DaftarHadirDoc';
import { downloadSpjAsPdf } from '../../utils/pdfDownloader';
import {
  Printer,
  X,
  Download,
  FileText,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface PrintModalProps {
  spj: SpjDocument;
  desa: DesaProfile;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'all' | 'pesanan' | 'faktur' | 'bast' | 'daftar_hadir';

export const PrintModal: React.FC<PrintModalProps> = ({ spj, desa, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [showIframeTip, setShowIframeTip] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfStatusText, setPdfStatusText] = useState('');
  const isMakanan = spj.kategoriBelanja === 'makanan_minuman';

  if (!isOpen) return null;

  const getCleanPrintHtml = () => {
    const printArea = document.getElementById('printable-spj-document-area');
    if (!printArea) return '';

    // Extract all styles and links from the current app
    let activeStyles = '';
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach((el) => {
      activeStyles += el.outerHTML + '\n';
    });

    try {
      let sheetRules = '';
      Array.from(document.styleSheets).forEach((sheet) => {
        try {
          Array.from(sheet.cssRules).forEach((rule) => {
            sheetRules += rule.cssText + '\n';
          });
        } catch {
          // ignore CORS restricted stylesheets if any
        }
      });
      if (sheetRules) {
        activeStyles += `<style>\n${sheetRules}\n</style>\n`;
      }
    } catch {
      // ignore
    }

    const rawPageNodes = Array.from(printArea.querySelectorAll<HTMLElement>('.spj-print-page'));
    const pageNodes = rawPageNodes.filter((p) => {
      const text = p.innerText?.trim() || '';
      return text.length > 0 && p.offsetHeight > 20;
    });

    let pagesHtml = '';

    if (pageNodes.length > 0) {
      pageNodes.forEach((p, idx) => {
        const docCard = p.classList.contains('bg-white')
          ? p
          : p.querySelector<HTMLElement>('.bg-white') || p;
        const isLast = idx === pageNodes.length - 1;
        pagesHtml += `
          <div class="print-page-wrapper ${!isLast ? 'page-break' : ''}">
            ${docCard.outerHTML}
          </div>
        `;
      });
    } else {
      const docCard = printArea.querySelector<HTMLElement>('.bg-white') || printArea;
      pagesHtml = `<div class="print-page-wrapper">${docCard.outerHTML}</div>`;
    }

    return `<!DOCTYPE html>
<html lang="id" style="color-scheme: light !important; background-color: #ffffff !important;">
<head>
  <meta charset="UTF-8">
  <title>SPJ - ${spj.namaKegiatan} - Desa ${desa.namaDesa}</title>
  ${activeStyles}
  <style>
    @page {
      size: 8.5in 13in;
      margin: 20mm 12mm 10mm 12mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      font-family: Arial, Helvetica, sans-serif !important;
    }
    html {
      color-scheme: light !important;
      background: #ffffff !important;
      background-color: #ffffff !important;
    }
    body {
      margin: 0 !important;
      padding: 0 !important;
      color-scheme: light !important;
      background: #ffffff !important;
      background-color: #ffffff !important;
      color: #000000 !important;
      font-family: Arial, Helvetica, sans-serif !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .screen-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: #ffffff;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .print-btn {
      background: #059669;
      color: #ffffff;
      border: none;
      padding: 10px 24px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 14px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: background 0.2s;
    }
    .print-btn:hover {
      background: #047857;
    }
    .print-page-wrapper {
      padding: 24px 0;
      background-color: #ffffff !important;
    }
    .print-page-wrapper > div {
      margin: 0 auto !important;
      background-color: #ffffff !important;
      box-shadow: 0 4px 14px rgba(0,0,0,0.08) !important;
      border-radius: 2px;
    }
    @media print {
      html, body {
        color-scheme: light !important;
        background: #ffffff !important;
        background-color: #ffffff !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .no-print, .screen-toolbar {
        display: none !important;
      }
      .print-page-wrapper {
        padding: 0 !important;
        margin: 0 !important;
        background-color: #ffffff !important;
      }
      .print-page-wrapper > div,
      .spj-print-page {
        box-shadow: none !important;
        margin: 0 !important;
        padding: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
        min-height: 295mm !important;
        height: auto !important;
        max-height: none !important;
        display: flex !important;
        flex-direction: column !important;
        justify-content: space-between !important;
        box-sizing: border-box !important;
        background-color: #ffffff !important;
        border-radius: 0 !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        page-break-after: auto !important;
        break-after: auto !important;
      }
      .page-break {
        page-break-after: always !important;
        break-after: page !important;
      }
    }

    /* Core layout resets ensuring exact presentation */
    .flex { display: flex !important; }
    .flex-1 { flex: 1 1 0% !important; }
    .flex-shrink-0 { flex-shrink: 0 !important; }
    .items-center { align-items: center !important; }
    .items-start { align-items: flex-start !important; }
    .justify-between { justify-content: space-between !important; }
    .justify-center { justify-content: center !important; }
    .justify-start { justify-content: flex-start !important; }
    .justify-end { justify-content: flex-end !important; }
    
    .grid { display: grid !important; }
    .grid-cols-2 { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
    
    /* Table styles matching preview exactly (clean without unwanted row lines) */
    table {
      width: 100% !important;
      border-collapse: collapse !important;
      border: 1px solid #000000 !important;
      page-break-inside: auto;
    }
    thead {
      display: table-header-group !important;
    }
    tr {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    th {
      border-bottom: 1px solid #000000 !important;
    }
    
    /* Borders */
    .border-b-2, .border-b-\\[3px\\] { border-bottom: 3px solid #000000 !important; }
    .border-b { border-bottom: 1px solid #000000 !important; }
    .border-t { border-top: 1px solid #000000 !important; }
    .border-r { border-right: 1px solid #000000 !important; }
    .border { border: 1px solid #000000 !important; }
    .border-black { border-color: #000000 !important; }

    /* Text alignment & typography */
    .text-center { text-align: center !important; }
    .text-left { text-align: left !important; }
    .text-right { text-align: right !important; }
    .font-bold { font-weight: bold !important; }
    .font-medium { font-weight: 500 !important; }
    .uppercase { text-transform: uppercase !important; }
    .underline { text-decoration: underline !important; }
    .italic { font-style: italic !important; }
    
    /* Strict logo constraint */
    svg, img {
      max-width: 75px !important;
      max-height: 75px !important;
      width: 72px !important;
      height: 72px !important;
      object-fit: contain !important;
    }
  </style>
</head>
<body style="color-scheme: light !important; background-color: #f1f5f9 !important;">
  <div class="screen-toolbar no-print">
    <div style="display:flex;align-items:center;gap:12px;">
      <span style="font-size:16px;font-weight:bold;color:#059669;">🖨️ Pratinjau Cetak SPJ Desa ${desa.namaDesa}</span>
      <span style="font-size:12px;color:#64748b;font-weight:500;">${spj.namaKegiatan}</span>
    </div>
    <div style="display:flex;align-items:center;gap:16px;">
      <span style="font-size:12px;color:#475569;">Ukuran Kertas: <b>Folio (8,5 x 13 inch / F4)</b> &bull; Margin Atas: <b>2 cm</b> &bull; Tujuan: <b>"Simpan sebagai PDF"</b></span>
      <button class="print-btn" onclick="window.print()">
        Cetak Sekarang / Simpan PDF
      </button>
    </div>
  </div>
  <div style="max-width:215.9mm;margin:0 auto;background-color:#ffffff;">
    ${pagesHtml}
  </div>
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 500);
    });
  </script>
</body>
</html>`;
  };

  const handleDownloadPdf = async () => {
    const printArea = document.getElementById('printable-spj-document-area');
    if (!printArea) return;

    try {
      setIsGeneratingPdf(true);
      setPdfStatusText('Memproses dokumen PDF...');
      const safeDesa = (desa.namaDesa || 'Desa').replace(/[^a-zA-Z0-9]/g, '_');
      const safeKeg = (spj.namaKegiatan || 'SPJ').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
      const tabSuffix =
        activeTab === 'all'
          ? 'Lengkap'
          : activeTab === 'pesanan'
          ? 'Surat_Pesanan'
          : activeTab === 'faktur'
          ? 'Faktur'
          : activeTab === 'bast'
          ? 'BAST'
          : 'Daftar_Hadir';
      const fileName = `Dokumen_SPJ_${safeDesa}_${safeKeg}_${tabSuffix}.pdf`;

      await downloadSpjAsPdf(printArea, fileName, (msg) => {
        setPdfStatusText(msg);
      });
    } catch (err) {
      console.error('Gagal membuat PDF:', err);
      // Fallback
      handlePrint();
    } finally {
      setIsGeneratingPdf(false);
      setPdfStatusText('');
    }
  };

  const handlePrint = () => {
    try {
      window.print();
      // If we are inside an iframe, native window.print may be suppressed by browser policy
      if (window.self !== window.top) {
        setShowIframeTip(true);
      }
    } catch {
      setShowIframeTip(true);
      handleOpenInNewTab();
    }
  };

  const handleOpenInNewTab = () => {
    const html = getCleanPrintHtml();
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-200 flex flex-col justify-between print:static print:bg-white print:p-0">
      {/* Top Bar - Hidden during printing */}
      <div className="bg-slate-900 text-white px-6 py-3.5 flex flex-wrap items-center justify-between shadow-lg sticky top-0 z-50 print:hidden gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-lg text-white shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Pratinjau &amp; Cetak Dokumen SPJ
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-mono">
                Desa {desa.namaDesa}
              </span>
              <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                Kertas Folio (8.5&quot; &times; 13&quot;)
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              {spj.namaKegiatan} &bull; No: {spj.nomorSuratPesanan}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1. Unduh Berkas PDF Langsung (.pdf) */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white px-3.5 py-2 rounded-lg font-semibold text-xs shadow-md transition cursor-pointer active:scale-95 disabled:cursor-wait"
            title="Unduh berkas dokumen resmi dalam format .pdf langsung"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{pdfStatusText || 'Menyiapkan PDF...'}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Unduh Berkas PDF (.pdf)</span>
              </>
            )}
          </button>

          {/* 2. Cetak Langsung */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-lg font-semibold text-xs shadow-sm transition cursor-pointer active:scale-95"
            title="Buka dialog Cetak / Simpan sebagai PDF langsung"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Cetak Langsung</span>
          </button>

          {/* 3. Buka Tab Baru (Cetak Bebas Sandbox) */}
          <button
            type="button"
            onClick={handleOpenInNewTab}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 px-3.5 py-2 rounded-lg font-semibold text-xs shadow-sm transition cursor-pointer active:scale-95"
            title="Buka dokumen di tab baru agar dialog cetak PDF tidak terhalang iframe"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Buka Tab Cetak</span>
          </button>

          {/* Tutup Modal */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Tutup</span>
          </button>
        </div>
      </div>

      {/* Tip Banner if direct print in iframe */}
      {showIframeTip && (
        <div className="bg-amber-900/90 text-amber-100 px-6 py-2.5 text-xs flex items-center justify-between border-b border-amber-700 print:hidden">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-300 flex-shrink-0" />
            <span>
              Jika dialog cetak peramban tidak muncul di dalam tampilan preview ini, silakan klik tombol <b>&quot;Buka Tab Cetak&quot;</b> atau <b>&quot;Unduh File Siap Cetak&quot;</b> untuk menyimpan dokumen sebagai PDF dengan mudah.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowIframeTip(false)}
            className="text-amber-200 hover:text-white ml-3 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Tabs Selector - Hidden during printing */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-2 flex flex-wrap gap-2 sticky top-[62px] z-40 print:hidden">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'all'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-300 hover:bg-slate-700/60'
          }`}
        >
          <span>Semua Dokumen Lengkap</span>
          <span className="text-[10px] bg-slate-900/60 px-1.5 py-0.2 rounded-full">
            {isMakanan ? '4 Hal' : '3 Hal'}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pesanan')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
            activeTab === 'pesanan'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-300 hover:bg-slate-700/60'
          }`}
        >
          1. Surat Pesanan
        </button>

        <button
          onClick={() => setActiveTab('faktur')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
            activeTab === 'faktur'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-300 hover:bg-slate-700/60'
          }`}
        >
          2. Bon / Faktur
        </button>

        <button
          onClick={() => setActiveTab('bast')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
            activeTab === 'bast'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-300 hover:bg-slate-700/60'
          }`}
        >
          3. Berita Acara (BAST)
        </button>

        {isMakanan && (
          <button
            onClick={() => setActiveTab('daftar_hadir')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'daftar_hadir'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-300 hover:bg-slate-700/60'
            }`}
          >
            <span>4. Daftar Hadir</span>
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          </button>
        )}

        <div className="ml-auto text-xs text-slate-400 hidden lg:flex items-center gap-2">
          <span>Tips: Di jendela cetak peramban, pilih &quot;Simpan sebagai PDF&quot; (Font: Arial)</span>
        </div>
      </div>

      {/* Main Document Viewer Container with id for standalone print extraction */}
      <div
        id="printable-spj-document-area"
        className="flex-1 bg-slate-200 py-8 px-4 sm:px-6 overflow-y-auto print:bg-white print:p-0 print:m-0 print:overflow-visible"
        style={{ colorScheme: 'light' }}
      >
        {/* ALL PAGES MODE */}
        {activeTab === 'all' && (
          <div className="space-y-8 print:space-y-0">
            {/* Page 1: Surat Pesanan */}
            <div className="print:min-h-0 print:h-auto print:break-after-page print:page-break-after-always">
              <div className="mb-2 text-center text-xs text-slate-500 print:hidden font-mono">
                --- Lembar 1: Surat Pesanan ---
              </div>
              <SuratPesananDoc spj={spj} desa={desa} />
            </div>

            {/* Page 2: Faktur */}
            <div className="print:min-h-0 print:h-auto print:break-after-page print:page-break-after-always">
              <div className="mb-2 text-center text-xs text-slate-500 print:hidden font-mono">
                --- Lembar 2: Bon / Faktur ---
              </div>
              <FakturDoc spj={spj} desa={desa} />
            </div>

            {/* Page 3: Berita Acara */}
            <div className={`print:min-h-0 print:h-auto ${isMakanan ? 'print:break-after-page print:page-break-after-always' : ''}`}>
              <div className="mb-2 text-center text-xs text-slate-500 print:hidden font-mono">
                --- Lembar 3: Berita Acara Pemeriksaan dan Penerimaan Barang ---
              </div>
              <BeritaAcaraDoc spj={spj} desa={desa} />
            </div>

            {/* Page 4: Daftar Hadir (Only if Makanan & Minuman) */}
            {isMakanan && (
              <div className="print:min-h-0 print:h-auto">
                <div className="mb-2 text-center text-xs text-slate-500 print:hidden font-mono">
                  --- Lembar 4: Daftar Hadir Kegiatan (Khusus Makanan &amp; Minuman) ---
                </div>
                <DaftarHadirDoc spj={spj} desa={desa} />
              </div>
            )}
          </div>
        )}

        {/* INDIVIDUAL DOCUMENT TABS */}
        {activeTab === 'pesanan' && (
          <div>
            <SuratPesananDoc spj={spj} desa={desa} />
          </div>
        )}

        {activeTab === 'faktur' && (
          <div>
            <FakturDoc spj={spj} desa={desa} />
          </div>
        )}

        {activeTab === 'bast' && (
          <div>
            <BeritaAcaraDoc spj={spj} desa={desa} />
          </div>
        )}

        {activeTab === 'daftar_hadir' && isMakanan && (
          <div>
            <DaftarHadirDoc spj={spj} desa={desa} />
          </div>
        )}
      </div>
    </div>
  );
};

