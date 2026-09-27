export type Role = 'admin' | 'desa';

export interface UserAccount {
  id: string;
  username: string;
  password?: string;
  role: Role;
  nama: string;
  desaId?: string; // If role === 'desa'
}

export interface PejabatDesa {
  nama: string;
  nip?: string;
  jabatan: string;
}

export interface DesaProfile {
  id: string;
  namaDesa: string;
  kodeDesa: string; // e.g. "FDR"
  kecamatan: string; // e.g. "Sirombu"
  kabupaten: string; // e.g. "Nias Barat"
  provinsi: string; // e.g. "Sumatera Utara"
  alamatKantor: string;
  logoUrl?: string; // Base64 or custom URL
  
  kepalaDesa: PejabatDesa; // e.g. TAROMALIMO ZIDUHU MARUNDURI, NIP: 19860117 201503 1 001
  sekretarisDesa: PejabatDesa; // e.g. SIBARIS HIA, Plt. Sekretaris Desa
  bendaharaDesa: PejabatDesa; // e.g. YULIANUS GULO, Bendahara Desa
  pelaksanaADD: PejabatDesa; // e.g. YAITORO HIA, Pelaksana Kegiatan ADD
  pelaksanaDDS: PejabatDesa; // e.g. YAITORO HIA, Kaur Pembangunan / Pelaksana Kegiatan DD
}

export type SumberDana = 'ADD' | 'DDS' | 'PBH' | 'PAD' | 'DLL' | 'DD' | 'Lainnya';
export type KategoriBelanja = 'barang' | 'makanan_minuman' | 'sewa';

export interface SpjItem {
  id: string;
  nama: string;
  spesifikasi?: string;
  volume: number;
  satuan: string;
  hargaSatuan: number;
  jumlahHarga: number;
  kondisiBaik?: number;
  kondisiRusak?: number;
  keterangan?: string;
}

export interface CustomPajakItem {
  id: string;
  nama: string;
  persen?: number;
  nominal: number;
  keterangan?: string;
}

export interface DataPajak {
  // PPN
  ppnAktif: boolean;
  ppnPersen: number; // default 11
  ppnNominal: number;
  ppnIsManual?: boolean;

  // PPh 22 (Barang > 2.000.000)
  pph22Aktif: boolean;
  pph22Persen: number; // default 1.5
  pph22Nominal: number;
  pph22IsManual?: boolean;

  // PPh 23 (Jasa/Sewa or Makan Minum 2%)
  pph23Aktif: boolean;
  pph23Persen: number; // default 2
  pph23Nominal: number;
  pph23IsManual?: boolean;

  // PHR / PBJT Makanan Minuman (10%)
  phrAktif: boolean;
  phrPersen: number; // default 10
  phrNominal: number;
  phrIsManual?: boolean;

  // Additional custom taxes
  customPajak: CustomPajakItem[];
}

export interface MasterRekanan {
  id: string;
  namaPerusahaan: string; // e.g. "UD. NIAT"
  pimpinan: string; // e.g. "HADRIANUS DAELI"
  jabatan: string; // e.g. "Pimpinan UD. NIAT"
  alamat: string; // e.g. "Balogawu, Kecamatan Sirombu"
  kota: string; // e.g. "Balogawu"
  noTelepon?: string;
  desaId?: string;
}

export interface MasterBarang {
  id: string;
  nama: string; // e.g. "Laptop Asus Core i5"
  satuan: string; // e.g. "unit", "kotak", "buah"
  hargaSatuan: number; // e.g. 17500000
  kategori: KategoriBelanja; // 'barang' | 'makanan_minuman' | 'sewa'
  keterangan?: string;
  desaId?: string;
}

export interface RekananPenyedia {
  id?: string;
  namaPerusahaan: string; // e.g. "UD. NIAT"
  pimpinan: string; // e.g. "HADRIANUS DAELI"
  jabatan: string; // e.g. "Pimpinan UD. NIAT"
  alamat: string; // e.g. "Balogawu, Kecamatan Sirombu"
  kota: string; // e.g. "Balogawu"
  noTelepon?: string;
}

export interface PesertaHadir {
  id: string;
  no: number;
  nama: string;
  jabatan: string;
  alamatInstansi?: string;
}

export interface SpjDocument {
  id: string;
  desaId: string;
  nomorSuratPesanan: string; // e.g. "400/ ...... /DS.FDR/2026"
  tanggalSuratPesanan: string; // ISO date e.g. "2026-06-15"
  sifatSurat: string; // "Penting"
  lampiranSurat: string; // "1 (satu) lembar"
  perihalSurat: string; // "Pesanan"
  
  nomorFaktur: string; // e.g. ""
  tanggalFaktur: string; // ISO date e.g. "2026-06-16"
  
  nomorBAST: string; // e.g. "400/ ...... /BA.DS.FDR/DDS/2026"
  tanggalBAST: string; // Equal to tanggalFaktur by default
  hariBAST?: string; // "Selasa"
  
  sumberDana: SumberDana;
  tahunAnggaran: string; // "2026"
  namaKegiatan: string; // e.g. "Pengelolaan dan Pembuatan Jaringan/Instalasi Digital Desa"
  kategoriBelanja: KategoriBelanja;
  
  pelaksanaNama: string;
  pelaksanaJabatan: string; // "Pelaksana Kegiatan ADD" or "Pelaksana Kegiatan DDS"
  
  penyedia: RekananPenyedia;
  items: SpjItem[];
  pajak: DataPajak;
  
  totalBelanja: number;
  totalPajak: number;
  jumlahDibayarkan: number;
  
  // Khusus Makanan dan Minuman
  daftarHadir: PesertaHadir[];
  daftarHadirJudul?: string;
  daftarHadirTempat?: string;
  
  createdAt: string;
  updatedAt: string;
}
