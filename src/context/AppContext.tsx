import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  DesaProfile,
  UserAccount,
  SpjDocument,
  Role,
  MasterRekanan,
  MasterBarang,
} from '../types';
import {
  testConnection,
  uploadDesaToCloud,
  downloadDesaFromCloud,
  uploadAllToCloud,
  downloadAllFromCloud,
  getCloudDesasSummary,
  CloudDesaSummary,
  subscribeToSpjs,
  subscribeToDesas,
  subscribeToRekanans,
  subscribeToBarangs,
  subscribeToUsers,
  saveSpjToCloud,
  deleteSpjFromCloud,
  saveDesaToCloud,
  deleteDesaFromCloud,
  saveRekananToCloud,
  deleteRekananFromCloud,
  saveBarangToCloud,
  deleteBarangFromCloud,
  saveUserToCloud,
  deleteUserFromCloud,
  bootstrapInitialCloudDataIfNeeded,
  syncAllMasterDataToCloud,
} from '../firebase/firebaseService';
import { FIREBASE_PROJECT_ID } from '../firebase/config';

interface AppContextType {
  currentUser: UserAccount | null;
  desas: DesaProfile[];
  users: UserAccount[];
  spjs: SpjDocument[];
  masterRekanans: MasterRekanan[];
  masterBarangs: MasterBarang[];
  activeDesaId: string;
  activeDesa: DesaProfile | undefined;
  setActiveDesaId: (id: string) => void;
  login: (username: string, pass: string) => { success: boolean; message?: string };
  logout: () => void;

  // Desa Management
  addDesa: (desa: Omit<DesaProfile, 'id'>) => string;
  updateDesa: (desa: DesaProfile) => void;
  deleteDesa: (id: string) => boolean;

  // User Management
  addUser: (user: Omit<UserAccount, 'id'>) => void;
  updateUser: (user: UserAccount) => void;
  deleteUser: (id: string) => boolean;

  // Master Rekanan Management
  addMasterRekanan: (rekanan: Omit<MasterRekanan, 'id'>) => string;
  updateMasterRekanan: (rekanan: MasterRekanan) => void;
  deleteMasterRekanan: (id: string) => void;

  // Master Barang Management
  addMasterBarang: (barang: Omit<MasterBarang, 'id'>) => string;
  updateMasterBarang: (barang: MasterBarang) => void;
  deleteMasterBarang: (id: string) => void;

  // SPJ Management
  addSpj: (spj: Omit<SpjDocument, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateSpj: (spj: SpjDocument) => void;
  deleteSpj: (id: string) => void;
  duplicateSpj: (id: string) => string | null;

  // Backup & Restore Global (Semua Desa)
  exportBackup: () => void;
  importBackup: (file: File) => Promise<{ success: boolean; message: string }>;
  resetToDefault: () => void;

  // Backup & Restore File Per Desa (Khusus Desa Terpilih, desa lain tidak terganggu)
  exportDesaBackup: (desaId: string) => void;
  importDesaBackup: (file: File) => Promise<{ success: boolean; message: string; desaNama?: string }>;

  // Cloud Firebase Status & Operations
  isCloudOnline: boolean;
  isSyncing: boolean;
  cloudLastSync: string | null;
  firebaseProjectId: string;
  checkCloudConnection: () => Promise<boolean>;
  syncMasterDataCloud: () => Promise<{ success: boolean; message: string }>;
  uploadDesaCloud: (desaId: string) => Promise<{ success: boolean; message: string }>;
  downloadDesaCloud: (desaId: string) => Promise<{ success: boolean; message: string }>;
  uploadAllCloud: () => Promise<{ success: boolean; message: string }>;
  downloadAllCloud: () => Promise<{ success: boolean; message: string }>;
  fetchCloudSummary: () => Promise<CloudDesaSummary[]>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY_DESAS = 'e_spj_desas_v2';
const STORAGE_KEY_USERS = 'e_spj_users_v2';
const STORAGE_KEY_SPJS = 'e_spj_documents_v2';
const STORAGE_KEY_AUTH = 'e_spj_auth_user_v2';
const STORAGE_KEY_SESSION_EXPIRES = 'e_spj_session_expires_v2';
const STORAGE_KEY_ACTIVE_DESA = 'e_spj_active_desa_v2';
const STORAGE_KEY_REKANANS = 'e_spj_rekanans_v2';
const STORAGE_KEY_BARANGS = 'e_spj_barangs_v2';
const STORAGE_KEY_LAST_SYNC = 'e_spj_last_cloud_sync_v2';

const SESSION_DURATION_MS = 60 * 60 * 1000;

const DEFAULT_DESAS: DesaProfile[] = [
  {
    id: 'desa-fadoro',
    namaDesa: 'Fadoro',
    kodeDesa: 'FDR',
    kecamatan: 'Sirombu',
    kabupaten: 'Nias Barat',
    provinsi: 'Sumatera Utara',
    alamatKantor: 'Desa Fadoro Kecamatan Sirombu',
    kepalaDesa: {
      nama: 'TAROMALIMO ZIDUHU MARUNDURI',
      nip: '19860117 201503 1 001',
      jabatan: 'Pj. Kepala Desa',
    },
    sekretarisDesa: {
      nama: 'SIBARIS HIA',
      jabatan: 'Plt. Sekretaris Desa',
    },
    bendaharaDesa: {
      nama: 'YULIANUS GULO',
      jabatan: 'Bendahara Desa',
    },
    pelaksanaADD: {
      nama: 'YAITORO HIA',
      jabatan: 'Pelaksana Kegiatan ADD',
    },
    pelaksanaDDS: {
      nama: 'YAITORO HIA',
      jabatan: 'Kaur Pembangunan / Pelaksana Kegiatan DD',
    },
  },
  {
    id: 'desa-lahomi',
    namaDesa: 'Lahomi',
    kodeDesa: 'LHM',
    kecamatan: 'Lahomi',
    kabupaten: 'Nias Barat',
    provinsi: 'Sumatera Utara',
    alamatKantor: 'Desa Lahomi Kecamatan Lahomi',
    kepalaDesa: {
      nama: 'BAZIDUHU DAELI',
      nip: '19790512 200801 1 005',
      jabatan: 'Pj. Kepala Desa',
    },
    sekretarisDesa: {
      nama: 'FAANASO MARUNDURI',
      jabatan: 'Sekretaris Desa',
    },
    bendaharaDesa: {
      nama: 'MARTINA HIA',
      jabatan: 'Bendahara Desa',
    },
    pelaksanaADD: {
      nama: 'BERKAT DAELI',
      jabatan: 'Pelaksana Kegiatan ADD',
    },
    pelaksanaDDS: {
      nama: 'BERKAT DAELI',
      jabatan: 'Pelaksana Kegiatan DDS',
    },
  },
];

const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'user-admin',
    username: 'admin',
    password: '123',
    role: 'admin',
    nama: 'Administrator Kabupaten',
  },
  {
    id: 'user-admin-rinus',
    username: 'rinus',
    password: 'EltaX251016',
    role: 'admin',
    nama: 'Hadrianus Daeli (Administrator)',
  },
  {
    id: 'user-fadoro',
    username: 'desafadoro',
    password: '123',
    role: 'desa',
    nama: 'Kaur / Operator Desa Fadoro',
    desaId: 'desa-fadoro',
  },
  {
    id: 'user-lahomi',
    username: 'desalahomi',
    password: '123',
    role: 'desa',
    nama: 'Operator Desa Lahomi',
    desaId: 'desa-lahomi',
  },
];

