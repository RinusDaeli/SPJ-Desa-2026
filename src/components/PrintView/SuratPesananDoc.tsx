import React from 'react';
import { SpjDocument, DesaProfile, SpjItem } from '../../types';
import { formatTanggalIndonesia, formatSumberDanaLengkap } from '../../utils/dateHelper';
import { formatRibuan } from '../../utils/terbilang';
import { LogoDesaRenderer } from '../../assets/logoDefault';

interface DocProps {
  spj: SpjDocument;
  desa: DesaProfile;
}

interface PesananPageData {
  pageNumber: number;
  totalPages: number;
  items: Array<{ item: SpjItem; originalIndex: number }>;
  isFirstPage: boolean;
  isLastPage: boolean;
}

function paginatePesananItems(items: SpjItem[]): PesananPageData[] {
  const total = items.length;

  // Single page: dengan tinggi baris ringkas (compact), hingga 12 item muat dalam 1 lembar Folio
  if (total <= 12) {
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
  const pages: PesananPageData[] = [];
  const indexedItems = items.map((item, idx) => ({ item, originalIndex: idx }));

  if (total <= 26) {
    let page1Count = Math.min(18, Math.max(8, total - 6));
    if (total - page1Count < 4) {
      page1Count = total - 4;
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

  // Untuk total > 26:
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

export const SuratPesananDoc: React.FC<DocProps> = ({ spj, desa }) => {
  const tanggalPesananIndo = formatTanggalIndonesia(spj.tanggalSuratPesanan);
  const sumberDanaLengkap = formatSumberDanaLengkap(spj.sumberDana);

  const rawItems = spj.items && spj.items.length > 0 ? spj.items : [];
  const pages = paginatePesananItems(rawItems);

  return (
    <div className="space-y-8 print:space-y-0">
      {pages.map((page) => (
        <div
          key={page.pageNumber}
          style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}
          className={`spj-print-page bg-white text-black p-8 font-sans leading-snug text-[9.5pt] max-w-[215.9mm] mx-auto min-h-[330.2mm] shadow-sm print:shadow-none print:p-0 print:m-0 print:max-w-none print:min-h-[295mm] flex flex-col justify-between ${
            !page.isLastPage ? 'print:break-after-page print:page-break-after-always' : ''
          }`}
        >
          <div className="flex-1 flex flex-col">
            {page.isFirstPage ? (
              <>
                {/* KOP SURAT */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '3px solid #000000',
                    paddingBottom: '6px',
                  }}
                  className="flex items-center justify-between pb-1.5 border-b-[3px] border-black"
                >
                  <div className="w-18 h-18 flex-shrink-0 flex items-center justify-center">
                    <LogoDesaRenderer logoUrl={desa.logoUrl} className="w-18 h-18" />
                  </div>
                  <div className="flex-1 text-center font-bold tracking-wide uppercase px-2">
                    <div className="text-[13pt] leading-tight">PEMERINTAH KABUPATEN {desa.kabupaten.toUpperCase()}</div>
                    <div className="text-[13pt] leading-tight">KECAMATAN {desa.kecamatan.toUpperCase()}</div>
                    <div className="text-[15pt] leading-tight tracking-wider">DESA {desa.namaDesa.toUpperCase()}</div>
                    {desa.alamatKantor && (
                      <div className="text-[8.5pt] font-normal normal-case italic mt-0.5 tracking-normal">
                        Alamat: {desa.alamatKantor}
                      </div>
                    )}
                  </div>
                  <div className="w-18 flex-shrink-0"></div>
                </div>
                <div className="border-b-[1px] border-black mt-[1.5px] mb-2.5"></div>

                {/* TANGGAL & KEPADA */}
                <div className="flex justify-between items-start mb-2.5 text-[9.5pt]">
                  {/* Kolom Kiri */}
                  <div className="w-[55%] space-y-0.5">
                    <div className="grid grid-cols-[75px_10px_1fr]">
                      <span>Nomor</span>
                      <span>:</span>
                      <span>{spj.nomorSuratPesanan}</span>
                    </div>
                    <div className="grid grid-cols-[75px_10px_1fr]">
                      <span>Sifat</span>
                      <span>:</span>
                      <span>{spj.sifatSurat || 'Penting'}</span>
                    </div>
                    <div className="grid grid-cols-[75px_10px_1fr]">
                      <span>Lampiran</span>
                      <span>:</span>
                      <span>{spj.lampiranSurat || '1 (satu) lembar'}</span>
                    </div>
                    <div className="grid grid-cols-[75px_10px_1fr]">
                      <span>Perihal</span>
                      <span>:</span>
                      <span className="font-semibold">{spj.perihalSurat || 'Pesanan'}</span>
                    </div>
                  </div>

                  {/* Kolom Kanan */}
                  <div className="w-[45%] text-left pl-6">
                    <div className="mb-1">
                      {desa.namaDesa}, {tanggalPesananIndo}
                    </div>
                    <div>Kepada yth :</div>
                    <div className="font-bold">{spj.penyedia.pimpinan ? `Pengusaha ${spj.penyedia.namaPerusahaan}` : spj.penyedia.namaPerusahaan}</div>
                    <div>di -</div>
                    <div className="pl-6 font-semibold">{spj.penyedia.kota || spj.penyedia.alamat}</div>
                  </div>
                </div>

                {/* PARAGRAF PEMBUKA */}
                <p className="text-justify mb-2.5 text-[9.5pt] indent-6 leading-relaxed">
                  Sehubungan dengan pelaksanaan kegiatan {spj.namaKegiatan} yang dananya bersumber dari {sumberDanaLengkap} Desa {desa.namaDesa} TA. {spj.tahunAnggaran}, dengan ini dimohon kesediaan saudara untuk menyediakan kepada kami barang sebagaimana daftar berikut :
                </p>
              </>
            ) : (
              /* HEADER LANJUTAN */
              <div className="text-center mb-2.5 pb-1.5 border-b border-black">
                <div className="text-[11.5pt] font-bold uppercase tracking-wider">
                  SURAT PESANAN (LANJUTAN)
                </div>
                <div className="text-[9pt] font-medium text-slate-800">
                  Nomor : {spj.nomorSuratPesanan} &bull; Halaman {page.pageNumber} dari {page.totalPages}
                </div>
              </div>
            )}

            {/* TABEL BARANG DENGAN TINGGI BARIS RINGKAS */}
            <table className="w-full border-collapse border border-black mb-2 text-[9pt] leading-snug">
              <thead className="table-header-group print:table-header-group bg-slate-100/60">
                <tr className="border-b border-black text-center font-bold">
                  <th className="border-r border-black py-1 px-1.5 w-10">No</th>
                  <th className="border-r border-black py-1 px-1.5 text-left">Nama dan Spesifikasi</th>
                  <th className="border-r border-black py-1 px-1.5 w-28">Volume</th>
                  <th className="py-1 px-1.5 w-20">Ket</th>
                </tr>
              </thead>
              <tbody>
                {page.items.map(({ item, originalIndex }) => (
                  <tr key={item.id || originalIndex} className="break-inside-avoid print:break-inside-avoid">
                    <td className="border-r border-black py-1 px-1.5 text-center align-top">{originalIndex + 1}</td>
                    <td className="border-r border-black py-1 px-1.5 align-top">{item.nama}</td>
                    <td className="border-r border-black py-1 px-1.5 text-center align-top whitespace-nowrap">
                      {formatRibuan(item.volume)} {item.satuan}
                    </td>
                    <td className="py-1 px-1.5 text-center align-top"></td>
                  </tr>
                ))}
                {page.isLastPage && page.items.length < 8 && (
                  <tr className="h-6 break-inside-avoid print:break-inside-avoid">
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td className="border-r border-black"></td>
                    <td></td>
                  </tr>
                )}
              </tbody>
            </table>

            {!page.isLastPage && (
              <div className="text-right text-[8.5pt] italic text-gray-600 font-medium">
                (Bersambung ke halaman berikutnya...)
              </div>
            )}

            {page.isLastPage && (
              <>
                {/* KETENTUAN */}
                <div className="mb-2 text-justify space-y-0.5 text-[9pt] leading-relaxed">
                  <p>
                    Untuk kelengkapan administrasi, diharapkan agar pada saat pengiriman barang dilengkapi dengan Faktur Harga Barang sebagaimana terlampir dengan ketentuan :
                  </p>
                  <ol className="list-decimal pl-5 space-y-0.5">
                    <li>
                      Harga barang pesanan kami tersebut akan dibayarkan setelah seluruh barang pesanan telah sampai ke alamat kami di Desa {desa.namaDesa} Kecamatan {desa.kecamatan} Kabupaten {desa.kabupaten} dan diterima dengan jumlah yang cukup serta dalam kondisi yang baik yang ditetapkan melalui pembuatan Berita Acara Pemeriksaan dan Serah Terima Barang.
                    </li>
                    <li>
                      Harga barang yang Saudara ajukan adalah harga barang ditambahkan dengan pajak PPn dan PPh dan seluruh pajak terkait dengan pembelian barang tersebut akan ditarik/diperpotong oleh Bendahara Desa pada saat pembayaran sesuai dengan ketentuan yang berlaku.
                    </li>
                    <li>
                      Seluruh ongkos angkutan barang dari tempat saudara sampai ke alamat kami menjadi tanggungjawab kami, diluar harga barang.
                    </li>
                  </ol>
                </div>

                <p className="mb-1.5 text-[9pt]">Demikian disampaikan atas kesediaannya kami ucapkan terima kasih.</p>

                {/* TANDA TANGAN & TEMBUSAN SEJAJAR */}
                <div className="flex justify-between items-end mt-3 break-inside-avoid print:break-inside-avoid">
                  {/* Kolom Kiri: Tembusan sejajar Nama Pelaksana Kegiatan */}
                  <div className="text-[8.5pt] leading-snug pb-0.5">
                    <div className="font-semibold">Tembusan :</div>
                    <div>Kepala Desa {desa.namaDesa}, sebagai laporan</div>
                  </div>

                  {/* Kolom Kanan: Pelaksana Kegiatan */}
                  <div className="w-60 text-center text-[9pt]">
                    <div>Pelaksana Kegiatan,</div>
                    <div className="h-14"></div>
                    <div className="font-bold underline uppercase">{spj.pelaksanaNama}</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
