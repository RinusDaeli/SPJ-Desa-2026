import React from 'react';
import { SpjDocument, DesaProfile, SpjItem } from '../../types';
import { formatTanggalIndonesia, getNamaHariIndonesia, formatSumberDanaLengkap } from '../../utils/dateHelper';
import { formatRibuan } from '../../utils/terbilang';

interface DocProps {
  spj: SpjDocument;
  desa: DesaProfile;
}

interface BastPageData {
  pageNumber: number;
  totalPages: number;
  items: Array<{ item: SpjItem; originalIndex: number }>;
  isFirstPage: boolean;
  isLastPage: boolean;
}

function paginateBastItems(items: SpjItem[]): BastPageData[] {
  const total = items.length;

  // Single page: dengan tinggi baris ringkas, hingga 13-14 item muat dalam 1 lembar Folio bersama 4 tanda tangan
  if (total <= 13) {
    return [
      {
        pageNumber: 1,
        totalPages: 1,
        items: items.map((item, idx) => ({ item, originalIndex: idx })),
        isFirstPage: true,
        isLastPage: true,
      },
    ];
  }

  // Multi-page logic:
  const pages: BastPageData[] = [];
  const indexedItems = items.map((item, idx) => ({ item, originalIndex: idx }));

  if (total <= 28) {
    let page1Count = Math.min(18, Math.max(10, total - 5));
    if (total - page1Count < 3) {
      page1Count = total - 3;
    }

    pages.push({
      pageNumber: 1,
      totalPages: 2,
      items: indexedItems.slice(0, page1Count),
      isFirstPage: true,
      isLastPage: false,
    });
    pages.push({
      pageNumber: 2,
      totalPages: 2,
      items: indexedItems.slice(page1Count),
      isFirstPage: false,
      isLastPage: true,
    });
    return pages;
  }

  // Untuk total > 28:
  let cursor = 0;
  const p1Count = 18;
  pages.push({
    pageNumber: 1,
    totalPages: 0,
    items: indexedItems.slice(0, p1Count),
    isFirstPage: true,
    isLastPage: false,
  });
  cursor = p1Count;

  while (cursor < total) {
    const remaining = total - cursor;
    if (remaining <= 12) {
      pages.push({
        pageNumber: pages.length + 1,
        totalPages: 0,
        items: indexedItems.slice(cursor),
        isFirstPage: false,
        isLastPage: true,
      });
      cursor = total;
    } else {
      const take = Math.min(22, remaining - 4);
      pages.push({
        pageNumber: pages.length + 1,
        totalPages: 0,
        items: indexedItems.slice(cursor, cursor + take),
        isFirstPage: false,
        isLastPage: false,
      });
      cursor += take;
    }
  }

  const totalPages = pages.length;
  pages.forEach((p) => {
    p.totalPages = totalPages;
    p.isLastPage = p.pageNumber === totalPages;
  });
  return pages;
}