const DEFAULT_REKANANS: MasterRekanan[] = [
  {
    id: 'rek-1',
    namaPerusahaan: 'UD. NIAT',
    pimpinan: 'HADRIANUS DAELI',
    jabatan: 'Pimpinan UD. NIAT',
    alamat: 'Balogawu, Kecamatan Sirombu',
    kota: 'Balogawu',
    noTelepon: '081234567890',
  },
  {
    id: 'rek-2',
    namaPerusahaan: 'Toko Sirombu Elektronik & Komputer',
    pimpinan: 'YANTO HAREFA',
    jabatan: 'Pemilik Toko',
    alamat: 'Jl. Pelabuhan No. 12 Sirombu',
    kota: 'Sirombu',
    noTelepon: '082167891234',
  },
  {
    id: 'rek-3',
    namaPerusahaan: 'Katering Berkah Nusantara (Makan Minum)',
    pimpinan: 'SITI AMINAH',
    jabatan: 'Pengelola Katering',
    alamat: 'Desa Fadoro Kecamatan Sirombu',
    kota: 'Fadoro',
    noTelepon: '085278904321',
  },
  {
    id: 'rek-4',
    namaPerusahaan: 'Penyedia Sewa Tenda & Sound Hasambua',
    pimpinan: 'MEIMAN DAELI',
    jabatan: 'Pimpinan Usaha',
    alamat: 'Jl. Raya Mandrehe - Sirombu Km 3',
    kota: 'Nias Barat',
    noTelepon: '081398765432',
  },
];

const DEFAULT_BARANGS: MasterBarang[] = [
  {
    id: 'brg-1',
    nama: 'Laptop',
    satuan: 'unit',
    hargaSatuan: 17500000,
    kategori: 'barang',
    keterangan: 'Baik dan lengkap sesuai spesifikasi',
  },
  {
    id: 'brg-2',
    nama: 'Printer Epson All-in-One (Print, Scan, Copy)',
    satuan: 'unit',
    hargaSatuan: 3850000,
    kategori: 'barang',
    keterangan: 'Kondisi baru bergaransi',
  },
  {
    id: 'brg-3',
    nama: 'Proyektor Infocus + Layar Tripod',
    satuan: 'paket',
    hargaSatuan: 6500000,
    kategori: 'barang',
    keterangan: 'Kondisi baik dan berfungsi normal',
  },
  {
    id: 'brg-4',
    nama: 'Kertas HVS PaperOne A4 80gr',
    satuan: 'rim',
    hargaSatuan: 65000,
    kategori: 'barang',
    keterangan: 'Kondisi baik dan segel utuh',
  },
  {
    id: 'brg-5',
    nama: 'Meja Kerja Kantor 1/2 Biro Kayu Jati',
    satuan: 'unit',
    hargaSatuan: 1400000,
    kategori: 'barang',
    keterangan: 'Kondisi kokoh dan rapi',
  },
  {
    id: 'brg-6',
    nama: 'Kursi Putar Kerja Sekretariat Desa',
    satuan: 'unit',
    hargaSatuan: 750000,
    kategori: 'barang',
    keterangan: 'Kondisi baik dan lengkap',
  },
  {
    id: 'brg-7',
    nama: 'Nasi Kotak Lengkap (Ayam / Ikan + Sayur + Sambal) + Air Mineral',
    satuan: 'kotak',
    hargaSatuan: 40000,
    kategori: 'makanan_minuman',
    keterangan: 'Makanan segar dan higienis',
  },
  {
    id: 'brg-8',
    nama: 'Snack Kotak Kue Tradisional (3 Macam Kue + Air Mineral)',
    satuan: 'kotak',
    hargaSatuan: 15000,
    kategori: 'makanan_minuman',
    keterangan: 'Kondisi baik dan segar',
  },
  {
    id: 'brg-9',
    nama: 'Air Mineral Botol 600ml',
    satuan: 'dus',
    hargaSatuan: 55000,
    kategori: 'makanan_minuman',
    keterangan: 'Kemasan dus bersegel',
  },
  {
    id: 'brg-10',
    nama: 'Sewa Tenda Acara Pertemuan Desa (Ukuran 4x6 meter)',
    satuan: 'unit/hari',
    hargaSatuan: 450000,
    kategori: 'sewa',
    keterangan: 'Termasuk pasang dan bongkar',
  },
  {
    id: 'brg-11',
    nama: 'Sewa Sound System Lengkap + Mic Wireless',
    satuan: 'paket/hari',
    hargaSatuan: 1200000,
    kategori: 'sewa',
    keterangan: 'Termasuk operator sound',
  },
  {
    id: 'brg-12',
    nama: 'Sewa Kursi Plastik Acara',
    satuan: 'buah/hari',
    hargaSatuan: 4000,
    kategori: 'sewa',
    keterangan: 'Kursi dalam keadaan bersih dan kokoh',
  },
];

