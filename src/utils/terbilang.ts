/**
 * Konversi angka rupiah ke teks terbilang Bahasa Indonesia
 * Contoh: 52500000 -> "lima puluh dua juta lima ratus ribu rupiah"
 */
export function terbilang(nominal: number): string {
  if (isNaN(nominal)) return 'nol rupiah';
  const angka = Math.floor(Math.abs(nominal));
  if (angka === 0) return 'nol rupiah';

  const bilangan = [
    '',
    'satu',
    'dua',
    'tiga',
    'empat',
    'lima',
    'enam',
    'tujuh',
    'delapan',
    'sembilan',
    'sepuluh',
    'sebelas',
  ];

  function sebut(n: number): string {
    if (n < 12) {
      return bilangan[n];
    } else if (n < 20) {
      return sebut(n - 10) + ' belas';
    } else if (n < 100) {
      return (
        sebut(Math.floor(n / 10)) +
        ' puluh' +
        (n % 10 !== 0 ? ' ' + sebut(n % 10) : '')
      );
    } else if (n < 200) {
      return 'seratus' + (n % 100 !== 0 ? ' ' + sebut(n % 100) : '');
    } else if (n < 1000) {
      return (
        sebut(Math.floor(n / 100)) +
        ' ratus' +
        (n % 100 !== 0 ? ' ' + sebut(n % 100) : '')
      );
    } else if (n < 2000) {
      return 'seribu' + (n % 1000 !== 0 ? ' ' + sebut(n % 1000) : '');
    } else if (n < 1000000) {
      return (
        sebut(Math.floor(n / 1000)) +
        ' ribu' +
        (n % 1000 !== 0 ? ' ' + sebut(n % 1000) : '')
      );
    } else if (n < 1000000000) {
      return (
        sebut(Math.floor(n / 1000000)) +
        ' juta' +
        (n % 1000000 !== 0 ? ' ' + sebut(n % 1000000) : '')
      );
    } else if (n < 1000000000000) {
      return (
        sebut(Math.floor(n / 1000000000)) +
        ' miliar' +
        (n % 1000000000 !== 0 ? ' ' + sebut(n % 1000000000) : '')
      );
    } else {
      return (
        sebut(Math.floor(n / 1000000000000)) +
        ' triliun' +
        (n % 1000000000000 !== 0 ? ' ' + sebut(n % 1000000000000) : '')
      );
    }
  }

  const hasil = sebut(angka).trim().replace(/\s+/g, ' ');
  return `${hasil} rupiah`;
}

export function formatRupiah(nominal: number): string {
  if (isNaN(nominal)) return '0';
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(nominal));
}

/**
 * Format angka dengan pemisah ribuan (titik) untuk kuantitas/volume barang
 * Contoh: 1000 -> "1.000", 2500 -> "2.500"
 */
export function formatRibuan(val: number | string | undefined | null): string {
  if (val === undefined || val === null || val === '') return '0';
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, '.'));
  if (isNaN(num)) return String(val);
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 2,
  }).format(num);
}

