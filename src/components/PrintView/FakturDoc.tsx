import React from 'react';
import { SpjDocument, DesaProfile, SpjItem } from '../../types';
import { formatTanggalIndonesia } from '../../utils/dateHelper';
import { terbilang, formatRupiah, formatRibuan } from '../../utils/terbilang';

interface DocProps {
  spj: SpjDocument;
  desa: DesaProfile;
}

interface FakturPageData {
  pageNumber: number;
  totalPages: number;
  items: Array<{ item: SpjItem; originalIndex: number }>;
  isFirstPage: boolean;
  isLastPage: boolean;
}

function paginateFakturItems(items: SpjItem[]): FakturPageData[] {
  const total = items.length;

  // Single page: dengan tinggi baris ringkas, hingga 14 item muat dalam 1 lembar Folio bersama rincian pajak, terbilang, dan tanda tangan
  if (total <= 14) {
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
  const pages: FakturPageData[] = [];
  const indexedItems = items.map((item, idx) => ({ item, originalIndex: idx }));

  if (total <= 30) {
    let page1Count = Math.min(20, Math.max(10, total - 6));
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

  // Untuk total > 30:
  let cursor = 0;
  const p1Count = 20;
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

export const FakturDoc: React.FC<DocProps> = ({ spj, desa }) => {
  const tanggalFakturIndo = formatTanggalIndonesia(spj.tanggalFaktur);
  const teksTerbilang = terbilang(spj.totalBelanja);

  const rawItems = spj.items && spj.items.length > 0 ? spj.items : [];
  const pages = paginateFakturItems(rawItems);

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
                {/* HEADER PENYEDIA / BON */}
                <div className="flex justify-between items-start pb-1.5 mb-2.5">
                  {/* Nama Perusahaan / Rekanan */}
                  <div className="w-[55%]">
                    <h1 className="text-2xl font-extrabold uppercase tracking-wider text-black">
                      {spj.penyedia.namaPerusahaan}
                    </h1>
                    <p className="italic text-[9.5pt] text-gray-800 mt-0.5">
                      Alamat : {spj.penyedia.alamat}
                    </p>
                    {spj.penyedia.noTelepon && (
                      <p className="text-[8.5pt] text-gray-700">Telp/HP: {spj.penyedia.noTelepon}</p>
                    )}
                  </div>

                  {/* Tanggal & Tujuan */}
                  <div className="w-[45%] text-left pl-8 text-[9.5pt]">
                    <div className="mb-1">
                      {spj.penyedia.kota || spj.penyedia.alamat}, {tanggalFakturIndo}
                    </div>
                    <div>Kepada yth :</div>
                    <div>Sdra. Pelaksana Kegiatan</div>
                    <div>di</div>
                    <div className="pl-6 font-semibold">{desa.namaDesa}</div>
                  </div>
                </div>

                {/* JUDUL FAKTUR TEPAT DI ATAS TABEL BARANG */}
                <div className="mb-1 text-left">
                  <h2 className="font-bold text-[11pt] tracking-wider uppercase">
                    BON / FAKTUR
                  </h2>
                </div>
              </>
            ) : (
              /* HEADER LANJUTAN FAKTUR */
              <div className="flex justify-between items-center mb-2.5 pb-1.5 border-b border-black text-[9.5pt]">
                <div>
                  <h2 className="font-bold text-[10.5pt] tracking-wider uppercase">
                    BON / FAKTUR (LANJUTAN)
                  </h2>
                  <div className="text-[8.5pt] text-gray-700 italic">
                    {spj.penyedia.namaPerusahaan} &bull; Kegiatan : {spj.namaKegiatan}
                  </div>
                </div>
                <div className="text-[8.5pt] font-mono font-medium">
                  Halaman {page.pageNumber} dari {page.totalPages}
                </div>
              </div>
            )}

            {/* TABEL BARANG DENGAN TINGGI BARIS RINGKAS */}
            <table className="w-full border-collapse border border-black mb-2 text-[9pt] leading-snug">
              <thead className="table-header-group print:table-header-group bg-slate-100/60">
                <tr className="border-b border-black text-center font-bold">
                  <th className="border-r border-black py-1 px-1.5 w-20">Banyaknya</th>
                  <th className="border-r border-black py-1 px-1.5 text-left">Nama dan Spesifikasi Barang</th>
                  <th className="border-r border-black py-1 px-1.5 w-28 text-right">Harga Satuan</th>
                  <th className="border-r border-black py-1 px-1.5 w-32 text-right">Jumlah Harga</th>
                  <th className="py-1 px-1.5 w-14">Ket</th>
                </tr>
              </thead>
              <tbody>
                {page.items.map(({ item, originalIndex }) => (
                  <tr key={item.id || originalIndex} className="break-inside-avoid print:break-inside-avoid">
                    <td className="border-r border-black py-1 px-1.5 text-center align-top whitespace-nowrap">
                      {formatRibuan(item.volume)} {item.satuan}
                    </td>
                    <td className="border-r border-black py-1 px-1.5 align-top">{item.nama}</td>
                    <td className="border-r border-black py-1 px-1.5 text-right align-top whitespace-nowrap">
                      {formatRupiah(item.hargaSatuan)}
                    </td>
                    <td className="border-r border-black py-1 px-1.5 text-right align-top whitespace-nowrap font-medium">
                      {formatRupiah(item.jumlahHarga)}
                    </td>
                    <td className="py-1 px-1.5 text-center align-top"></td>
                  </tr>
                ))}

                {page.isLastPage && (
                  <>
                    {page.items.length < 8 && (
                      <tr className="h-6">
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td className="border-r border-black"></td>
                        <td></td>
                      </tr>
                    )}

                    {/* JUMLAH HARGA ROW */}
                    <tr className="border-t border-b border-black font-bold">
                      <td colSpan={3} className="border-r border-black py-1 px-1.5 text-right">
                        Jumlah Harga
                      </td>
                      <td className="border-r border-black py-1 px-1.5 text-right whitespace-nowrap">
                        {formatRupiah(spj.totalBelanja)}
                      </td>
                      <td></td>
                    </tr>

                    {/* PAJAK - PPN */}
                    {spj.pajak.ppnAktif && (
                      <tr className="border-b border-black">
                        <td colSpan={3} className="border-r border-black py-0.5 px-1.5 text-right font-medium">
                          PPN {spj.pajak.ppnPersen > 0 ? `(${spj.pajak.ppnPersen}%)` : ''}
                        </td>
                        <td className="border-r border-black py-0.5 px-1.5 text-right whitespace-nowrap">
                          {formatRupiah(spj.pajak.ppnNominal)}
                        </td>
                        <td></td>
                      </tr>
                    )}

                    {/* PAJAK - PPh 22 */}
                    {spj.pajak.pph22Aktif && (
                      <tr className="border-b border-black">
                        <td colSpan={3} className="border-r border-black py-0.5 px-1.5 text-right font-medium">
                          PPh 22 {spj.pajak.pph22Persen > 0 ? `(${spj.pajak.pph22Persen}%)` : ''}
                        </td>
                        <td className="border-r border-black py-0.5 px-1.5 text-right whitespace-nowrap">
                          {formatRupiah(spj.pajak.pph22Nominal)}
                        </td>
                        <td></td>
                      </tr>
                    )}

                    {/* PAJAK - PPh 23 */}
                    {spj.pajak.pph23Aktif && (
                      <tr className="border-b border-black">
                        <td colSpan={3} className="border-r border-black py-0.5 px-1.5 text-right font-medium">
                          PPh 23 {spj.pajak.pph23Persen > 0 ? `(${spj.pajak.pph23Persen}%)` : ''}
                        </td>
                        <td className="border-r border-black py-0.5 px-1.5 text-right whitespace-nowrap">
                          {formatRupiah(spj.pajak.pph23Nominal)}
                        </td>
                        <td></td>
                      </tr>
                    )}

                    {/* PAJAK - PHR */}
                    {spj.pajak.phrAktif && (
                      <tr className="border-b border-black">
                        <td colSpan={3} className="border-r border-black py-0.5 px-1.5 text-right font-medium">
                          PHR {spj.pajak.phrPersen > 0 ? `(${spj.pajak.phrPersen}%)` : ''}
                        </td>
                        <td className="border-r border-black py-0.5 px-1.5 text-right whitespace-nowrap">
                          {formatRupiah(spj.pajak.phrNominal)}
                        </td>
                        <td></td>
                      </tr>
                    )}

                    {/* Custom Pajak */}
                    {spj.pajak.customPajak &&
                      spj.pajak.customPajak.map((c) => (
                        <tr key={c.id} className="border-b border-black">
                          <td colSpan={3} className="border-r border-black py-0.5 px-1.5 text-right font-medium">
                            {c.nama} {c.keterangan ? `(${c.keterangan})` : ''}
                          </td>
                          <td className="border-r border-black py-0.5 px-1.5 text-right whitespace-nowrap">
                            {formatRupiah(c.nominal)}
                          </td>
                          <td></td>
                        </tr>
                      ))}

                    {/* JUMLAH DIBAYARKAN ROW */}
                    <tr className="border-t-2 border-black font-bold bg-gray-50/50">
                      <td colSpan={3} className="border-r border-black py-1 px-1.5 text-right text-[9.5pt]">
                        Jumlah Dibayarkan
                      </td>
                      <td className="border-r border-black py-1 px-1.5 text-right whitespace-nowrap text-[9.5pt]">
                        {formatRupiah(spj.jumlahDibayarkan)}
                      </td>
                      <td></td>
                    </tr>
                  </>
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
                {/* TERBILANG */}
                <div className="mb-2 p-1.5 border border-black/30 rounded-sm text-[9pt] bg-slate-50/40">
                  <span className="font-semibold">Terbilang :</span>
                  <div className="italic font-medium capitalize pl-2">
                    ( {teksTerbilang} )
                  </div>
                </div>

                {/* DITERIMA DI & TANGGAL */}
                <div className="mt-2.5 mb-1.5 text-[9pt] space-y-0.5">
                  <div className="grid grid-cols-[110px_10px_1fr]">
                    <span>Diterima di</span>
                    <span>:</span>
                    <span className="font-medium">Desa {desa.namaDesa}</span>
                  </div>
                  <div className="grid grid-cols-[110px_10px_1fr]">
                    <span>Pada tanggal</span>
                    <span>:</span>
                    <span>{tanggalFakturIndo}</span>
                  </div>
                </div>

                {/* TANDA TANGAN 2 KOLOM */}
                <div className="flex justify-between items-start text-center text-[9pt] mt-3 break-inside-avoid print:break-inside-avoid">
                  {/* Diterima oleh */}
                  <div className="w-60">
                    <div>Diterima oleh :</div>
                    <div className="font-medium">Pelaksana Kegiatan,</div>
                    <div className="h-14"></div>
                    <div className="font-bold underline uppercase">{spj.pelaksanaNama}</div>
                  </div>

                  {/* Diserahkan oleh */}
                  <div className="w-60">
                    <div>Diserahkan oleh :</div>
                    <div className="font-medium">Pengusaha / Penyedia Barang,</div>
                    <div className="h-14"></div>
                    <div className="font-bold underline uppercase">{spj.penyedia.pimpinan}</div>
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