const DEFAULT_SPJS: SpjDocument[] = [
  {
    id: 'spj-fadoro-laptop-01',
    desaId: 'desa-fadoro',
    nomorSuratPesanan: '400/ ...... /DS.FDR/2026',
    tanggalSuratPesanan: '2026-06-15',
    sifatSurat: 'Penting',
    lampiranSurat: '1 (satu) lembar',
    perihalSurat: 'Pesanan',
    nomorFaktur: '',
    tanggalFaktur: '2026-06-16',
    nomorBAST: '400/ ...... /BA.DS.FDR/DDS/2026',
    tanggalBAST: '2026-06-16',
    hariBAST: 'Selasa',
    sumberDana: 'DDS',
    tahunAnggaran: '2026',
    namaKegiatan: '',
    kategoriBelanja: 'barang',
    pelaksanaNama: 'YAITORO HIA',
    pelaksanaJabatan: 'Kaur Pembangunan / Pelaksana Kegiatan DD',
    penyedia: {
      namaPerusahaan: 'UD. NIAT',
      pimpinan: 'HADRIANUS DAELI',
      jabatan: 'Pimpinan UD. NIAT',
      alamat: 'Balogawu, Kecamatan Sirombu',
      kota: 'Balogawu',
    },
    items: [
      {
        id: 'item-1',
        nama: '',
        volume: 0,
        satuan: '',
        hargaSatuan: 0,
        jumlahHarga: 0,
        kondisiBaik: 0,
        kondisiRusak: 0,
        keterangan: 'Seluruh Barang yang diterima berada dalam keadaan baik dan cukup',
      },
    ],
    pajak: {
      ppnAktif: false,
      ppnPersen: 11,
      ppnNominal: 0,
      pph22Aktif: false,
      pph22Persen: 1.5,
      pph22Nominal: 0,
      pph23Aktif: false,
      pph23Persen: 2,
      pph23Nominal: 0,
      phrAktif: false,
      phrPersen: 10,
      phrNominal: 0,
      customPajak: [],
    },
    totalBelanja: 0,
    totalPajak: 0,
    jumlahDibayarkan: 0,
    daftarHadir: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'spj-fadoro-mamin-02',
    desaId: 'desa-fadoro',
    nomorSuratPesanan: '400/ ...... /DS.FDR/2026',
    tanggalSuratPesanan: '2026-06-19',
    sifatSurat: 'Penting',
    lampiranSurat: '1 (satu) lembar',
    perihalSurat: 'Pesanan Konsumsi Rapat',
    nomorFaktur: '',
    tanggalFaktur: '2026-06-20',
    nomorBAST: '400/ ...... /BA.DS.FDR/ADD/2026',
    tanggalBAST: '2026-06-20',
    hariBAST: 'Sabtu',
    sumberDana: 'ADD',
    tahunAnggaran: '2026',
    namaKegiatan: 'Musyawarah Perencanaan Pembangunan Desa (Musrenbangdes)',
    kategoriBelanja: 'makanan_minuman',
    pelaksanaNama: 'YAITORO HIA',
    pelaksanaJabatan: 'Pelaksana Kegiatan ADD',
    penyedia: {
      namaPerusahaan: 'Katering Berkah Nusantara (Makan Minum)',
      pimpinan: 'SITI AMINAH',
      jabatan: 'Pengelola Katering',
      alamat: 'Desa Fadoro Kecamatan Sirombu',
      kota: 'Fadoro',
    },
    items: [
      {
        id: 'item-m1',
        nama: 'Nasi Kotak Lengkap (Ayam / Ikan + Sayur + Sambal) + Air Mineral',
        volume: 25,
        satuan: 'kotak',
        hargaSatuan: 40000,
        jumlahHarga: 1000000,
        kondisiBaik: 25,
        kondisiRusak: 0,
        keterangan: 'Makanan dalam kondisi baik dan layak',
      },
      {
        id: 'item-m2',
        nama: 'Snack Kotak Kue Tradisional (3 Macam Kue + Air Mineral)',
        volume: 25,
        satuan: 'kotak',
        hargaSatuan: 15000,
        jumlahHarga: 375000,
        kondisiBaik: 25,
        kondisiRusak: 0,
        keterangan: 'Snack dalam kondisi baik dan segar',
      },
    ],
    pajak: {
      ppnAktif: false,
      ppnPersen: 11,
      ppnNominal: 0,
      pph22Aktif: false,
      pph22Persen: 1.5,
      pph22Nominal: 0,
      pph23Aktif: true,
      pph23Persen: 2,
      pph23Nominal: 27500,
      phrAktif: true,
      phrPersen: 10,
      phrNominal: 137500,
      customPajak: [],
    },
    totalBelanja: 1375000,
    totalPajak: 165000,
    jumlahDibayarkan: 1210000,
    daftarHadirJudul: 'KEGIATAN : MUSYAWARAH PERENCANAAN PEMBANGUNAN DESA (MUSRENBANGDES)',
    daftarHadirTempat: 'Balai Pertemuan Desa Fadoro',
    daftarHadir: Array.from({ length: 25 }, (_, i) => ({
      id: `dh-${i + 1}`,
      no: i + 1,
      nama: '',
      jabatan: '',
      alamatInstansi: '',
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [desas, setDesas] = useState<DesaProfile[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DESAS);
      return stored ? JSON.parse(stored) : DEFAULT_DESAS;
    } catch {
      return DEFAULT_DESAS;
    }
  });

  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USERS);
      let list: UserAccount[] = stored ? JSON.parse(stored) : DEFAULT_USERS;
      // Pastikan akun admin 'rinus' selalu terdaftar dan terintegrasi
      const hasRinus = list.some((u) => u.username.toLowerCase() === 'rinus');
      if (!hasRinus) {
        list = [
          ...list,
          {
            id: 'user-admin-rinus',
            username: 'rinus',
            password: 'EltaX251016',
            role: 'admin',
            nama: 'Hadrianus Daeli (Administrator)',
          },
        ];
      }
      return list;
    } catch {
      return DEFAULT_USERS;
    }
  });

  const [spjs, setSpjs] = useState<SpjDocument[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SPJS);
      if (stored) {
        const parsed: SpjDocument[] = JSON.parse(stored);
        return parsed.map((item) => {
          if (
            item.id === 'spj-fadoro-laptop-01' &&
            item.namaKegiatan === 'Pengelolaan dan Pembuatan Jaringan/Instalasi Digital Desa'
          ) {
            return {
              ...item,
              namaKegiatan: '',
              items: [
                {
                  id: 'item-1',
                  nama: '',
                  volume: 0,
                  satuan: '',
                  hargaSatuan: 0,
                  jumlahHarga: 0,
                  kondisiBaik: 0,
                  kondisiRusak: 0,
                  keterangan: 'Seluruh Barang yang diterima berada dalam keadaan baik dan cukup',
                },
              ],
              totalBelanja: 0,
              totalPajak: 0,
              jumlahDibayarkan: 0,
            };
          }
          if (
            item.daftarHadirJudul &&
            item.daftarHadirJudul.toLowerCase().startsWith('daftar hadir')
          ) {
            const raw = (item.namaKegiatan || item.daftarHadirJudul).trim();
            const cleaned = raw
              .replace(/^Daftar Hadir (Kegiatan )?/i, '')
              .replace(/^Kegiatan\s*:?\s*/i, '')
              .trim();
            return {
              ...item,
              daftarHadirJudul: cleaned ? `KEGIATAN : ${cleaned.toUpperCase()}` : '',
            };
          }
          return item;
        });
      }
      return DEFAULT_SPJS;
    } catch {
      return DEFAULT_SPJS;
    }
  });

  const [masterRekanans, setMasterRekanans] = useState<MasterRekanan[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_REKANANS);
      return stored ? JSON.parse(stored) : DEFAULT_REKANANS;
    } catch {
      return DEFAULT_REKANANS;
    }
  });

  const [masterBarangs, setMasterBarangs] = useState<MasterBarang[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_BARANGS);
      return stored ? JSON.parse(stored) : DEFAULT_BARANGS;
    } catch {
      return DEFAULT_BARANGS;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AUTH);
      const expiresAt = localStorage.getItem(STORAGE_KEY_SESSION_EXPIRES);
      if (stored && expiresAt) {
        const expTime = parseInt(expiresAt, 10);
        if (Date.now() < expTime) {
          return JSON.parse(stored);
        } else {
          localStorage.removeItem(STORAGE_KEY_AUTH);
          localStorage.removeItem(STORAGE_KEY_SESSION_EXPIRES);
          return null;
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  const [activeDesaId, setActiveDesaIdState] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ACTIVE_DESA);
      return stored || 'desa-fadoro';
    } catch {
      return 'desa-fadoro';
    }
  });

  // Cloud status state
  const [isCloudOnline, setIsCloudOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [cloudLastSync, setCloudLastSync] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_LAST_SYNC) || null;
    } catch {
      return null;
    }
  });

  // Check cloud connection and setup real-time sync with Firebase on startup
  useEffect(() => {
    let mounted = true;

    testConnection().then(async (connected) => {
      if (!mounted) return;
      setIsCloudOnline(connected);
      if (connected) {
        // Inisialisasi awal ke Firestore jika di cloud masih kosong
        await bootstrapInitialCloudDataIfNeeded({
          desas,
          spjs,
          masterRekanans,
          masterBarangs,
          users,
        });
      }
    });

    // Real-time listener: Profil Desa
    const unsubDesas = subscribeToDesas((cloudDesas) => {
      if (!mounted) return;
      if (cloudDesas && cloudDesas.length > 0) {
        setDesas(cloudDesas);
        const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setCloudLastSync(timeNow);
      }
    });

    // Real-time listener: Dokumen SPJ
    const unsubSpjs = subscribeToSpjs((cloudSpjs) => {
      if (!mounted) return;
      if (cloudSpjs) {
        setSpjs(cloudSpjs);
        const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setCloudLastSync(timeNow);
      }
    });

    // Real-time listener: Master Rekanan (Katalog Bersama Semua Desa)
    const unsubRekanans = subscribeToRekanans((cloudRekanans) => {
      if (!mounted) return;
      if (cloudRekanans && cloudRekanans.length > 0) {
        setMasterRekanans((prevLocal) => {
          const cloudIds = new Set(cloudRekanans.map((r) => r.id));
          const missingInCloud = prevLocal.filter((r) => !cloudIds.has(r.id));
          if (missingInCloud.length > 0) {
            missingInCloud.forEach((r) => saveRekananToCloud(r).catch(() => {}));
            return [...cloudRekanans, ...missingInCloud];
          }
          return cloudRekanans;
        });
      } else if (cloudRekanans && cloudRekanans.length === 0) {
        // Jika Firestore master_rekanans masih kosong, inisialisasi dengan data rekanan lokal
        setMasterRekanans((current) => {
          if (current.length > 0) {
            current.forEach((r) => saveRekananToCloud(r).catch(() => {}));
          }
          return current;
        });
      }
    });

    // Real-time listener: Master Barang (Katalog Bersama Semua Desa)
    const unsubBarangs = subscribeToBarangs((cloudBarangs) => {
      if (!mounted) return;
      if (cloudBarangs && cloudBarangs.length > 0) {
        setMasterBarangs((prevLocal) => {
          const cloudIds = new Set(cloudBarangs.map((b) => b.id));
          const missingInCloud = prevLocal.filter((b) => !cloudIds.has(b.id));
          if (missingInCloud.length > 0) {
            missingInCloud.forEach((b) => saveBarangToCloud(b).catch(() => {}));
            return [...cloudBarangs, ...missingInCloud];
          }
          return cloudBarangs;
        });
      } else if (cloudBarangs && cloudBarangs.length === 0) {
        // Jika Firestore master_barangs masih kosong, inisialisasi dengan data barang lokal
        setMasterBarangs((current) => {
          if (current.length > 0) {
            current.forEach((b) => saveBarangToCloud(b).catch(() => {}));
          }
          return current;
        });
      }
    });

    // Real-time listener: Akun Pengguna
    const unsubUsers = subscribeToUsers((cloudUsers) => {
      if (!mounted) return;
      if (cloudUsers && cloudUsers.length > 0) {
        setUsers(cloudUsers);
      }
    });

    return () => {
      mounted = false;
      unsubDesas();
      unsubSpjs();
      unsubRekanans();
      unsubBarangs();
      unsubUsers();
    };
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DESAS, JSON.stringify(desas));
    } catch (e) {
      console.error(e);
    }
  }, [desas]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch (e) {
      console.error(e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SPJS, JSON.stringify(spjs));
    } catch (e) {
      console.error(e);
    }
  }, [spjs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_REKANANS, JSON.stringify(masterRekanans));
    } catch (e) {
      console.error(e);
    }
  }, [masterRekanans]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BARANGS, JSON.stringify(masterBarangs));
    } catch (e) {
      console.error(e);
    }
  }, [masterBarangs]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(currentUser));
        if (!localStorage.getItem(STORAGE_KEY_SESSION_EXPIRES)) {
          localStorage.setItem(STORAGE_KEY_SESSION_EXPIRES, (Date.now() + SESSION_DURATION_MS).toString());
        }
      } else {
        localStorage.removeItem(STORAGE_KEY_AUTH);
        localStorage.removeItem(STORAGE_KEY_SESSION_EXPIRES);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const checkSessionExpiry = () => {
      const expiresAtStr = localStorage.getItem(STORAGE_KEY_SESSION_EXPIRES);
      if (!expiresAtStr) {
        logout();
        return;
      }
      const expTime = parseInt(expiresAtStr, 10);
      if (Date.now() >= expTime) {
        logout();
      }
    };

    let timer: ReturnType<typeof setTimeout> | null = null;
    const expiresAtStr = localStorage.getItem(STORAGE_KEY_SESSION_EXPIRES);
    if (expiresAtStr) {
      const expTime = parseInt(expiresAtStr, 10);
      const remainingMs = expTime - Date.now();
      if (remainingMs > 0) {
        timer = setTimeout(() => {
          logout();
        }, remainingMs);
      } else {
        logout();
      }
    }

    const interval = setInterval(checkSessionExpiry, 10000);

    return () => {
      if (timer) clearTimeout(timer);
      clearInterval(interval);
    };
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_DESA, activeDesaId);
    } catch (e) {
      console.error(e);
    }
  }, [activeDesaId]);

  const setActiveDesaId = (id: string) => {
    setActiveDesaIdState(id);
  };

  const activeDesa = desas.find((d) => d.id === activeDesaId) || desas[0];

  const login = (username: string, pass: string): { success: boolean; message?: string } => {
    const trimmedUser = username.trim().toLowerCase();
    const trimmedPass = pass.trim();

    // 1. Cek langsung pada daftar pengguna saat ini
    let user = users.find(
      (u) =>
        u.username.toLowerCase() === trimmedUser &&
        (u.password === pass || u.password === trimmedPass)
    );

    // 2. Fallback khusus kredensial Administrator (rinus / admin)
    if (!user) {
      const isRinus = trimmedUser === 'rinus';
      const isAdmin = trimmedUser === 'admin';
      const isRinusPass =
        trimmedPass === 'EltaX251016' ||
        trimmedPass === 'eltax251016' ||
        trimmedPass === '123';
      const isAdminPass =
        trimmedPass === '123' ||
        trimmedPass === 'EltaX251016' ||
        trimmedPass === 'eltax251016' ||
        trimmedPass === 'admin';

      if ((isRinus && isRinusPass) || (isAdmin && isAdminPass)) {
        user = {
          id: isRinus ? 'user-admin-rinus' : 'user-admin',
          username: isRinus ? 'rinus' : 'admin',
          password: pass,
          role: 'admin',
          nama: isRinus ? 'Hadrianus Daeli (Administrator)' : 'Administrator Kabupaten',
        };

        // Simpan / perbarui ke state users
        setUsers((prev) => {
          const exists = prev.some((u) => u.username.toLowerCase() === trimmedUser);
          if (exists) {
            return prev.map((u) =>
              u.username.toLowerCase() === trimmedUser
                ? { ...u, password: pass, role: 'admin' }
                : u
            );
          }
          return [...prev, user!];
        });
      }
    }

    if (user) {
      const expiresAt = Date.now() + SESSION_DURATION_MS;
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEY_SESSION_EXPIRES, expiresAt.toString());
      setCurrentUser(user);
      if (user.role === 'desa' && user.desaId) {
        setActiveDesaIdState(user.desaId);
      }
      return { success: true };
    }
    return { success: false, message: 'Nama Pengguna atau Kata Sandi salah' };
  };

  const logout = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_AUTH);
      localStorage.removeItem(STORAGE_KEY_SESSION_EXPIRES);
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
  };

  // Desa CRUD
  const addDesa = (data: Omit<DesaProfile, 'id'>): string => {
    const id = `desa-${Date.now()}`;
    const newDesa: DesaProfile = { ...data, id };
    setDesas((prev) => [...prev, newDesa]);
    saveDesaToCloud(newDesa).catch((err) => console.warn('Gagal sinkron desa ke cloud:', err));
    return id;
  };

  const updateDesa = (updated: DesaProfile) => {
    setDesas((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    saveDesaToCloud(updated).catch((err) => console.warn('Gagal sinkron update desa ke cloud:', err));
  };

  const deleteDesa = (id: string): boolean => {
    if (desas.length <= 1) {
      return false;
    }
    setDesas((prev) => prev.filter((d) => d.id !== id));
    setSpjs((prev) => prev.filter((s) => s.desaId !== id));
    setUsers((prev) => prev.filter((u) => u.desaId !== id));
    if (activeDesaId === id) {
      const remaining = desas.filter((d) => d.id !== id);
      if (remaining.length > 0) {
        setActiveDesaIdState(remaining[0].id);
      }
    }
    deleteDesaFromCloud(id).catch((err) => console.warn('Gagal hapus desa di cloud:', err));
    return true;
  };

  // User CRUD
  const addUser = (userData: Omit<UserAccount, 'id'>) => {
    const id = `user-${Date.now()}`;
    const newUser: UserAccount = { ...userData, id };
    setUsers((prev) => [...prev, newUser]);
    saveUserToCloud(newUser).catch((err) => console.warn('Gagal sinkron user ke cloud:', err));
  };

  const updateUser = (updated: UserAccount) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    if (currentUser?.id === updated.id) {
      setCurrentUser(updated);
    }
    saveUserToCloud(updated).catch((err) => console.warn('Gagal update user ke cloud:', err));
  };

  const deleteUser = (id: string): boolean => {
    if (users.length <= 1) {
      return false;
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    if (currentUser?.id === id) {
      setCurrentUser(null);
    }
    deleteUserFromCloud(id).catch((err) => console.warn('Gagal hapus user di cloud:', err));
    return true;
  };

  // Master Rekanan CRUD
  const addMasterRekanan = (rekananData: Omit<MasterRekanan, 'id'>): string => {
    const id = `rek-${Date.now()}`;
    const newRekanan: MasterRekanan = { ...rekananData, id };
    setMasterRekanans((prev) => [newRekanan, ...prev]);
    saveRekananToCloud(newRekanan).catch((err) => console.warn('Gagal simpan rekanan ke cloud:', err));
    return id;
  };

  const updateMasterRekanan = (updated: MasterRekanan) => {
    setMasterRekanans((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    saveRekananToCloud(updated).catch((err) => console.warn('Gagal update rekanan ke cloud:', err));
  };

  const deleteMasterRekanan = (id: string) => {
    setMasterRekanans((prev) => prev.filter((r) => r.id !== id));
    deleteRekananFromCloud(id).catch((err) => console.warn('Gagal hapus rekanan di cloud:', err));
  };

  // Master Barang CRUD
  const addMasterBarang = (barangData: Omit<MasterBarang, 'id'>): string => {
    const id = `brg-${Date.now()}`;
    const newBarang: MasterBarang = { ...barangData, id };
    setMasterBarangs((prev) => [newBarang, ...prev]);
    saveBarangToCloud(newBarang).catch((err) => console.warn('Gagal simpan barang ke cloud:', err));
    return id;
  };

  const updateMasterBarang = (updated: MasterBarang) => {
    setMasterBarangs((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    saveBarangToCloud(updated).catch((err) => console.warn('Gagal update barang ke cloud:', err));
  };

  const deleteMasterBarang = (id: string) => {
    setMasterBarangs((prev) => prev.filter((b) => b.id !== id));
    deleteBarangFromCloud(id).catch((err) => console.warn('Gagal hapus barang di cloud:', err));
  };

  // SPJ CRUD
  const addSpj = (spjData: Omit<SpjDocument, 'id' | 'createdAt' | 'updatedAt'>): string => {
    const id = `spj-${Date.now()}`;
    const now = new Date().toISOString();
    const newSpj: SpjDocument = {
      ...spjData,
      id,
      createdAt: now,
      updatedAt: now,
    };
    setSpjs((prev) => [newSpj, ...prev]);
    saveSpjToCloud(newSpj).catch((err) => console.warn('Gagal simpan SPJ ke cloud:', err));
    return id;
  };

  const updateSpj = (updated: SpjDocument) => {
    const now = new Date().toISOString();
    const updatedSpj = { ...updated, updatedAt: now };
    setSpjs((prev) =>
      prev.map((s) => (s.id === updated.id ? updatedSpj : s))
    );
    saveSpjToCloud(updatedSpj).catch((err) => console.warn('Gagal update SPJ ke cloud:', err));
  };

  const deleteSpj = (id: string) => {
    setSpjs((prev) => prev.filter((s) => s.id !== id));
    deleteSpjFromCloud(id).catch((err) => console.warn('Gagal hapus SPJ di cloud:', err));
  };

  const duplicateSpj = (id: string): string | null => {
    const target = spjs.find((s) => s.id === id);
    if (!target) return null;
    const newId = `spj-${Date.now()}`;
    const duplicated: SpjDocument = {
      ...target,
      id: newId,
      nomorSuratPesanan: `${target.nomorSuratPesanan} (Salinan)`,
      nomorFaktur: `${target.nomorFaktur} (Salinan)`,
      nomorBAST: `${target.nomorBAST} (Salinan)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSpjs((prev) => [duplicated, ...prev]);
    saveSpjToCloud(duplicated).catch((err) => console.warn('Gagal simpan SPJ duplikat ke cloud:', err));
    return newId;
  };

  // ==========================================
  // BACKUP & RESTORE FILE JSON
  // ==========================================

  // 1. Export Global Backup (Semua Desa) - Khusus Admin
  const exportBackup = () => {
    if (currentUser?.role !== 'admin') {
      alert('Akses Ditolak: Hanya Administrator Kabupaten yang dapat mencadangkan seluruh data sistem.');
      return;
    }
    const backupData = {
      type: 'full_system_backup',
      version: '2.5',
      timestamp: new Date().toISOString(),
      appName: 'Aplikasi SPJ Desa Nias Barat',
      desas,
      users,
      spjs,
      masterRekanans,
      masterBarangs,
    };
    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `backup_SEMUA_DESA_spj_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 2. Import Global Backup (Semua Desa) - Khusus Admin
  const importBackup = (file: File): Promise<{ success: boolean; message: string }> => {
    return new Promise((resolve) => {
      if (currentUser?.role !== 'admin') {
        resolve({
          success: false,
          message: 'Akses Ditolak: Hanya Administrator Kabupaten yang berwenang memulihkan seluruh sistem.',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          if (!parsed.desas || !Array.isArray(parsed.desas)) {
            resolve({ success: false, message: 'Format file cadangan tidak valid (data desa tidak ditemukan).' });
            return;
          }
          if (parsed.desas) setDesas(parsed.desas);
          if (parsed.users && Array.isArray(parsed.users)) setUsers(parsed.users);
          if (parsed.spjs && Array.isArray(parsed.spjs)) setSpjs(parsed.spjs);
          if (parsed.masterRekanans && Array.isArray(parsed.masterRekanans)) {
            setMasterRekanans(parsed.masterRekanans);
          }
          if (parsed.masterBarangs && Array.isArray(parsed.masterBarangs)) {
            setMasterBarangs(parsed.masterBarangs);
          }
          resolve({ success: true, message: 'Data cadangan seluruh sistem berhasil dipulihkan!' });
        } catch {
          resolve({ success: false, message: 'Gagal memproses file cadangan. Pastikan file berformat JSON yang valid.' });
        }
      };
      reader.onerror = () => {
        resolve({ success: false, message: 'Terjadi kesalahan saat membaca file.' });
      };
      reader.readAsText(file);
    });
  };

  // 3. Export Backup Khusus SATU DESA (Per Desa)
  const exportDesaBackup = (desaId: string) => {
    // Jika login sebagai operator desa, batasi HANYA ke desa milik akunnya sendiri
    const effectiveDesaId =
      currentUser?.role === 'desa' && currentUser.desaId ? currentUser.desaId : desaId;
    const targetDesa = desas.find((d) => d.id === effectiveDesaId);
    if (!targetDesa) return;

    const desaSpjs = spjs.filter((s) => s.desaId === effectiveDesaId);
    const usedRekananNames = new Set(desaSpjs.map((s) => s.penyedia?.namaPerusahaan));
    const linkedRekanans = masterRekanans.filter(
      (r) => r.desaId === effectiveDesaId || usedRekananNames.has(r.namaPerusahaan)
    );
    const linkedBarangs = masterBarangs.filter(
      (b) => b.desaId === effectiveDesaId || !b.desaId
    );
    const linkedUsers = users.filter((u) => u.desaId === effectiveDesaId);

    const perDesaBackup = {
      type: 'per_desa_backup',
      version: '2.5',
      timestamp: new Date().toISOString(),
      desaId: targetDesa.id,
      namaDesa: targetDesa.namaDesa,
      desa: targetDesa,
      spjs: desaSpjs,
      rekanans: masterRekanans, // Katalog Rekanan bersama seluruh desa
      barangs: masterBarangs,   // Katalog Barang bersama seluruh desa
      users: linkedUsers,
    };

    const jsonString = JSON.stringify(perDesaBackup, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    const safeName = targetDesa.namaDesa.replace(/[^a-zA-Z0-9]/g, '_');
    a.href = url;
    a.download = `backup_desa_${safeName}_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 4. Import / Restore Backup Khusus SATU DESA (Hanya desa ini yang terpengaruh)
  const importDesaBackup = (file: File): Promise<{ success: boolean; message: string; desaNama?: string }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);

          let targetDesa: DesaProfile | null = null;
          let incomingSpjs: SpjDocument[] = [];
          let incomingRekanans: MasterRekanan[] = [];
          let incomingBarangs: MasterBarang[] = [];
          let incomingUsers: UserAccount[] = [];

          if (parsed.desa && parsed.desa.id && parsed.desa.namaDesa) {
            targetDesa = parsed.desa;
            incomingSpjs = Array.isArray(parsed.spjs) ? parsed.spjs : [];
            incomingRekanans = Array.isArray(parsed.rekanans) ? parsed.rekanans : [];
            incomingBarangs = Array.isArray(parsed.barangs) ? parsed.barangs : [];
            incomingUsers = Array.isArray(parsed.users) ? parsed.users : [];
          } else if (Array.isArray(parsed.desas) && parsed.desas.length === 1) {
            targetDesa = parsed.desas[0];
            incomingSpjs = Array.isArray(parsed.spjs)
              ? parsed.spjs.filter((s: SpjDocument) => s.desaId === targetDesa?.id)
              : [];
          } else {
            resolve({
              success: false,
              message:
                'File tidak dikenali sebagai format cadangan per desa. Pastikan menggunakan file backup khusus per desa.',
            });
            return;
          }

          if (!targetDesa) {
            resolve({
              success: false,
              message: 'Data profil desa tidak ditemukan dalam file cadangan.',
            });
            return;
          }

          const dId = targetDesa.id;
          const dNama = targetDesa.namaDesa;

          // PROTEKSI ISOLASI DESA:
          // Jika login sebagai operator desa, HANYA boleh restore ke desanya sendiri!
          if (currentUser?.role === 'desa' && currentUser.desaId && dId !== currentUser.desaId) {
            const userDesa = desas.find((d) => d.id === currentUser.desaId);
            resolve({
              success: false,
              message: `Akses Ditolak: Anda login sebagai Operator Desa ${userDesa?.namaDesa || ''}. Anda dilarang memulihkan data Desa ${dNama} untuk mencegah terhapus atau tertimpanya data desa lain.`,
            });
            return;
          }

          // 1. Update atau tambah profil desa ini saja
          setDesas((prev) => {
            const exists = prev.some((d) => d.id === dId);
            if (exists) {
              return prev.map((d) => (d.id === dId ? targetDesa! : d));
            }
            return [...prev, targetDesa!];
          });

          // 2. Ganti HANYA SPJ milik desa ini, desa lain sama sekali tidak tersentuh!
          setSpjs((prev) => {
            const otherSpjs = prev.filter((s) => s.desaId !== dId);
            const sanitizedSpjs = incomingSpjs.map((s) => ({ ...s, desaId: dId }));
            return [...otherSpjs, ...sanitizedSpjs];
          });

          // 3. Gabungkan master rekanan & barang tanpa menimpa yang sudah ada, serta simpan ke Cloud Firebase
          if (incomingRekanans.length > 0) {
            setMasterRekanans((prev) => {
              const map = new Map(prev.map((r) => [r.id, r]));
              incomingRekanans.forEach((r) => {
                map.set(r.id, r);
                saveRekananToCloud(r).catch(() => {});
              });
              return Array.from(map.values());
            });
          }

          if (incomingBarangs.length > 0) {
            setMasterBarangs((prev) => {
              const map = new Map(prev.map((b) => [b.id, b]));
              incomingBarangs.forEach((b) => {
                map.set(b.id, b);
                saveBarangToCloud(b).catch(() => {});
              });
              return Array.from(map.values());
            });
          }

          // 4. Update akun login khusus desa ini
          if (incomingUsers.length > 0) {
            setUsers((prev) => {
              const otherUsers = prev.filter((u) => u.desaId !== dId);
              return [...otherUsers, ...incomingUsers];
            });
          }

          resolve({
            success: true,
            message: `Data Desa ${dNama} (${incomingSpjs.length} SPJ) berhasil dipulihkan. Data desa lain tetap aman terjaga!`,
            desaNama: dNama,
          });
        } catch (err: any) {
          resolve({
            success: false,
            message: `Gagal membaca file JSON: ${err?.message || 'Format tidak valid'}`,
          });
        }
      };
      reader.onerror = () => {
        resolve({ success: false, message: 'Gagal membaca file dari disk.' });
      };
      reader.readAsText(file);
    });
  };

  // ==========================================
  // CLOUD FIREBASE SYNCHRONIZATION
  // ==========================================

  const checkCloudConnection = async (): Promise<boolean> => {
    const isOk = await testConnection();
    setIsCloudOnline(isOk);
    return isOk;
  };

  // Sinkronkan seluruh Master Rekanan & Master Barang ke Cloud Firebase
  const syncMasterDataCloud = async (): Promise<{ success: boolean; message: string }> => {
    setIsSyncing(true);
    try {
      const res = await syncAllMasterDataToCloud(masterRekanans, masterBarangs);
      if (res.success) {
        const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setCloudLastSync(timeNow);
        try {
          localStorage.setItem(STORAGE_KEY_LAST_SYNC, timeNow);
        } catch {}
      }
      return res;
    } catch (err: any) {
      return { success: false, message: err?.message || 'Gagal menyinkronkan data master ke cloud.' };
    } finally {
      setIsSyncing(false);
    }
  };

  // Upload Cloud SATU DESA (Hanya desa terpilih yang diunggah ke Firebase)
  const uploadDesaCloud = async (desaId: string): Promise<{ success: boolean; message: string }> => {
    // Proteksi Keamanan: Akun Desa hanya boleh upload desanya sendiri
    if (currentUser?.role === 'desa' && currentUser.desaId && desaId !== currentUser.desaId) {
      return {
        success: false,
        message: 'Akses Ditolak: Anda hanya berwenang mengunggah data untuk desa Anda sendiri.',
      };
    }

    const effectiveDesaId =
      currentUser?.role === 'desa' && currentUser.desaId ? currentUser.desaId : desaId;

    const targetDesa = desas.find((d) => d.id === effectiveDesaId);
    if (!targetDesa) {
      return { success: false, message: 'Desa yang dipilih tidak ditemukan.' };
    }

    setIsSyncing(true);
    try {
      const desaSpjs = spjs.filter((s) => s.desaId === effectiveDesaId);
      const res = await uploadDesaToCloud(
        targetDesa,
        desaSpjs,
        masterRekanans,
        masterBarangs,
        users
      );
      if (res.success) {
        const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setCloudLastSync(timeNow);
        try {
          localStorage.setItem(STORAGE_KEY_LAST_SYNC, timeNow);
        } catch {}
      }
      return res;
    } catch (err: any) {
      return { success: false, message: err?.message || 'Gagal mengunggah ke Cloud Firebase' };
    } finally {
      setIsSyncing(false);
    }
  };

  // Download Cloud SATU DESA (Hanya data desa terpilih yang diperbarui dari Firebase)
  const downloadDesaCloud = async (desaId: string): Promise<{ success: boolean; message: string }> => {
    // Proteksi Keamanan: Akun Desa hanya boleh download desanya sendiri
    if (currentUser?.role === 'desa' && currentUser.desaId && desaId !== currentUser.desaId) {
      return {
        success: false,
        message: 'Akses Ditolak: Anda hanya berwenang menarik data untuk desa Anda sendiri.',
      };
    }

    const effectiveDesaId =
      currentUser?.role === 'desa' && currentUser.desaId ? currentUser.desaId : desaId;

    setIsSyncing(true);
    try {
      const res = await downloadDesaFromCloud(effectiveDesaId);
      if (!res.success || !res.packageData) {
        return { success: false, message: res.message };
      }

      const pkg = res.packageData;
      const dId = pkg.desaId;
      const dNama = pkg.namaDesa;

      // 1. Perbarui profil desa ini
      setDesas((prev) => {
        const exists = prev.some((d) => d.id === dId);
        if (exists) {
          return prev.map((d) => (d.id === dId ? pkg.desa : d));
        }
        return [...prev, pkg.desa];
      });

      // 2. Ganti SPJ HANYA milik desa ini (desa lain tidak tersentuh)
      setSpjs((prev) => {
        const otherSpjs = prev.filter((s) => s.desaId !== dId);
        const incoming = (pkg.spjs || []).map((s) => ({ ...s, desaId: dId }));
        return [...otherSpjs, ...incoming];
      });

      // 3. Gabungkan master rekanan & barang
      if (pkg.rekanans && pkg.rekanans.length > 0) {
        setMasterRekanans((prev) => {
          const map = new Map(prev.map((r) => [r.id, r]));
          pkg.rekanans.forEach((r) => map.set(r.id, r));
          return Array.from(map.values());
        });
      }

      if (pkg.barangs && pkg.barangs.length > 0) {
        setMasterBarangs((prev) => {
          const map = new Map(prev.map((b) => [b.id, b]));
          pkg.barangs.forEach((b) => map.set(b.id, b));
          return Array.from(map.values());
        });
      }

      // 4. Update akun login desa ini
      if (pkg.users && pkg.users.length > 0) {
        setUsers((prev) => {
          const otherUsers = prev.filter((u) => u.desaId !== dId);
          return [...otherUsers, ...pkg.users];
        });
      }

      const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      setCloudLastSync(timeNow);
      try {
        localStorage.setItem(STORAGE_KEY_LAST_SYNC, timeNow);
      } catch {}

      return {
        success: true,
        message: `Data Desa ${dNama} (${pkg.spjs?.length || 0} SPJ) berhasil disinkronkan dari Cloud Firebase. Desa lain tidak terganggu!`,
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Gagal menarik data dari Cloud Firebase' };
    } finally {
      setIsSyncing(false);
    }
  };

  // Upload Menyeluruh ke Cloud - Khusus Admin
  const uploadAllCloud = async (): Promise<{ success: boolean; message: string }> => {
    if (currentUser?.role !== 'admin') {
      return {
        success: false,
        message: 'Akses Ditolak: Hanya Administrator Kabupaten yang dapat mengunggah semua desa ke cloud.',
      };
    }

    setIsSyncing(true);
    try {
      const res = await uploadAllToCloud({
        desas,
        spjs,
        masterRekanans,
        masterBarangs,
        users,
      });
      if (res.success) {
        const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setCloudLastSync(timeNow);
        try {
          localStorage.setItem(STORAGE_KEY_LAST_SYNC, timeNow);
        } catch {}
      }
      return res;
    } catch (err: any) {
      return { success: false, message: err?.message || 'Gagal sinkronisasi menyeluruh' };
    } finally {
      setIsSyncing(false);
    }
  };

  // Unduh Menyeluruh dari Cloud - Khusus Admin
  const downloadAllCloud = async (): Promise<{ success: boolean; message: string }> => {
    if (currentUser?.role !== 'admin') {
      return {
        success: false,
        message: 'Akses Ditolak: Hanya Administrator Kabupaten yang dapat mengunduh semua desa dari cloud.',
      };
    }
    setIsSyncing(true);
    try {
      const res = await downloadAllFromCloud();
      if (!res.success || !res.data) {
        return { success: false, message: res.message };
      }
      const d = res.data;
      if (d.desas && d.desas.length > 0) setDesas(d.desas);
      if (d.spjs) setSpjs(d.spjs);
      if (d.users && d.users.length > 0) setUsers(d.users);
      if (d.masterRekanans && d.masterRekanans.length > 0) setMasterRekanans(d.masterRekanans);
      if (d.masterBarangs && d.masterBarangs.length > 0) setMasterBarangs(d.masterBarangs);

      const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      setCloudLastSync(timeNow);
      try {
        localStorage.setItem(STORAGE_KEY_LAST_SYNC, timeNow);
      } catch {}

      return {
        success: true,
        message: `Berhasil mengunduh seluruh data (${d.desas?.length || 0} Desa, ${d.spjs?.length || 0} SPJ) dari Cloud Firebase!`,
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Gagal mengunduh dari Cloud' };
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchCloudSummary = async (): Promise<CloudDesaSummary[]> => {
    return await getCloudDesasSummary();
  };

  const resetToDefault = () => {
    setDesas(DEFAULT_DESAS);
    setUsers(DEFAULT_USERS);
    setSpjs(DEFAULT_SPJS);
    setMasterRekanans(DEFAULT_REKANANS);
    setMasterBarangs(DEFAULT_BARANGS);
    setActiveDesaIdState('desa-fadoro');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        desas,
        users,
        spjs,
        masterRekanans,
        masterBarangs,
        activeDesaId,
        activeDesa,
        setActiveDesaId,
        login,
        logout,
        addDesa,
        updateDesa,
        deleteDesa,
        addUser,
        updateUser,
        deleteUser,
        addMasterRekanan,
        updateMasterRekanan,
        deleteMasterRekanan,
        addMasterBarang,
        updateMasterBarang,
        deleteMasterBarang,
        addSpj,
        updateSpj,
        deleteSpj,
        duplicateSpj,
        exportBackup,
        importBackup,
        exportDesaBackup,
        importDesaBackup,
        resetToDefault,
        isCloudOnline,
        isSyncing,
        cloudLastSync,
        firebaseProjectId: FIREBASE_PROJECT_ID,
        checkCloudConnection,
        syncMasterDataCloud,
        uploadDesaCloud,
        downloadDesaCloud,
        uploadAllCloud,
        downloadAllCloud,
        fetchCloudSummary,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
