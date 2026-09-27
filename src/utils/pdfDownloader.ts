import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Downloads the SPJ document area as an authentic PDF file (.pdf)
 */
export async function downloadSpjAsPdf(
  containerElement: HTMLElement,
  fileName: string,
  onProgress?: (status: string) => void
): Promise<void> {
  // Find all individual pages/documents with class .spj-print-page
  const rawElements = containerElement.querySelectorAll<HTMLElement>('.spj-print-page');

  // Filter out any elements that are empty, have no visible text, or are hidden
  const elementsToProcess = Array.from(rawElements).filter((el) => {
    const text = el.innerText?.trim() || '';
    return text.length > 0 && el.offsetHeight > 20;
  });

  const finalElements =
    elementsToProcess.length > 0 ? elementsToProcess : [containerElement];

  // Ukuran kertas Folio (F4): 8.5 inch x 13 inch = 215.9mm x 330.2mm
  const pdfPageWidth = 215.9;
  const pdfPageHeight = 330.2;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pdfPageWidth, pdfPageHeight],
    compress: true,
  });

  const total = finalElements.length;
  let pagesAdded = 0;

  for (let i = 0; i < total; i++) {
    const el = finalElements[i];
    const docElement = el.classList.contains('bg-white')
      ? el
      : el.querySelector<HTMLElement>('.bg-white') || el;

    // Check if docElement has actual text, skip if empty
    if (!docElement.innerText || docElement.innerText.trim().length === 0) {
      continue;
    }

    onProgress?.(`Memproses halaman ${pagesAdded + 1} dari ${total}...`);

    // Render using html2canvas with scale 2 for crisp vector-like text
    const canvas = await html2canvas(docElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      ignoreElements: (element) =>
        element.classList.contains('print:hidden') || element.classList.contains('no-print'),
    });

    if (canvas.width === 0 || canvas.height === 0) {
      continue;
    }

    const imgData = canvas.toDataURL('image/jpeg', 0.96);

    // Calculate height in mm proportionally
    const imgHeightMm = (canvas.height * pdfPageWidth) / canvas.width;

    if (pagesAdded > 0) {
      pdf.addPage([pdfPageWidth, pdfPageHeight], 'portrait');
    }

    // Pastikan seluruh lembar halaman Folio berwarna putih murni (255, 255, 255)
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pdfPageWidth, pdfPageHeight, 'F');

    // Lock strictly to 1 Folio page per docElement
    const renderHeight = Math.min(imgHeightMm, pdfPageHeight);
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfPageWidth, renderHeight);
    pagesAdded++;
  }

  onProgress?.('Menyimpan berkas PDF...');
  const cleanFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  pdf.save(cleanFileName);
}
