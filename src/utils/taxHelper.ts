import { DataPajak, KategoriBelanja } from '../types';

/**
 * Menghitung Dasar Pengenaan Pajak (DPP) untuk barang inklusif PPN
 * DPP = (100 / 111) * totalBelanja (dibulatkan ke bawah sesuai standar DJP / contoh Klikpajak)
 */
export function hitungDppBarang(totalBelanja: number): number {
  if (totalBelanja <= 0) return 0;
  return Math.floor((100 / 111) * totalBelanja);
}

/**
 * Menghitung PPN 11% dari DPP
 * PPN = 11% * DPP (atau selisih total belanja dikurangi DPP, contoh 15.000.000 -> 1.486.487)
 */
export function hitungPpnBarang(dpp: number, totalBelanja?: number): number {
  if (dpp <= 0) return 0;
  if (totalBelanja !== undefined && totalBelanja > 0) {
    return totalBelanja - dpp;
  }
  return Math.round(0.11 * dpp);
}

/**
 * Menghitung PPh Pasal 22 (1.5% dari DPP barang)
 * PPh 22 = 1.5% * DPP (contoh DPP 13.513.513 -> 202.703)
 */
export function hitungPph22Barang(dpp: number): number {
  if (dpp <= 0) return 0;
  return Math.round(0.015 * dpp);
}

/**
 * Menghitung pajak default berdasarkan kategori belanja dan total nominal belanja
 * Aturan:
 * 1. Barang umum: PPN dan PPh 22 BARU AKTIF jika nilai belanja LEBIH DARI 2.000.000 (> 2.000.000).
 *    Jika <= 2.000.000, bebas pajak (PPN & PPh = 0).
 *    Rumus PPN & PPh 22:
 *    DPP = 100/111 * Nilai Belanja
 *    PPN = 11% * DPP
 *    PPh 22 = 1.5% * DPP
 * 2. Makanan dan Minuman: Pajak yang dipotong adalah PHR (10%) dan PPh 23 (2%) dari total belanja.
 *    PPN dan PPh 22 = 0.
 * 3. Sewa: PPh 23 (2%) dari total belanja.
 */
export function hitungPajakOtomatis(
  kategori: KategoriBelanja,
  totalBelanja: number,
  currentPajak?: Partial<DataPajak>,
  forceRecalculate: boolean = false
): DataPajak {
  const result: DataPajak = {
    ppnAktif: false,
    ppnPersen: currentPajak?.ppnPersen ?? 11,
    ppnNominal: 0,
    ppnIsManual: forceRecalculate ? false : (currentPajak?.ppnIsManual ?? false),

    pph22Aktif: false,
    pph22Persen: currentPajak?.pph22Persen ?? 1.5,
    pph22Nominal: 0,
    pph22IsManual: forceRecalculate ? false : (currentPajak?.pph22IsManual ?? false),

    pph23Aktif: false,
    pph23Persen: currentPajak?.pph23Persen ?? 2,
    pph23Nominal: 0,
    pph23IsManual: forceRecalculate ? false : (currentPajak?.pph23IsManual ?? false),

    phrAktif: false,
    phrPersen: currentPajak?.phrPersen ?? 10,
    phrNominal: 0,
    phrIsManual: forceRecalculate ? false : (currentPajak?.phrIsManual ?? false),

    customPajak: currentPajak?.customPajak ?? [],
  };

  if (kategori === 'makanan_minuman') {
    // Khusus Makanan dan Minuman: Pajak yang dipotong adalah PHR (10%) dan PPh 23 (2%) dari Total Belanja
    result.phrAktif = true;
    result.pph23Aktif = true;
    result.ppnAktif = false;
    result.pph22Aktif = false;

    // Hitung PHR (10%)
    if (!forceRecalculate && currentPajak?.phrIsManual && currentPajak.phrNominal !== undefined) {
      result.phrNominal = currentPajak.phrNominal;
    } else {
      result.phrNominal = Math.round((result.phrPersen / 100) * totalBelanja);
    }

    // Hitung PPh 23 (2%)
    if (!forceRecalculate && currentPajak?.pph23IsManual && currentPajak.pph23Nominal !== undefined) {
      result.pph23Nominal = currentPajak.pph23Nominal;
    } else {
      result.pph23Nominal = Math.round((result.pph23Persen / 100) * totalBelanja);
    }
  } else if (kategori === 'barang') {
    // Barang umum: PPN dan PPh 22 baru aktif jika nilai belanja LEBIH DARI 2.000.000 (> 2.000.000)
    const isAboveTwoMillion = totalBelanja > 2000000;

    result.pph23Aktif = false;
    result.phrAktif = false;

    if (isAboveTwoMillion) {
      result.ppnAktif = true;
      result.pph22Aktif = true;

      const dpp = hitungDppBarang(totalBelanja);

      // Hitung PPN (11% dari DPP)
      if (!forceRecalculate && currentPajak?.ppnIsManual && currentPajak.ppnNominal !== undefined) {
        result.ppnNominal = currentPajak.ppnNominal;
      } else {
        result.ppnNominal = hitungPpnBarang(dpp, totalBelanja);
      }

      // Hitung PPh 22 (1.5% dari DPP)
      if (!forceRecalculate && currentPajak?.pph22IsManual && currentPajak.pph22Nominal !== undefined) {
        result.pph22Nominal = currentPajak.pph22Nominal;
      } else {
        result.pph22Nominal = hitungPph22Barang(dpp);
      }
    } else {
      // Nilai <= 2.000.000 bebas PPN dan PPh 22
      result.ppnAktif = false;
      result.ppnNominal = 0;
      result.pph22Aktif = false;
      result.pph22Nominal = 0;
    }
  } else if (kategori === 'sewa') {
    // Sewa: PPh 23 (2% dari total belanja)
    result.pph23Aktif = true;
    result.ppnAktif = false;
    result.pph22Aktif = false;
    result.phrAktif = false;

    if (!forceRecalculate && currentPajak?.pph23IsManual && currentPajak.pph23Nominal !== undefined) {
      result.pph23Nominal = currentPajak.pph23Nominal;
    } else {
      result.pph23Nominal = Math.round((result.pph23Persen / 100) * totalBelanja);
    }
  }

  return result;
}

/**
 * Menghitung total semua potongan pajak yang aktif
 */
export function hitungTotalPajak(pajak: DataPajak): number {
  let total = 0;
  if (pajak.ppnAktif) total += pajak.ppnNominal || 0;
  if (pajak.pph22Aktif) total += pajak.pph22Nominal || 0;
  if (pajak.pph23Aktif) total += pajak.pph23Nominal || 0;
  if (pajak.phrAktif) total += pajak.phrNominal || 0;

  if (pajak.customPajak && pajak.customPajak.length > 0) {
    for (const c of pajak.customPajak) {
      total += c.nominal || 0;
    }
  }

  return total;
}