export const BeritaAcaraDoc: React.FC<DocProps> = ({ spj, desa }) => {
  const tanggalBastIndo = formatTanggalIndonesia(spj.tanggalBAST || spj.tanggalFaktur);
  const hariBast = spj.hariBAST || getNamaHariIndonesia(spj.tanggalBAST || spj.tanggalFaktur);
  const tanggalPesananIndo = formatTanggalIndonesia(spj.tanggalSuratPesanan);
  const sumberDanaSingkatan = formatSumberDanaLengkap(spj.sumberDana);

  const rawItems = spj.items && spj.items.length > 0 ? spj.items : [];
  const pages = paginateBastItems(rawItems);

  return (
    <div className="space-y-8 print:space-y-0">
      {pages.map((page) => (
        <div
          key={page.pageNumber}
          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
          className={`spj-print-page bg-white text-black p-8 font-sans leading-snug text-[9.5pt] max-w-[215.9mm] mx-auto min-h-[330.2mm] shadow-sm print:shadow-none print:p-0 print:m-0 print:max-w-none print:min-h-[295mm] flex flex-col justify-start ${
            !page.isLastPage ? 'print:break-after-page print:page-break-after-always' : ''
          }`}
        >
          <div className="flex-1 flex flex-col">
            {page.isFirstPage ? (
              <>
                {/* JUDUL BERITA ACARA */}
                <div className="text-center mb-2.5">
                  <h2 className="text-center font-bold text-[11.5pt] underline tracking-wide uppercase">
                    BERITA ACARA PEMERIKSAAN DAN PENERIMAAN BARANG
                  </h2>
                  <p className="text-[9pt] font-medium mt-0.5">
                    Nomor : {spj.nomorBAST}
                  </p>
                </div>

                {/* KALIMAT PEMBUKA */}
                <p className="text-justify mb-2 text-[9pt] leading-relaxed">
                  Pada hari ini, <span className="font-semibold">{hariBast}</span> tanggal <span className="font-semibold">{tanggalBastIndo}</span>, bertempat di Desa {desa.namaDesa} Kecamatan {desa.kecamatan} Kabupaten {desa.kabupaten}, yang bertanda tangan di bawah ini :
                </p>

                {/* DATA PIHAK PERTAMA DAN KEDUA */}
                <div className="mb-2 space-y-1.5 pl-3 text-[9pt]">
                  {/* Pihak Pertama */}
                  <div>
                    <div className="grid grid-cols-[25px_90px_15px_1fr]">
                      <span className="font-semibold">1.</span>
                      <span>Nama</span>
                      <span>:</span>
                      <span className="font-bold uppercase">{spj.penyedia.pimpinan}</span>
                    </div>
                    <div className="grid grid-cols-[25px_90px_15px_1fr]">
                      <span></span>
                      <span>Pekerjaan</span>
                      <span>:</span>
                      <span>{spj.penyedia.jabatan || `Pimpinan ${spj.penyedia.namaPerusahaan}`}</span>
                    </div>
                    <div className="grid grid-cols-[25px_90px_15px_1fr]">
                      <span></span>
                      <span>Alamat</span>
                      <span>:</span>
                      <span>{spj.penyedia.alamat}</span>
                    </div>
                    <div className="pl-11 font-medium italic mt-0.5 text-gray-800 text-[8.5pt]">
                      Selanjutnya disebut Pihak Pertama
                    </div>
                  </div>

                  {/* Pihak Kedua */}
                  <div>
                    <div className="grid grid-cols-[25px_90px_15px_1fr]">
                      <span className="font-semibold">2.</span>
                      <span>Nama</span>
                      <span>:</span>
                      <span className="font-bold uppercase">{spj.pelaksanaNama}</span>
                    </div>
                    <div className="grid grid-cols-[25px_90px_15px_1fr]">
                      <span></span>
                      <span>Pekerjaan</span>
                      <span>:</span>
                      <span>{spj.pelaksanaJabatan}</span>
                    </div>
                    <div className="grid grid-cols-[25px_90px_15px_1fr]">
                      <span></span>
                      <span>Alamat</span>
                      <span>:</span>
                      <span>Desa {desa.namaDesa} Kecamatan {desa.kecamatan}</span>
                    </div>
                    <div className="pl-11 font-medium italic mt-0.5 text-gray-800 text-[8.5pt]">
                      Selanjutnya disebut Pihak Kedua
                    </div>
                  </div>
                </div>

                {/* KLAUSUL PENYERAHAN */}
                <div className="mb-2 text-justify space-y-1 text-[9pt] leading-relaxed">
                  <p>
                    Pihak Pertama telah menyerahkan seluruh barang pesanan sesuai dengan surat Pesanan Pelaksana Kegiatan pada Kegiatan : {spj.namaKegiatan} yang dananya bersumber dari {sumberDanaSingkatan} TA. {spj.tahunAnggaran} Desa {desa.namaDesa} Kecamatan {desa.kecamatan} sesuai Pesanan Nomor : {spj.nomorSuratPesanan} tanggal {tanggalPesananIndo}.
                  </p>
                  <p>
                    Pihak Kedua telah menerima seluruh barang yang diserahkan oleh Pihak Pertama dalam keadaan baik dan cukup sesuai dengan daftar berikut ini :
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* HEADER HALAMAN LANJUTAN */}
                <div className="text-center mb-2 pb-1 border-b border-black">
                  <h2 className="text-center font-bold text-[11pt] underline tracking-wide uppercase">
                    BERITA ACARA PEMERIKSAAN DAN PENERIMAAN BARANG (LANJUTAN)
                  </h2>
                  <p className="text-[9pt] font-medium mt-0.5">
                    Nomor : {spj.nomorBAST}
                  </p>
                </div>
                <p className="text-[9pt] mb-1.5 font-medium">Lanjutan Daftar Pemeriksaan Barang :</p>
              </>
            )}

            {/* TABEL PEMERIKSAAN BARANG: Polos antar-baris, baris ringkas */}
            <table className="w-full border-collapse border border-black mb-2 text-[9pt] leading-snug">
              <thead className="table-header-group print:table-header-group bg-slate-100/60">
                <tr className="border-b border-black text-center font-bold">
                  <th rowSpan={2} className="border-r border-black py-1 px-1.5 w-10">No</th>
                  <th rowSpan={2} className="border-r border-black py-1 px-1.5 text-left">Nama dan Spesifikasi</th>
                  <th colSpan={2} className="border-r border-black py-1 px-1.5 w-40">Kondisi Saat Diperiksa</th>
                  <th rowSpan={2} className="py-1 px-1.5 w-44 text-center">Ket</th>
                </tr>
                <tr className="border-b border-black text-center font-bold">
                  <th className="border-r border-black py-1 px-1.5 w-20">Baik</th>
                  <th className="border-r border-black py-1 px-1.5 w-20">Rusak</th>
                </tr>
              </thead>
              <tbody>
                {page.items.map(({ item, originalIndex }, subIdx) => (
                  <tr key={item.id || originalIndex} className="break-inside-avoid print:break-inside-avoid">
                    <td className="border-r border-black py-1 px-1.5 text-center align-top">{originalIndex + 1}</td>
                    <td className="border-r border-black py-1 px-1.5 align-top">{item.nama}</td>
                    <td className="border-r border-black py-1 px-1.5 text-center align-top whitespace-nowrap font-medium">
                      {formatRibuan(item.kondisiBaik !== undefined ? item.kondisiBaik : item.volume)} {item.satuan}
                    </td>
                    <td className="border-r border-black py-1 px-1.5 text-center align-top whitespace-nowrap text-gray-600">
                      {item.kondisiRusak ? `${formatRibuan(item.kondisiRusak)} ${item.satuan}` : '-'}
                    </td>
                    {/* Kolom Keterangan digabungkan (merge ke bawah untuk halaman ini) */}
                    {subIdx === 0 && (
                      <td
                        rowSpan={page.items.length + (page.isFirstPage && page.isLastPage && page.items.length <= 4 ? 1 : 0)}
                        className="py-1 px-2 text-center align-middle text-[8.5pt] leading-snug font-medium text-slate-900 bg-white"
                      >
                        Seluruh Barang yang diterima berada dalam keadaan baik dan cukup
                      </td>
                    )}
                  </tr>
                ))}

                {/* Spacer row only for single page with very few items */}
                {page.isFirstPage && page.isLastPage && page.items.length <= 4 && (
                  <tr className="h-6 break-inside-avoid print:break-inside-avoid">
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* JIKA HALAMAN TERAKHIR: PENUTUP & 4 TANDA TANGAN */}
            {page.isLastPage && (
              <div className="mt-3">
                {/* PENUTUP */}
                <div className="mb-1.5 text-justify text-[9pt] leading-relaxed">
                  <p>Demikian Berita Acara ini dibuat dengan sesungguhnya untuk dapat dipergunakan seperlunya.</p>
                  <p className="italic text-right mt-0.5">Dibuat pada hari dan tanggal tersebut di atas</p>
                </div>

                {/* TANDA TANGAN 4 PIHAK (2 BARIS x 2 KOLOM) */}
                <div className="space-y-2 pt-0.5 text-[9pt] break-inside-avoid print:break-inside-avoid">
                  {/* Baris 1: Pihak Pertama & Pihak Kedua */}
                  <div className="grid grid-cols-2 text-center">
                    <div>
                      <div>Pihak Pertama :</div>
                      <div className="font-medium">Pimpinan {spj.penyedia.namaPerusahaan},</div>
                      <div className="h-10"></div>
                      <div className="font-bold underline uppercase">{spj.penyedia.pimpinan}</div>
                    </div>
                    <div>
                      <div>Pihak Kedua :</div>
                      <div className="font-medium">Pelaksana Kegiatan,</div>
                      <div className="h-10"></div>
                      <div className="font-bold underline uppercase">{spj.pelaksanaNama}</div>
                    </div>
                  </div>

                  {/* Baris 2: Diverifikasi oleh & Diketahui oleh */}
                  <div className="grid grid-cols-2 text-center pt-0.5">
                    <div>
                      <div>Diverifikasi oleh :</div>
                      <div className="font-medium">{desa.sekretarisDesa.jabatan} {desa.namaDesa},</div>
                      <div className="h-10"></div>
                      <div className="font-bold underline uppercase">{desa.sekretarisDesa.nama}</div>
                      {desa.sekretarisDesa.nip && (
                        <div className="text-[8pt]">NIP. {desa.sekretarisDesa.nip}</div>
                      )}
                    </div>
                    <div>
                      <div>Diketahui oleh :</div>
                      <div className="font-medium">{desa.kepalaDesa.jabatan} {desa.namaDesa},</div>
                      <div className="h-10"></div>
                      <div className="font-bold underline uppercase">{desa.kepalaDesa.nama}</div>
                      {desa.kepalaDesa.nip && (
                        <div className="text-[8pt]">NIP. {desa.kepalaDesa.nip}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* NOMOR HALAMAN & BERSAMBUNG RESMI JIKA MULTI-PAGE */}
          {page.totalPages > 1 && (
            <div className="mt-auto pt-2 w-full">
              {!page.isLastPage && (
                <div className="text-right text-[8.5pt] italic font-semibold text-gray-700 font-mono pb-0.5">
                  [ Bersambung ke Halaman {page.pageNumber + 1}... ]
                </div>
              )}
              <div className="pt-1 border-t-2 border-black text-right text-[8pt] text-gray-700 font-mono">
                Halaman {page.pageNumber} dari {page.totalPages}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
