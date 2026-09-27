import React from 'react';
import { SpjDocument, DesaProfile, PesertaHadir } from '../../types';
import {
  formatTanggalIndonesia,
  getNamaHariIndonesia,
} from '../../utils/dateHelper';
import { LogoDesaRenderer } from '../../assets/logoDefault';

interface DocProps {
  spj: SpjDocument;
  desa: DesaProfile;
}

interface PageData {
  pageNumber: number;
  totalPages: number;
  items: Array<{ participant: PesertaHadir; originalIndex: number }>;
  isFirstPage: boolean;
  isLastPage: boolean;
}

function paginateParticipants(participants: PesertaHadir[]): PageData[] {
  const total = participants.length;

  // Single page: 18 or fewer participants comfortably fit with Kop, Info, and Signatures on Folio (8x13)
  if (total <= 18) {
    return [
      {
        pageNumber: 1,
        totalPages: 1,
        items: participants.map((p, i) => ({ participant: p, originalIndex: i })),
        isFirstPage: true,
        isLastPage: true,
      },
    ];
  }

  // Multi-page on Folio (8x13):
  // Requirements:
  // 1. Column header repeated on subsequent pages
  // 2. Minimal 2 rows on the last page before signatures
  const FIRST_PAGE_MAX = 18;
  const LAST_PAGE_MAX = 22; // leaves space for signature block
  const MIDDLE_PAGE_MAX = 26;

  if (total <= FIRST_PAGE_MAX + LAST_PAGE_MAX) {
    // Exactly 2 pages
    // Guarantee at least 2 items on page 2:
    let firstCount = Math.min(FIRST_PAGE_MAX, total - 2);
    if (total - firstCount > LAST_PAGE_MAX) {
      firstCount = total - LAST_PAGE_MAX;
    }

    const page1Items = participants
      .slice(0, firstCount)
      .map((p, i) => ({ participant: p, originalIndex: i }));
    const page2Items = participants
      .slice(firstCount)
      .map((p, i) => ({ participant: p, originalIndex: firstCount + i }));

    return [
      { pageNumber: 1, totalPages: 2, items: page1Items, isFirstPage: true, isLastPage: false },
      { pageNumber: 2, totalPages: 2, items: page2Items, isFirstPage: false, isLastPage: true },
    ];
  }

  // 3 or more pages:
  const pages: PageData[] = [];
  const remaining = participants.map((p, i) => ({ participant: p, originalIndex: i }));

  // Page 1
  const page1Items = remaining.splice(0, FIRST_PAGE_MAX);
  pages.push({
    pageNumber: 1,
    totalPages: 0,
    items: page1Items,
    isFirstPage: true,
    isLastPage: false,
  });

  // Middle pages
  while (remaining.length > LAST_PAGE_MAX) {
    const count = Math.min(MIDDLE_PAGE_MAX, remaining.length - 2);
    pages.push({
      pageNumber: pages.length + 1,
      totalPages: 0,
      items: remaining.splice(0, count),
      isFirstPage: false,
      isLastPage: false,
    });
  }

  // Last page: ensure at least 2 items
  if (remaining.length < 2 && pages.length > 0) {
    const prevPage = pages[pages.length - 1];
    const borrowed = prevPage.items.pop();
    if (borrowed) {
      remaining.unshift(borrowed);
    }
  }

  pages.push({
    pageNumber: pages.length + 1,
    totalPages: 0,
    items: remaining,
    isFirstPage: false,
    isLastPage: true,
  });

  const totalPages = pages.length;
  pages.forEach((p) => (p.totalPages = totalPages));
  return pages;
}

