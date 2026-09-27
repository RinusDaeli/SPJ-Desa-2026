const BULAN_INDONESIA = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const HARI_INDONESIA = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

/**
 * Format string tanggal (ISO YYYY-MM-DD atau Date) menjadi format resmi Indonesia: "16 Juni 2026"
 */
export function formatTanggalIndonesia(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '';

  let d: Date;
  if (typeof dateInput === 'string') {
    // If already in "Dd Mmmm Yyyy", return as is
    if (/^\d{1,2}\s+[A-Za-z]+\s+\d{4}$/.test(dateInput.trim())) {
      return dateInput.trim();
    }
    // Try parsing ISO
    const parts = dateInput.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      d = new Date(year, month, day);
    } else {
      d = new Date(dateInput);
    }
  } else {
    d = dateInput;
  }

  if (isNaN(d.getTime())) return String(dateInput);

  const day = d.getDate();
  const monthName = BULAN_INDONESIA[d.getMonth()];
  const year = d.getFullYear();

  return `${day} ${monthName} ${year}`;
}

/**
 * Mendapatkan nama hari dalam Bahasa Indonesia dari tanggal (misal: "Selasa")
 */
export function getNamaHariIndonesia(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return 'Selasa';

  let d: Date;
  if (typeof dateInput === 'string') {
    const parts = dateInput.split('-');
    if (parts.length === 3) {
      d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      d = new Date(dateInput);
    }
  } else {
    d = dateInput;
  }

  if (isNaN(d.getTime())) return 'Selasa';
  return HARI_INDONESIA[d.getDay()];
}

/**
 * Konversi Date object ke ISO format YYYY-MM-DD untuk input type="date"
 */
export function toIsoDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Ambil tanggal kemarin dalam format ISO
 */
export function getYesterdayIso(isoDateString?: string): string {
  const d = isoDateString ? new Date(isoDateString) : new Date();
  if (isNaN(d.getTime())) return toIsoDate();
  d.setDate(d.getDate() - 1);
  return toIsoDate(d);
}

/**
 * Format nama resmi Sumber Dana lengkap
 */
export function formatSumberDanaLengkap(sd: string | undefined): string {
  if (!sd) return 'Dana Desa (DDS)';
  switch (sd) {
    case 'ADD':
      return 'Alokasi Dana Desa (ADD)';
    case 'DDS':
    case 'DD':
      return 'Dana Desa (DDS)';
    case 'PBH':
      return 'Pendapatan Dana Bagi Hasil (PBH)';
    case 'PAD':
      return 'Pendapatan Asli Desa (PAD)';
    case 'DLL':
      return 'Pendapatan Lain-lain (DLL)';
    default:
      return sd;
  }
}

export { BULAN_INDONESIA, HARI_INDONESIA };