export const DaftarHadirDoc: React.FC<DocProps> = ({ spj, desa }) => {
  const tanggalFakturIndo = formatTanggalIndonesia(spj.tanggalFaktur);
  const hariFaktur = getNamaHariIndonesia(spj.tanggalFaktur);

  const rawParticipants: PesertaHadir[] =
    spj.daftarHadir && spj.daftarHadir.length > 0
      ? spj.daftarHadir
      : Array.from({ length: 15 }, (_, idx) => ({
          id: `p-${idx + 1}`,
          no: idx + 1,
          nama: '',
          jabatan: '',
          alamatInstansi: '',
        }));

  const pages = paginateParticipants(rawParticipants);

  return (
    <div className="space-y-8 print:space-y-0">
      {pages.map((page) => {
        return (
          <div
            key={page.pageNumber}
            style={{
              fontFamily: 'Arial, Helvetica, sans-serif',
              minHeight: '330.2mm',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
            className={`spj-print-page bg-white text-black p-8 font-sans leading-relaxed text-[10pt] max-w-[215.9mm] mx-auto shadow-sm print:shadow-none print:p-0 print:m-0 print:max-w-none flex flex-col justify-between ${
              !page.isLastPage ? 'print:break-after-page print:page-break-after-always' : ''
            }`}
          >
            <div className="flex-1 flex flex-col">
              {/* PAGE 1: KOP SURAT & INFO KEGIATAN */}
              {page.isFirstPage ? (
                <>
                  {/* KOP SURAT */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '3px solid #000000',
                      paddingBottom: '8px',
                    }}
                    className="flex items-center justify-between pb-2 border-b-[3px] border-black"
                  >
                    <div
                      style={{
                        width: '80px',
                        height: '80px',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      className="w-20 h-20 flex-shrink-0 flex items-center justify-center"
                    >
                      <LogoDesaRenderer logoUrl={desa.logoUrl} className="w-20 h-20" />
                    </div>
                    <div
                      style={{ flex: 1, textAlign: 'center' }}
                      className="flex-1 text-center font-bold tracking-wide uppercase px-2"
                    >
                      <div className="text-[13pt] leading-tight">
                        PEMERINTAH KABUPATEN {desa.kabupaten.toUpperCase()}
                      </div>
                      <div className="text-[13pt] leading-tight">
                        KECAMATAN {desa.kecamatan.toUpperCase()}
                      </div>
                      <div className="text-[15pt] leading-tight tracking-wider">
                        DESA {desa.namaDesa.toUpperCase()}
                      </div>
                      {desa.alamatKantor && (
                        <div className="text-[9pt] font-normal normal-case italic mt-0.5 tracking-normal">
                          Alamat: {desa.alamatKantor}
                        </div>
                      )}
                    </div>
                    <div style={{ width: '80px', flexShrink: 0 }} className="w-20 flex-shrink-0"></div>
                  </div>
                  <div className="border-b-[1px] border-black mt-[1.5px] mb-3"></div>

                  {/* JUDUL DAFTAR HADIR */}
                  <div className="text-center mb-3">
                    <h2 className="text-center font-bold text-[13pt] underline tracking-wider uppercase">
                      DAFTAR HADIR
                    </h2>
                    <p className="text-[10.5pt] font-bold mt-1 uppercase tracking-wide">
                      {spj.namaKegiatan || spj.daftarHadirJudul || ''}
                    </p>
                  </div>

                  {/* RINCIAN WAKTU & TEMPAT */}
                  <div className="mb-3 text-[9.5pt] bg-slate-50/50 p-2 border border-black/30 rounded-sm">
                    <div className="grid grid-cols-[130px_10px_1fr] py-0.5">
                      <span>Hari / Tanggal</span>
                      <span>:</span>
                      <span className="font-semibold">{hariFaktur}, {tanggalFakturIndo}</span>
                    </div>
                    <div className="grid grid-cols-[130px_10px_1fr] py-0.5">
                      <span>Tempat</span>
                      <span>:</span>
                      <span>{spj.daftarHadirTempat || `Balai Pertemuan Desa ${desa.namaDesa}`}</span>
                    </div>
                  </div>
                </>
              ) : (
                /* SUBSEQUENT PAGES: REPEATED HEADER TITLE (Dengan Nama Kegiatan Uppercase) */
                <div className="pb-2 border-b-2 border-black mb-3 text-[10pt]">
                  <div>
                    <h2 className="font-bold text-[12pt] uppercase tracking-wider">
                      DAFTAR HADIR (Lanjutan)
                    </h2>
                    <p className="text-[9.5pt] text-gray-900 font-bold uppercase tracking-wide">
                      {(spj.namaKegiatan || spj.daftarHadirJudul || `Desa ${desa.namaDesa}`).toUpperCase()}
                    </p>
                  </div>
                </div>
              )}

              {/* TABEL DAFTAR HADIR DENGAN NAMA KOLOM REPEATED */}
              <table className="w-full border-collapse border border-black mb-3 text-[9.5pt]">
                <thead className="table-header-group print:table-header-group bg-slate-100/60">
                  <tr className="border-b border-black text-center font-bold">
                    <th className="border-r border-black p-1.5 w-10 text-center">No</th>
                    <th className="border-r border-black p-1.5 text-center">Nama Peserta</th>
                    <th className="border-r border-black p-1.5 text-center w-52">Jabatan / Unsur</th>
                    <th className="border-r border-black p-1.5 text-center w-48">Tanda Tangan</th>
                    <th className="p-1.5 text-center w-24">Ket.</th>
                  </tr>
                </thead>
                <tbody>
                  {page.items.map(({ participant: p, originalIndex: idx }) => {
                    const isOdd = (idx + 1) % 2 !== 0;
                    return (
                      <tr
                        key={p.id || idx}
                        className="border-b border-black h-8 break-inside-avoid print:break-inside-avoid"
                      >
                        <td className="border-r border-black p-1 text-center align-middle">{idx + 1}</td>
                        <td className="border-r border-black p-1 text-left pl-2 align-middle">{p.nama}</td>
                        <td className="border-r border-black p-1 text-left pl-2 text-gray-800 align-middle">
                          {p.jabatan}
                        </td>
                        {/* Kolom tanda tangan: nomor ganjil di sebelah kiri, nomor genap di tengah */}
                        <td className="border-r border-black p-1 align-middle">
                          <div
                            style={{
                              display: 'flex',
                              width: '100%',
                              justifyContent: isOdd ? 'flex-start' : 'center',
                              paddingLeft: isOdd ? '12px' : '0',
                            }}
                            className={`w-full flex ${isOdd ? 'justify-start pl-3' : 'justify-center'}`}
                          >
                            <span className="font-bold text-[9.5pt]">{idx + 1}.</span>
                          </div>
                        </td>
                        <td className="p-1 text-center align-middle">{p.alamatInstansi || ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* SIGNATURE BLOCK ON THE LAST PAGE ONLY: Jarak 6 baris dari tabel (mt-6) */}
              {page.isLastPage && (
                <div className="grid grid-cols-2 text-center text-[10pt] mt-6 break-inside-avoid print:break-inside-avoid">
                  {/* Di sebelah kiri : Mengetahui Kepala Desa */}
                  <div className="flex flex-col justify-between h-40 text-center">
                    <div>
                      <div>Mengetahui :</div>
                      <div className="font-medium">{desa.kepalaDesa.jabatan || 'Kepala Desa'} {desa.namaDesa}</div>
                    </div>
                    <div>
                      <div className="font-bold underline uppercase">{desa.kepalaDesa.nama}</div>
                      <div className="text-[9pt]">NIP. {desa.kepalaDesa.nip || '-'}</div>
                    </div>
                  </div>

                  {/* Di sebelah kanan : Pelaksana Kegiatan */}
                  <div className="flex flex-col justify-between h-40 text-center">
                    <div>
                      <div className="invisible select-none">&nbsp;</div>
                      <div>Pelaksana Kegiatan,</div>
                    </div>
                    <div>
                      <div className="font-bold underline uppercase">{spj.pelaksanaNama}</div>
                      <div className="text-[9pt] invisible select-none">&nbsp;</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* NOMOR HALAMAN & BERSAMBUNG RESMI JIKA MULTI-PAGE: Selalu di posisi paling bawah halaman */}
            {page.totalPages > 1 && (
              <div className="mt-auto pt-4 w-full shrink-0">
                {!page.isLastPage && (
                  <div className="text-right text-[9pt] italic font-semibold text-gray-700 font-mono pb-1">
                    [ Bersambung ke Halaman {page.pageNumber + 1}... ]
                  </div>
                )}
                <div className="pt-1.5 border-t-2 border-black text-right text-[8.5pt] text-gray-700 font-mono">
                  Halaman {page.pageNumber} dari {page.totalPages}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
