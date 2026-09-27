import React, { useState, useEffect } from 'react';
import {
  SpjDocument,
  DesaProfile,
  KategoriBelanja,
  SumberDana,
  SpjItem,
  DataPajak,
  PesertaHadir,
} from '../types';
import { useApp } from '../context/AppContext';
import {
  formatTanggalIndonesia,
  getNamaHariIndonesia,
  toIsoDate,
  getYesterdayIso,
} from '../utils/dateHelper';
import { terbilang, formatRupiah } from '../utils/terbilang';
import {
  hitungPajakOtomatis,
  hitungTotalPajak,
  hitungDppBarang,
  hitungPpnBarang,
  hitungPph22Barang,
} from '../utils/taxHelper';
import { IndonesianDatePicker } from './IndonesianDatePicker';
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Users,
  Eye,
  Percent,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Store,
  Package,
} from 'lucide-react';

interface SpjFormProps {
  initialSpj?: SpjDocument | null;
  onSave: (spj: SpjDocument) => void;
  onCancel: () => void;
  onPreview: (spj: SpjDocument) => void;
  onOpenMasterData?: (tab?: 'rekanan' | 'barang') => void;
}

export const SpjForm: React.FC<SpjFormProps> = ({
  initialSpj,
  onSave,
  onCancel,
  onPreview,
  onOpenMasterData,
}) => {
  const { activeDesa, desas, masterRekanans, masterBarangs } = useApp();
  const currentDesa = activeDesa || desas[0];

  // Default values
  const todayIso = toIsoDate();
  const yesterdayIso = getYesterdayIso(todayIso);

  const [desaId, setDesaId] = useState(initialSpj?.desaId || currentDesa.id);
  const [sumberDana, setSumberDana] = useState<SumberDana>(
    initialSpj?.sumberDana || 'DDS'
  );
  const [tahunAnggaran, setTahunAnggaran] = useState(
    initialSpj?.tahunAnggaran || '2026'
  );
  const [namaKegiatan, setNamaKegiatan] = useState(
    initialSpj?.namaKegiatan || ''
  );
  const [kategoriBelanja, setKategoriBelanja] = useState<KategoriBelanja>(
    initialSpj?.kategoriBelanja || 'barang'
  );

  // Dates locked to Indonesian display
  const [tanggalSuratPesanan, setTanggalSuratPesanan] = useState(
    initialSpj?.tanggalSuratPesanan || yesterdayIso
  );
  const [tanggalFaktur, setTanggalFaktur] = useState(
    initialSpj?.tanggalFaktur || todayIso
  );
  const [tanggalBAST, setTanggalBAST] = useState(
    initialSpj?.tanggalBAST || todayIso
  );
  const [hariBAST, setHariBAST] = useState(
    initialSpj?.hariBAST || getNamaHariIndonesia(todayIso)
  );

  // Surat numbers (Format baku default sesuai instruksi)
  const extractNomorUrut = (nomorSurat: string): string => {
    if (!nomorSurat) return '';
    const parts = nomorSurat.split('/');
    if (parts.length >= 3) {
      return parts[1].trim();
    }
    return '';
  };

  const replaceNomorUrut = (nomorSurat: string, nomorUrutBaru: string): string => {
    if (!nomorSurat) return nomorSurat;
    const parts = nomorSurat.split('/');
    if (parts.length >= 3) {
      parts[1] = ` ${nomorUrutBaru.trim() || '......'} `;
      return parts.join('/');
    }
    return nomorSurat;
  };

  const defaultNomorSuratPesanan = (kode: string, thn: string = '2026', nomor: string = '......') =>
    `400/ ${nomor} /DS.${kode}/${thn}`;
  const defaultNomorBAST = (kode: string, sd: string, thn: string = '2026', nomor: string = '......') =>
    `400/ ${nomor} /BA.DS.${kode}/${sd}/${thn}`;
  const defaultNomorFaktur = '';

  const [nomorSuratPesanan, setNomorSuratPesanan] = useState(
    initialSpj?.nomorSuratPesanan || defaultNomorSuratPesanan(currentDesa.kodeDesa, tahunAnggaran)
  );
  const [sifatSurat, setSifatSurat] = useState(
    initialSpj?.sifatSurat || 'Penting'
  );
  const [lampiranSurat, setLampiranSurat] = useState(
    initialSpj?.lampiranSurat || '1 (satu) lembar'
  );
  const [perihalSurat, setPerihalSurat] = useState(
    initialSpj?.perihalSurat || 'Pesanan'
  );

  const [nomorFaktur, setNomorFaktur] = useState(
    initialSpj?.nomorFaktur || defaultNomorFaktur
  );
  const [nomorBAST, setNomorBAST] = useState(() => {
    if (initialSpj?.nomorBAST) return initialSpj.nomorBAST;
    const initialNo = extractNomorUrut(initialSpj?.nomorSuratPesanan || '') || '......';
    return defaultNomorBAST(currentDesa.kodeDesa, sumberDana, tahunAnggaran, initialNo);
  });

  const handleNomorSuratPesananChange = (newVal: string) => {
    setNomorSuratPesanan(newVal);
    const extracted = extractNomorUrut(newVal);
    if (extracted) {
      setNomorBAST((prevBast) => {
        if (prevBast && prevBast.includes('/')) {
          return replaceNomorUrut(prevBast, extracted);
        }
        return defaultNomorBAST(currentDesa.kodeDesa, sumberDana, tahunAnggaran, extracted);
      });
    }
  };

  // Pelaksana Kegiatan
  const [pelaksanaNama, setPelaksanaNama] = useState(
    initialSpj?.pelaksanaNama ||
      (sumberDana === 'ADD'
        ? currentDesa.pelaksanaADD.nama
        : currentDesa.pelaksanaDDS.nama)
  );
  const [pelaksanaJabatan, setPelaksanaJabatan] = useState(
    initialSpj?.pelaksanaJabatan ||
      (sumberDana === 'ADD'
        ? (currentDesa.pelaksanaADD.jabatan || 'Pelaksana Kegiatan ADD')
        : (currentDesa.pelaksanaDDS.jabatan || 'Pelaksana Kegiatan DDS'))
  );

  // Rekanan Penyedia
  const [penyedia, setPenyedia] = useState(
    initialSpj?.penyedia || {
      namaPerusahaan: 'UD. NIAT',
      pimpinan: 'HADRIANUS DAELI',
      jabatan: 'Pimpinan UD. NIAT',
      alamat: 'Balogawu, Kecamatan Sirombu',
      kota: 'Balogawu',
      noTelepon: '',
    }
  );

  // Items (kosong secara default sesuai permintaan)
  const [items, setItems] = useState<SpjItem[]>(
    initialSpj?.items && initialSpj.items.length > 0
      ? initialSpj.items
      : [
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
        ]
  );

  // Tax state
  const totalBelanja = items.reduce(
    (acc, it) => acc + (Number(it.jumlahHarga) || 0),
    0
  );

  const [pajak, setPajak] = useState<DataPajak>(() => {
    if (initialSpj?.pajak) {
      return initialSpj.pajak;
    }
    return hitungPajakOtomatis(kategoriBelanja, totalBelanja);
  });

  // Daftar Hadir state
  const [daftarHadirJudul, setDaftarHadirJudul] = useState(() => {
    if (initialSpj?.daftarHadirJudul !== undefined) {
      return initialSpj.daftarHadirJudul;
    }
    return '';
  });
  const [daftarHadirTempat, setDaftarHadirTempat] = useState(
    initialSpj?.daftarHadirTempat || `Balai Pertemuan Desa ${currentDesa.namaDesa}`
  );
  const [daftarHadir, setDaftarHadir] = useState<PesertaHadir[]>(
    initialSpj?.daftarHadir || []
  );
  const [jumlahBarisInput, setJumlahBarisInput] = useState<number>(15);

  // Auto-sync daftarHadirJudul dari namaKegiatan di atas jika bukan SPJ yang sudah ada
  useEffect(() => {
    if (!initialSpj) {
      if (namaKegiatan.trim()) {
        const cleaned = namaKegiatan
          .trim()
          .replace(/^Kegiatan\s*:?\s*/i, '')
          .trim();
        setDaftarHadirJudul(cleaned);
      } else {
        setDaftarHadirJudul('');
      }
    }
  }, [namaKegiatan, initialSpj]);

  const handleGenerateDaftarHadirRows = (count: number) => {
    const validCount = Math.max(1, Math.min(300, count));
    const newRows: PesertaHadir[] = Array.from({ length: validCount }, (_, idx) => ({
      id: `p-${Date.now()}-${idx + 1}`,
      no: idx + 1,
      nama: '',
      jabatan: '',
      alamatInstansi: '',
    }));
    setDaftarHadir(newRows);
  };

  // Sorted desa and master barang A-Z
  const sortedDesas = [...desas].sort((a, b) => a.namaDesa.localeCompare(b.namaDesa, 'id'));
  const sortedMasterBarangs = [...masterBarangs].sort((a, b) => a.nama.localeCompare(b.nama, 'id'));

  // RULE 1: Auto-switch Pelaksana Kegiatan based on Sumber Dana & Set Default Document Numbers for New SPJ
  // "jika sumber dananya Alokasi Dana Desa (ADD) atau Dana Desa (DSS), pelaksana kegiatannya langsung di tetapkan sesuai yang diinput di data desa"
  useEffect(() => {
    if (!initialSpj) {
      if (sumberDana === 'ADD') {
        setPelaksanaJabatan(currentDesa.pelaksanaADD?.jabatan || 'Pelaksana Kegiatan ADD');
        if (currentDesa.pelaksanaADD?.nama) {
          setPelaksanaNama(currentDesa.pelaksanaADD.nama);
        }
      } else if (sumberDana === 'DDS' || sumberDana === 'DD') {
        setPelaksanaJabatan(currentDesa.pelaksanaDDS?.jabatan || 'Pelaksana Kegiatan DDS');
        if (currentDesa.pelaksanaDDS?.nama) {
          setPelaksanaNama(currentDesa.pelaksanaDDS.nama);
        }
      }
      // Set default nomor surat pesanan & berita acara sesuai desa dan sumber dana
      const currentNomor = extractNomorUrut(nomorSuratPesanan) || '......';
      setNomorSuratPesanan(defaultNomorSuratPesanan(currentDesa.kodeDesa, tahunAnggaran, currentNomor));
      setNomorBAST(defaultNomorBAST(currentDesa.kodeDesa, sumberDana, tahunAnggaran, currentNomor));
      setNomorFaktur('');
    }
  }, [sumberDana, currentDesa, tahunAnggaran, initialSpj]);

  // RULE 2: Tanggal Berita Acara adalah tanggal faktur!
  // "tanggal Berita Acara adalah tanggal faktur."
  const handleTanggalFakturChange = (newIsoDate: string) => {
    setTanggalFaktur(newIsoDate);
    setTanggalBAST(newIsoDate);
    setHariBAST(getNamaHariIndonesia(newIsoDate));
  };

  // Recalculate item totals
  const handleItemChange = (
    index: number,
    field: keyof SpjItem,
    val: string | number
  ) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: val };

    if (field === 'volume' || field === 'hargaSatuan') {
      const vol = field === 'volume' ? Number(val) : item.volume;
      const hrg = field === 'hargaSatuan' ? Number(val) : item.hargaSatuan;
      item.jumlahHarga = vol * hrg;
      item.kondisiBaik = vol;
    }
    updated[index] = item;
    setItems(updated);
  };

  const handleAddItem = () => {
    const newItem: SpjItem = {
      id: `item-${Date.now()}`,
      nama: '',
      volume: 0,
      satuan: '',
      hargaSatuan: 0,
      jumlahHarga: 0,
      kondisiBaik: 0,
      kondisiRusak: 0,
      keterangan:
        kategoriBelanja === 'makanan_minuman'
          ? 'Makanan dan minuman dalam kondisi baik dan layak'
          : 'Seluruh Barang yang diterima berada dalam keadaan baik dan cukup',
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Recalculate taxes automatically whenever totalBelanja or kategoriBelanja changes
  useEffect(() => {
    setPajak((prev) => {
      return hitungPajakOtomatis(kategoriBelanja, totalBelanja, prev);
    });
  }, [totalBelanja, kategoriBelanja]);

  const totalPajak = hitungTotalPajak(pajak);
  const jumlahDibayarkan = Math.max(0, totalBelanja - totalPajak);

  const buildCurrentSpjObject = (): SpjDocument => {
    return {
      id: initialSpj?.id || `spj-${Date.now()}`,
      desaId,
      nomorSuratPesanan,
      tanggalSuratPesanan,
      sifatSurat,
      lampiranSurat,
      perihalSurat,
      nomorFaktur,
      tanggalFaktur,
      nomorBAST,
      tanggalBAST,
      hariBAST,
      sumberDana,
      tahunAnggaran,
      namaKegiatan,
      kategoriBelanja,
      pelaksanaNama,
      pelaksanaJabatan,
      penyedia,
      items,
      pajak,
      totalBelanja,
      totalPajak,
      jumlahDibayarkan,
      daftarHadirJudul: daftarHadirJudul.trim(),
      daftarHadirTempat,
      daftarHadir,
      createdAt: initialSpj?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const doc = buildCurrentSpjObject();
    onSave(doc);
  };

  const handleDirectPreview = () => {
    const doc = buildCurrentSpjObject();
    onPreview(doc);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Top Banner Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-700/80 px-3.5 py-2 rounded-xl shadow-xs hover:bg-slate-800 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar SPJ</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDirectPreview}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow transition cursor-pointer border border-slate-700/80"
          >
            <Eye className="w-4 h-4 text-emerald-400" />
            <span>Pratinjau &amp; Cetak PDF</span>
          </button>
          <button
            type="button"
            onClick={handleFormSubmit}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-md transition cursor-pointer active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Dokumen SPJ</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* SECTION 1: INFORMASI DASAR & SUMBER DANA */}
        <div className="bg-slate-900/90 rounded-2xl p-6 shadow-sm border border-slate-800">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
            <span className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center text-xs font-bold">
              1
            </span>
            <span>Identitas Kegiatan &amp; Sumber Dana</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Sumber Dana with Auto-trigger */}
            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Sumber Dana *
              </label>
              <select
                value={sumberDana}
                onChange={(e) => setSumberDana(e.target.value as SumberDana)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-emerald-400 font-bold rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ADD">Alokasi Dana Desa (ADD)</option>
                <option value="DDS">Dana Desa (DDS)</option>
                <option value="PBH">Pendapatan Dana Bagi Hasil (PBH)</option>
                <option value="PAD">Pendapatan Asli Desa (PAD)</option>
                <option value="DLL">Pendapatan Lain-lain (DLL)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                {sumberDana === 'ADD' ? (
                  <span className="text-emerald-400 font-semibold">
                    &bull; Pelaksana Kegiatan otomatis: {currentDesa.pelaksanaADD?.nama || 'Pelaksana ADD'}
                  </span>
                ) : sumberDana === 'DDS' || sumberDana === 'DD' ? (
                  <span className="text-blue-400 font-semibold">
                    &bull; Pelaksana Kegiatan otomatis: {currentDesa.pelaksanaDDS?.nama || 'Pelaksana DDS'}
                  </span>
                ) : (
                  <span className="text-amber-400 font-semibold">
                    &bull; Tersedia menu dropdown pilihan Pelaksana Kegiatan untuk sumber dana {sumberDana}
                  </span>
                )}
              </p>
            </div>

            {/* Tahun Anggaran */}
            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Tahun Anggaran
              </label>
              <input
                type="text"
                value={tahunAnggaran}
                onChange={(e) => setTahunAnggaran(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Kategori Belanja (Auto-switches Tax Rules) */}
            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Kategori Belanja *
              </label>
              <select
                value={kategoriBelanja}
                onChange={(e) =>
                  setKategoriBelanja(e.target.value as KategoriBelanja)
                }
                className="w-full p-2.5 bg-slate-950 border border-slate-700 font-bold text-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500"
              >
                <option value="barang">Barang / Perlengkapan Umum (PPN &amp; PPh 22)</option>
                <option value="makanan_minuman">
                  Makanan &amp; Minuman / Konsumsi (PHR 10% + PPh 23 2% + Daftar Hadir)
                </option>
                <option value="sewa">Sewa Peralatan / Gedung (PPh 23 2%)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                {kategoriBelanja === 'makanan_minuman' && (
                  <span className="text-amber-400 font-semibold">
                    &bull; Melampirkan Lembar Daftar Hadir otomatis
                  </span>
                )}
              </p>
            </div>

            {/* Nama Kegiatan */}
            <div className="md:col-span-3">
              <label className="font-semibold text-slate-300 block mb-1">
                Nama Kegiatan SPJ *
              </label>
              <input
                type="text"
                required
                value={namaKegiatan}
                onChange={(e) => setNamaKegiatan(e.target.value)}
                placeholder="misal: Pengelolaan dan Pembuatan Jaringan/Instalasi Digital Desa"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white placeholder-slate-500 rounded-lg text-xs font-medium focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: TANGGAL & PENOMORAN DOKUMEN (LOCKED KE INDONESIA FORMAT) */}
        <div className="bg-slate-900/90 rounded-2xl p-6 shadow-sm border border-slate-800">
          <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span>Tanggal &amp; Penomoran Surat (Format Baku Indonesia)</span>
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
              Dikunci Format: Dd Mmmm Yyyy
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
            {/* 1. Surat Pesanan Date & Number */}
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2.5">
              <div className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>1. Surat Pesanan</span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-medium text-slate-300 block">
                    Nomor Surat Pesanan
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const curNo = extractNomorUrut(nomorSuratPesanan) || '......';
                      setNomorSuratPesanan(`400/ ${curNo} /DS.${currentDesa.kodeDesa}/${tahunAnggaran}`);
                    }}
                    className="text-[10px] text-emerald-400 hover:underline font-semibold cursor-pointer"
                    title={`Setel ke format default: 400/ ...... /DS.${currentDesa.kodeDesa}/${tahunAnggaran}`}
                  >
                    Format Default
                  </button>
                </div>
                <input
                  type="text"
                  value={nomorSuratPesanan}
                  onChange={(e) => handleNomorSuratPesananChange(e.target.value)}
                  placeholder={`400/ ...... /DS.${currentDesa.kodeDesa}/${tahunAnggaran}`}
                  className="w-full p-2 border border-slate-700 rounded-lg font-mono text-xs bg-slate-900 text-white focus:ring-1 focus:ring-emerald-500"
                />
                
                {/* Input Khusus Pengisian Nomor Urut (......) Otomatis ke Surat Pesanan & BAST */}
                <div className="mt-2 p-2 bg-emerald-950/25 border border-emerald-500/25 rounded-lg flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-emerald-300">
                    Isi Nomor Urut (......):
                  </span>
                  <input
                    type="text"
                    value={extractNomorUrut(nomorSuratPesanan) === '......' ? '' : extractNomorUrut(nomorSuratPesanan)}
                    onChange={(e) => {
                      const val = e.target.value.trim() || '......';
                      const updatedPesanan = replaceNomorUrut(nomorSuratPesanan, val);
                      setNomorSuratPesanan(updatedPesanan);
                      setNomorBAST((prev) => replaceNomorUrut(prev, val));
                    }}
                    placeholder="misal: 01"
                    className="w-24 px-2 py-0.5 bg-slate-900 border border-emerald-500/50 rounded text-center text-xs font-bold text-emerald-300 focus:ring-1 focus:ring-emerald-400 placeholder-slate-600"
                  />
                  <span className="text-[10px] text-slate-400">
                    (Otomatis mengisi ...... di Nomor Surat Pesanan &amp; BAST)
                  </span>
                </div>
              </div>

              <div>
                <IndonesianDatePicker
                  label="Pilihan Tanggal (Format Indonesia)"
                  value={tanggalSuratPesanan}
                  onChange={(val) => setTanggalSuratPesanan(val)}
                />
              </div>
            </div>

            {/* 2. Faktur Date (Triggers BAST Date Sync) */}
            <div className="p-3.5 bg-emerald-950/30 rounded-xl border border-emerald-900/60 space-y-2.5">
              <div className="font-bold text-emerald-300 flex items-center gap-1.5 text-xs">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>2. Faktur / Bon (Induk Tanggal BAST)</span>
              </div>

              <div>
                <IndonesianDatePicker
                  label="Tanggal Faktur *"
                  value={tanggalFaktur}
                  onChange={(val) => handleTanggalFakturChange(val)}
                  helperText="* Otomatis menyinkronkan Tanggal Berita Acara & Daftar Hadir"
                />
              </div>
            </div>

            {/* 3. Berita Acara (BAST) Date & Number */}
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2.5">
              <div className="font-bold text-slate-200 flex items-center gap-1.5 text-xs">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>3. Berita Acara (BAST)</span>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1.5">
                    <label className="font-medium text-slate-300 block">
                      Nomor Berita Acara (BAST)
                    </label>
                    <span className="text-[10px] text-emerald-400 font-semibold px-1.5 py-0.2 bg-emerald-950/80 border border-emerald-800/60 rounded">
                      Otomatis
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const curNo = extractNomorUrut(nomorSuratPesanan) || '......';
                      setNomorBAST(`400/ ${curNo} /BA.DS.${currentDesa.kodeDesa}/${sumberDana}/${tahunAnggaran}`);
                    }}
                    className="text-[10px] text-emerald-400 hover:underline font-semibold cursor-pointer"
                    title={`Setel ke format default dengan nomor dari Surat Pesanan`}
                  >
                    Format Default
                  </button>
                </div>
                <input
                  type="text"
                  value={nomorBAST}
                  onChange={(e) => setNomorBAST(e.target.value)}
                  placeholder={`400/ ...... /BA.DS.${currentDesa.kodeDesa}/${sumberDana}/${tahunAnggaran}`}
                  className="w-full p-2 border border-slate-700 rounded-lg font-mono text-xs bg-slate-900 text-white focus:ring-1 focus:ring-emerald-500"
                />
                <div className="text-[10px] text-emerald-400/90 mt-1 font-mono">
                  &bull; Otomatis sinkron dengan isi nomor [ {extractNomorUrut(nomorSuratPesanan) || '......'} ] dari Surat Pesanan
                </div>
              </div>

              <div>
                <IndonesianDatePicker
                  label="Tanggal Berita Acara (= Tanggal Faktur)"
                  value={tanggalBAST}
                  onChange={(val) => {
                    setTanggalBAST(val);
                    setHariBAST(getNamaHariIndonesia(val));
                  }}
                  helperText={`Hari: ${hariBAST}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: PEJABAT & PENYEDIA BARANG */}
        <div className="bg-slate-900/90 rounded-2xl p-6 shadow-sm border border-slate-800">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
            <span className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center text-xs font-bold">
              3
            </span>
            <span>Pelaksana Kegiatan &amp; Penyedia / Rekanan</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Pelaksana Kegiatan */}
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
              <div className="font-bold text-slate-200 text-xs flex justify-between items-center">
                <span>Pelaksana Kegiatan Desa {currentDesa.namaDesa}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                  {pelaksanaJabatan}
                </span>
              </div>

              {/* JIKA SUMBER DANA ADD ATAU DDS (DSS): DITETAPKAN LANGSUNG SESUAI DATA DESA */}
              {sumberDana === 'ADD' || sumberDana === 'DDS' || sumberDana === 'DD' ? (
                <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-300">
                      Ditetapkan Langsung dari Data Desa ({sumberDana === 'ADD' ? 'ADD' : 'DDS'})
                    </span>
                    <span className="text-[10px] bg-emerald-900 text-emerald-200 px-2 py-0.5 rounded border border-emerald-700 font-semibold">
                      Terkunci Otomatis
                    </span>
                  </div>

                  <div>
                    <label className="font-medium text-slate-300 block mb-1 text-[11px]">
                      Nama Pelaksana Kegiatan
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={pelaksanaNama}
                      className="w-full p-2 border border-emerald-700/80 rounded-lg bg-slate-900 font-bold uppercase text-white cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="font-medium text-slate-300 block mb-1 text-[11px]">
                      Jabatan Pelaksana
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={pelaksanaJabatan}
                      className="w-full p-2 border border-emerald-700/80 rounded-lg bg-slate-900 text-slate-200 cursor-not-allowed text-xs font-semibold"
                    />
                  </div>
                  <p className="text-[10px] text-emerald-400 italic">
                    * Untuk mengubah pelaksana {sumberDana}, silakan sesuaikan di menu Data Profil Desa pada Panel Admin &amp; Backup.
                  </p>
                </div>
              ) : (
                /* KHUSUS SUMBER DANA PBH, PAD, DLL: SEDIAKAN MENU DROPDOWN PELAKSANA KEGIATAN */
                <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-300">
                      Pilihan Pelaksana Kegiatan ({sumberDana})
                    </span>
                    <span className="text-[10px] bg-amber-900 text-amber-200 px-2 py-0.5 rounded border border-amber-700 font-semibold">
                      Menu Dropdown Aktif
                    </span>
                  </div>

                  <div>
                    <label className="font-bold text-amber-300 block mb-1 text-[11px]">
                      &darr; Pilih Pelaksana Kegiatan dari Dropdown:
                    </label>
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'pelaksana_add') {
                          setPelaksanaNama(currentDesa.pelaksanaADD?.nama || '');
                          setPelaksanaJabatan(currentDesa.pelaksanaADD?.jabatan || 'Pelaksana Kegiatan ADD');
                        } else if (val === 'pelaksana_dds') {
                          setPelaksanaNama(currentDesa.pelaksanaDDS?.nama || '');
                          setPelaksanaJabatan(currentDesa.pelaksanaDDS?.jabatan || 'Pelaksana Kegiatan DDS');
                        } else if (val === 'sekdes') {
                          setPelaksanaNama(currentDesa.sekretarisDesa?.nama || '');
                          setPelaksanaJabatan(currentDesa.sekretarisDesa?.jabatan || 'Sekretaris Desa');
                        } else if (val === 'bendahara') {
                          setPelaksanaNama(currentDesa.bendaharaDesa?.nama || '');
                          setPelaksanaJabatan(currentDesa.bendaharaDesa?.jabatan || 'Bendahara Desa');
                        } else if (val === 'kades') {
                          setPelaksanaNama(currentDesa.kepalaDesa?.nama || '');
                          setPelaksanaJabatan(currentDesa.kepalaDesa?.jabatan || 'Pj. Kepala Desa');
                        }
                      }}
                      defaultValue=""
                      className="w-full p-2 border border-amber-700 rounded-lg bg-slate-900 font-semibold text-slate-100 text-xs focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-xs"
                    >
                      <option value="" disabled>
                        -- Klik untuk Pilih Pejabat / Pelaksana --
                      </option>
                      <option value="pelaksana_add">
                        {currentDesa.pelaksanaADD?.nama} — {currentDesa.pelaksanaADD?.jabatan || 'Pelaksana Kegiatan ADD'}
                      </option>
                      <option value="pelaksana_dds">
                        {currentDesa.pelaksanaDDS?.nama} — {currentDesa.pelaksanaDDS?.jabatan || 'Pelaksana Kegiatan DDS'}
                      </option>
                      <option value="sekdes">
                        {currentDesa.sekretarisDesa?.nama} — Sekretaris Desa
                      </option>
                      <option value="bendahara">
                        {currentDesa.bendaharaDesa?.nama} — Bendahara Desa
                      </option>
                      <option value="kades">
                        {currentDesa.kepalaDesa?.nama} — {currentDesa.kepalaDesa?.jabatan}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="font-medium text-slate-300 block mb-1 text-[11px]">
                      Nama Pelaksana Kegiatan (atau ketik manual)
                    </label>
                    <input
                      type="text"
                      value={pelaksanaNama}
                      onChange={(e) => setPelaksanaNama(e.target.value)}
                      placeholder="Nama Pelaksana Kegiatan"
                      className="w-full p-2 border border-slate-700 rounded-lg bg-slate-900 font-semibold uppercase text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="font-medium text-slate-300 block mb-1 text-[11px]">
                      Jabatan Pelaksana (atau ketik manual)
                    </label>
                    <input
                      type="text"
                      value={pelaksanaJabatan}
                      onChange={(e) => setPelaksanaJabatan(e.target.value)}
                      placeholder="Contoh: Kaur Keuangan / Kasi Pemerintahan / TPK"
                      className="w-full p-2 border border-slate-700 rounded-lg bg-slate-900 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-300 space-y-0.5">
                <div>
                  <span className="font-semibold text-slate-400">Pj. Kades:</span>{' '}
                  <span className="text-white">{currentDesa.kepalaDesa.nama}</span> (NIP: {currentDesa.kepalaDesa.nip || '-'})
                </div>
                <div>
                  <span className="font-semibold text-slate-400">Sekdes:</span>{' '}
                  <span className="text-white">{currentDesa.sekretarisDesa.nama}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-400">Bendahara:</span>{' '}
                  <span className="text-white">{currentDesa.bendaharaDesa.nama}</span>
                </div>
              </div>
            </div>

            {/* Rekanan Penyedia */}
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-bold text-slate-200 text-xs block">
                  Data Perusahaan / Toko / Penyedia Barang
                </span>
                <div className="flex items-center gap-2">
                  {onOpenMasterData && (
                    <button
                      type="button"
                      onClick={() => onOpenMasterData('rekanan')}
                      className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-700 px-2 py-1 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                      title="Kelola data rekanan desa"
                    >
                      <Store className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Kelola Master Rekanan</span>
                    </button>
                  )}
                  {masterRekanans.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <select
                        onChange={(e) => {
                          const rek = masterRekanans.find((r) => r.id === e.target.value);
                          if (rek) {
                            setPenyedia({
                              namaPerusahaan: rek.namaPerusahaan,
                              pimpinan: rek.pimpinan,
                              jabatan: rek.jabatan,
                              alamat: rek.alamat,
                              kota: rek.kota,
                              noTelepon: rek.noTelepon || '',
                            });
                          }
                        }}
                        defaultValue=""
                        className="bg-slate-900 text-emerald-300 border border-slate-700 text-[11px] font-semibold py-1 px-2 rounded-lg cursor-pointer hover:bg-slate-800 transition focus:ring-1 focus:ring-emerald-500"
                        title="Pilih data rekanan yang sudah tersimpan di desa"
                      >
                        <option value="" disabled>
                          -- Pilih Rekanan Tersimpan (Katalog Semua Desa) --
                        </option>
                        {masterRekanans.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.namaPerusahaan} — {r.pimpinan} ({r.kota})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-medium text-slate-300 block mb-1">
                    Nama Usaha / Toko *
                  </label>
                  <input
                    type="text"
                    required
                    value={penyedia.namaPerusahaan}
                    onChange={(e) =>
                      setPenyedia({ ...penyedia, namaPerusahaan: e.target.value })
                    }
                    placeholder="Contoh: UD. NIAT"
                    className="w-full p-2 border border-slate-700 rounded-lg bg-slate-900 text-white font-bold focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-300 block mb-1">
                    Nama Pimpinan / Pemilik *
                  </label>
                  <input
                    type="text"
                    required
                    value={penyedia.pimpinan}
                    onChange={(e) =>
                      setPenyedia({ ...penyedia, pimpinan: e.target.value })
                    }
                    placeholder="HADRIANUS DAELI"
                    className="w-full p-2 border border-slate-700 rounded-lg bg-slate-900 text-white uppercase font-semibold focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-300 block mb-1">
                  Jabatan Pimpinan
                </label>
                <input
                  type="text"
                  value={penyedia.jabatan}
                  onChange={(e) =>
                    setPenyedia({ ...penyedia, jabatan: e.target.value })
                  }
                  placeholder="Pimpinan UD. NIAT"
                  className="w-full p-2 border border-slate-700 rounded-lg bg-slate-900 text-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-medium text-slate-300 block mb-1">
                    Alamat Lengkap
                  </label>
                  <input
                    type="text"
                    value={penyedia.alamat}
                    onChange={(e) =>
                      setPenyedia({ ...penyedia, alamat: e.target.value })
                    }
                    placeholder="Balogawu, Kecamatan Sirombu"
                    className="w-full p-2 border border-slate-700 rounded-lg bg-slate-900 text-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-300 block mb-1">
                    Kota / Wilayah Toko
                  </label>
                  <input
                    type="text"
                    value={penyedia.kota}
                    onChange={(e) =>
                      setPenyedia({ ...penyedia, kota: e.target.value })
                    }
                    placeholder="Balogawu"
                    className="w-full p-2 border border-slate-700 rounded-lg bg-slate-900 text-white focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: DAFTAR BARANG YANG DIBELI */}
        <div className="bg-slate-900/90 rounded-2xl p-6 shadow-sm border border-slate-800">
          <div className="flex flex-wrap justify-between items-center mb-4 border-b border-slate-800 pb-3 gap-2">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <span>Rincian Barang / Belanja yang Dipesan</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Edit nama spesifikasi, volume, satuan, dan harga satuan barang
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {onOpenMasterData && (
                <button
                  type="button"
                  onClick={() => onOpenMasterData('barang')}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs cursor-pointer transition active:scale-95"
                  title="Buka dan kelola master daftar barang untuk semua user"
                >
                  <Package className="w-4 h-4" />
                  <span>Kelola Master Barang</span>
                </button>
              )}

              {sortedMasterBarangs.length > 0 && (
                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs">
                  <Package className="w-3.5 h-3.5 text-emerald-400" />
                  <select
                    onChange={(e) => {
                      const brg = sortedMasterBarangs.find((b) => b.id === e.target.value);
                      if (brg) {
                        const newItem: SpjItem = {
                          id: `item-${Date.now()}`,
                          nama: brg.nama + (brg.keterangan ? ` - ${brg.keterangan}` : ''),
                          spesifikasi: brg.keterangan || '',
                          volume: 1,
                          satuan: brg.satuan,
                          hargaSatuan: brg.hargaSatuan,
                          jumlahHarga: brg.hargaSatuan,
                          kondisiBaik: 1,
                          kondisiRusak: 0,
                          keterangan:
                            brg.keterangan ||
                            (kategoriBelanja === 'makanan_minuman'
                              ? 'Makanan dan minuman dalam kondisi baik dan layak'
                              : 'Seluruh Barang yang diterima berada dalam keadaan baik dan cukup'),
                        };
                        setItems([...items, newItem]);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                    className="bg-transparent font-semibold text-emerald-300 text-xs border-none cursor-pointer focus:outline-none"
                    title="Pilih barang dari daftar master untuk menambah baris baru"
                  >
                    <option value="" disabled className="bg-slate-900 text-slate-400">
                      + Tambah dari Master Barang (A-Z)
                    </option>
                    {sortedMasterBarangs.map((b) => (
                      <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                        {b.nama} (Rp {formatRupiah(b.hargaSatuan)}/{b.satuan})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow cursor-pointer transition border border-slate-700"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Baris Kosong</span>
              </button>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900 border-b border-slate-800 font-semibold text-slate-300">
                <tr>
                  <th className="p-2.5 w-10 text-center">No</th>
                  <th className="p-2.5 min-w-[260px]">Nama dan Spesifikasi Barang</th>
                  <th className="p-2.5 w-24 text-center">Volume</th>
                  <th className="p-2.5 w-24">Satuan</th>
                  <th className="p-2.5 w-40 text-right">
                    <span>Harga Satuan (Rp)</span>
                    <span className="block text-[9px] font-normal text-emerald-400">bisa diedit manual</span>
                  </th>
                  <th className="p-2.5 w-36 text-right">Jumlah (Rp)</th>
                  <th className="p-2.5 w-12 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {items.map((it, idx) => (
                  <tr key={it.id || idx} className="hover:bg-slate-900/50">
                    <td className="p-2.5 text-center font-semibold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="p-2.5">
                      <div className="space-y-1.5">
                        {sortedMasterBarangs.length > 0 && (
                          <select
                            onChange={(e) => {
                              const brg = sortedMasterBarangs.find((b) => b.id === e.target.value);
                              if (brg) {
                                const updated = [...items];
                                const vol = updated[idx].volume || 1;
                                updated[idx] = {
                                  ...updated[idx],
                                  nama: brg.nama + (brg.keterangan ? ` - ${brg.keterangan}` : ''),
                                  spesifikasi: brg.keterangan || '',
                                  satuan: brg.satuan,
                                  hargaSatuan: brg.hargaSatuan,
                                  jumlahHarga: vol * brg.hargaSatuan,
                                  keterangan: brg.keterangan || updated[idx].keterangan,
                                };
                                setItems(updated);
                                e.target.value = '';
                              }
                            }}
                            defaultValue=""
                            title="Pilih nama dan spesifikasi otomatis dari Master Barang (A-Z)"
                            className="w-full p-1.5 border border-slate-700 rounded text-[11px] bg-slate-900 text-emerald-300 font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          >
                            <option value="" disabled className="bg-slate-900 text-slate-400">
                              &darr; Pilih Master Barang (Katalog Bersama Semua Desa A-Z)...
                            </option>
                            {sortedMasterBarangs.map((b) => (
                              <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                                {b.nama} {b.keterangan ? `(${b.keterangan})` : ''} — Rp {formatRupiah(b.hargaSatuan)}/{b.satuan}
                              </option>
                            ))}
                          </select>
                        )}
                        <input
                          type="text"
                          required
                          value={it.nama}
                          onChange={(e) =>
                            handleItemChange(idx, 'nama', e.target.value)
                          }
                          placeholder="Nama dan spesifikasi teknis barang..."
                          className="w-full p-1.5 border border-slate-700 rounded font-medium text-xs bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </td>
                    <td className="p-2.5">
                      <input
                        type="number"
                        min="0"
                        value={it.volume === 0 ? '' : it.volume}
                        onChange={(e) =>
                          handleItemChange(
                            idx,
                            'volume',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="0"
                        className="w-full p-1.5 border border-slate-700 rounded text-center font-bold text-xs bg-slate-900 text-white focus:ring-1 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="p-2.5">
                      <input
                        type="text"
                        value={it.satuan}
                        onChange={(e) =>
                          handleItemChange(idx, 'satuan', e.target.value)
                        }
                        placeholder="unit/kotak"
                        className="w-full p-1.5 border border-slate-700 rounded text-xs bg-slate-900 text-white focus:ring-1 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="p-2.5">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={it.hargaSatuan === 0 ? '' : it.hargaSatuan}
                        onChange={(e) =>
                          handleItemChange(
                            idx,
                            'hargaSatuan',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="0"
                        className="w-full p-1.5 border border-slate-700 rounded text-right font-mono text-xs font-semibold bg-slate-900 text-white focus:ring-1 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-emerald-400">
                      {formatRupiah(it.jumlahHarga)}
                    </td>
                    <td className="p-2.5 text-center">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-950/50 rounded cursor-pointer transition"
                          title="Hapus baris"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-900 border-t-2 border-slate-700 font-bold">
                <tr>
                  <td colSpan={5} className="p-3 text-right text-xs text-slate-300 uppercase">
                    Total Belanja Kotor (Sebelum Pajak):
                  </td>
                  <td className="p-3 text-right text-sm font-mono text-emerald-400">
                    Rp {formatRupiah(totalBelanja)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* SECTION 5: PENGATURAN & EDIT DATA PAJAK */}
        <div className="bg-white text-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200" style={{ colorScheme: 'light' }}>
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
                  5
                </span>
                <span>Perhitungan &amp; Potongan Pajak Otomatis</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Perhitungan pajak terhitung otomatis saat menambah/mengubah belanja, dan dapat disesuaikan manual jika diperlukan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setPajak(hitungPajakOtomatis(kategoriBelanja, totalBelanja, undefined, true));
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-300 transition cursor-pointer shadow-xs"
              title="Hitung ulang otomatis sesuai aturan baku perpajakan"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
              <span>Hitung Ulang Otomatis</span>
            </button>
          </div>

          {/* BANNER RUMUS PERHITUNGAN OTOMATIS */}
          {kategoriBelanja === 'barang' && (
            <div className={`p-4 rounded-xl mb-4 border text-xs leading-relaxed ${
              totalBelanja > 2000000
                ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                : 'bg-amber-50/60 border-amber-200 text-amber-900'
            }`}>
              {totalBelanja > 2000000 ? (
                <div>
                  <div className="flex items-center justify-between font-bold mb-2">
                    <span className="flex items-center gap-1.5 text-emerald-900 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Rumus Perhitungan Pajak Barang Umum (&gt; Rp 2.000.000):
                    </span>
                    <span className="bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                      Aktif Otomatis
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-[11px] pt-1">
                    <div className="p-2.5 bg-white rounded-lg border border-emerald-200 shadow-2xs">
                      <span className="text-[10px] text-slate-500 block uppercase font-sans">1. Dasar Pengenaan Pajak (DPP)</span>
                      <div className="text-slate-700 mt-0.5">DPP = 100/111 &times; Nilai Belanja</div>
                      <div className="font-bold text-emerald-700 mt-1">
                        Rp {formatRupiah(hitungDppBarang(totalBelanja))}
                      </div>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-emerald-200 shadow-2xs">
                      <span className="text-[10px] text-slate-500 block uppercase font-sans">2. PPN (11% dari DPP)</span>
                      <div className="text-slate-700 mt-0.5">PPN = 11% &times; DPP</div>
                      <div className="font-bold text-emerald-700 mt-1">
                        Rp {formatRupiah(hitungPpnBarang(hitungDppBarang(totalBelanja), totalBelanja))}
                      </div>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-emerald-200 shadow-2xs">
                      <span className="text-[10px] text-slate-500 block uppercase font-sans">3. PPh Pasal 22 (1,5% dari DPP)</span>
                      <div className="text-slate-700 mt-0.5">PPh 22 = 1,5% &times; DPP</div>
                      <div className="font-bold text-emerald-700 mt-1">
                        Rp {formatRupiah(hitungPph22Barang(hitungDppBarang(totalBelanja)))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Ketentuan Pajak Barang Umum:</span> Nilai belanja barang saat ini adalah <strong>Rp {formatRupiah(totalBelanja)}</strong> (tidak melebihi Rp 2.000.000). Sesuai ketentuan, pengadaan barang &le; Rp 2.000.000 <strong>bebas dari pemotongan PPN dan PPh 22</strong> (Pajak otomatis Rp 0). Pajak akan otomatis aktif dan terhitung bila total belanja bertambah melebihi Rp 2.000.000.
                  </div>
                </div>
              )}
            </div>
          )}

          {kategoriBelanja === 'makanan_minuman' && (
            <div className="p-4 rounded-xl mb-4 border border-amber-300 bg-amber-50/70 text-amber-950 text-xs leading-relaxed">
              <div className="flex items-center justify-between font-bold mb-2">
                <span className="flex items-center gap-1.5 text-amber-900 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  Ketentuan Khusus Belanja Makanan dan Minuman:
                </span>
                <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                  PHR (10%) &amp; PPh 23 (2%)
                </span>
              </div>
              <p className="text-amber-800 text-[11px] mb-2">
                Khusus untuk belanja makanan dan minuman, pajak yang dipotong adalah <strong>PHR (10%)</strong> dan <strong>PPh 23 (2%)</strong> dari total nilai belanja. PPN dan PPh 22 tidak dikenakan.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-[11px]">
                <div className="p-2.5 bg-white rounded-lg border border-amber-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block uppercase font-sans">1. PHR / PBJT Makan Minum (10%)</span>
                  <div className="text-slate-700 mt-0.5">10% &times; Rp {formatRupiah(totalBelanja)}</div>
                  <div className="font-bold text-amber-700 mt-1">
                    Rp {formatRupiah(Math.round(0.10 * totalBelanja))}
                  </div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-amber-200 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block uppercase font-sans">2. PPh Pasal 23 (2%)</span>
                  <div className="text-slate-700 mt-0.5">2% &times; Rp {formatRupiah(totalBelanja)}</div>
                  <div className="font-bold text-amber-700 mt-1">
                    Rp {formatRupiah(Math.round(0.02 * totalBelanja))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {kategoriBelanja === 'sewa' && (
            <div className="p-4 rounded-xl mb-4 border border-indigo-200 bg-indigo-50/60 text-indigo-950 text-xs leading-relaxed">
              <div className="font-bold text-indigo-900 mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                Ketentuan Khusus Jasa Sewa:
              </div>
              <p className="text-indigo-800 text-[11px]">
                Belanja jasa/sewa dipotong <strong>PPh Pasal 23 sebesar 2%</strong> dari total belanja = <strong>Rp {formatRupiah(Math.round(0.02 * totalBelanja))}</strong>.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* PAJAK 1: PPN */}
            <div
              className={`p-3.5 rounded-xl border transition ${
                pajak.ppnAktif
                  ? 'bg-slate-50 border-emerald-300'
                  : 'bg-slate-50/40 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={pajak.ppnAktif}
                    onChange={(e) =>
                      setPajak({ ...pajak, ppnAktif: e.target.checked })
                    }
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>Pajak Pertambahan Nilai (PPN 11%)</span>
                </label>
                <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                  {totalBelanja > 2000000 && kategoriBelanja === 'barang' ? '11% dari DPP' : 'Barang > Rp 2 Jt'}
                </span>
              </div>

              {pajak.ppnAktif && (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="text-[11px] text-slate-700 block mb-0.5 font-medium">Persen (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={pajak.ppnPersen}
                      onChange={(e) => {
                        const pct = parseFloat(e.target.value) || 0;
                        const dpp = hitungDppBarang(totalBelanja);
                        setPajak({
                          ...pajak,
                          ppnPersen: pct,
                          ppnNominal: Math.round((pct / 100) * dpp),
                          ppnIsManual: true,
                        });
                      }}
                      className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white text-slate-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-700 block mb-0.5 font-medium">
                      Nominal Pajak (Rp)
                    </label>
                    <input
                      type="number"
                      value={pajak.ppnNominal}
                      onChange={(e) =>
                        setPajak({
                          ...pajak,
                          ppnNominal: parseFloat(e.target.value) || 0,
                          ppnIsManual: true,
                        })
                      }
                      className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white text-slate-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* PAJAK 2: PPh 22 (Barang > 2.000.000) */}
            <div
              className={`p-3.5 rounded-xl border transition ${
                pajak.pph22Aktif
                  ? 'bg-slate-50 border-emerald-300'
                  : 'bg-slate-50/40 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={pajak.pph22Aktif}
                    onChange={(e) =>
                      setPajak({ ...pajak, pph22Aktif: e.target.checked })
                    }
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>PPh Pasal 22 (1,5%)</span>
                </label>
                <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                  {totalBelanja > 2000000 ? 'Total > Rp 2 Jt (Kena PPh 22)' : 'Total <= Rp 2 Jt (Bebas)'}
                </span>
              </div>

              {pajak.pph22Aktif && (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="text-[11px] text-slate-700 block mb-0.5 font-medium">Persen (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={pajak.pph22Persen}
                      onChange={(e) => {
                        const pct = parseFloat(e.target.value) || 0;
                        const dpp = hitungDppBarang(totalBelanja);
                        setPajak({
                          ...pajak,
                          pph22Persen: pct,
                          pph22Nominal: Math.round((pct / 100) * dpp),
                          pph22IsManual: true,
                        });
                      }}
                      className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white text-slate-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-700 block mb-0.5 font-medium">
                      Nominal Pajak (Rp)
                    </label>
                    <input
                      type="number"
                      value={pajak.pph22Nominal}
                      onChange={(e) =>
                        setPajak({
                          ...pajak,
                          pph22Nominal: parseFloat(e.target.value) || 0,
                          pph22IsManual: true,
                        })
                      }
                      className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white text-slate-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* PAJAK 3: PHR (10% Total Belanja Makanan dan Minuman) */}
            <div
              className={`p-3.5 rounded-xl border transition ${
                pajak.phrAktif
                  ? 'bg-amber-50/50 border-amber-300'
                  : 'bg-slate-50/40 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={pajak.phrAktif}
                    onChange={(e) =>
                      setPajak({ ...pajak, phrAktif: e.target.checked })
                    }
                    className="w-4 h-4 text-amber-600 rounded"
                  />
                  <span>PHR / Pajak Makan &amp; Minum (10%)</span>
                </label>
                <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-amber-200 text-amber-800">
                  Wajib untuk Konsumsi
                </span>
              </div>

              {pajak.phrAktif && (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="text-[11px] text-slate-700 block mb-0.5 font-medium">Persen (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={pajak.phrPersen}
                      onChange={(e) => {
                        const pct = parseFloat(e.target.value) || 0;
                        setPajak({
                          ...pajak,
                          phrPersen: pct,
                          phrNominal: Math.round((pct / 100) * totalBelanja),
                          phrIsManual: true,
                        });
                      }}
                      className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white text-slate-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-700 block mb-0.5 font-medium">
                      Nominal Pajak (Rp)
                    </label>
                    <input
                      type="number"
                      value={pajak.phrNominal}
                      onChange={(e) =>
                        setPajak({
                          ...pajak,
                          phrNominal: parseFloat(e.target.value) || 0,
                          phrIsManual: true,
                        })
                      }
                      className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white text-slate-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* PAJAK 4: PPh 23 (2% Sewa / Makanan Minuman) */}
            <div
              className={`p-3.5 rounded-xl border transition ${
                pajak.pph23Aktif
                  ? 'bg-indigo-50/50 border-indigo-300'
                  : 'bg-slate-50/40 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={pajak.pph23Aktif}
                    onChange={(e) =>
                      setPajak({ ...pajak, pph23Aktif: e.target.checked })
                    }
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span>PPh Pasal 23 (2%)</span>
                </label>
                <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-800">
                  Makan Minum / Jasa Sewa
                </span>
              </div>

              {pajak.pph23Aktif && (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="text-[11px] text-slate-700 block mb-0.5 font-medium">Persen (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={pajak.pph23Persen}
                      onChange={(e) => {
                        const pct = parseFloat(e.target.value) || 0;
                        setPajak({
                          ...pajak,
                          pph23Persen: pct,
                          pph23Nominal: Math.round((pct / 100) * totalBelanja),
                          pph23IsManual: true,
                        });
                      }}
                      className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white text-slate-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-700 block mb-0.5 font-medium">
                      Nominal Pajak (Rp)
                    </label>
                    <input
                      type="number"
                      value={pajak.pph23Nominal}
                      onChange={(e) =>
                        setPajak({
                          ...pajak,
                          pph23Nominal: parseFloat(e.target.value) || 0,
                          pph23IsManual: true,
                        })
                      }
                      className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white text-slate-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ringkasan Akhir Pembayaran */}
          <div className="mt-5 p-4 bg-slate-900 text-white rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs text-slate-400">Total Potongan Pajak:</div>
              <div className="text-sm font-bold text-rose-400 font-mono">
                Rp {formatRupiah(totalPajak)}
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">
                Jumlah Bersih yang Dibayarkan ke Penyedia:
              </div>
              <div className="text-xl font-extrabold text-white font-mono">
                Rp {formatRupiah(jumlahDibayarkan)}
              </div>
              <div className="text-[11px] text-slate-300 italic mt-0.5 max-w-md">
                Terbilang: ({terbilang(totalBelanja)})
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 6: KHUSUS MAKANAN & MINUMAN - DAFTAR HADIR */}
        {kategoriBelanja === 'makanan_minuman' && (
          <div className="bg-amber-50/40 text-slate-900 rounded-2xl p-6 shadow-sm border border-amber-200" style={{ colorScheme: 'light' }}>
            <div className="flex flex-wrap justify-between items-center mb-4 border-b border-amber-200 pb-3 gap-2">
              <div>
                <h2 className="text-sm font-bold text-amber-950 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center text-xs font-bold">
                    6
                  </span>
                  <span>Lampiran Daftar Hadir (Khusus Makanan &amp; Minuman)</span>
                </h2>
                <p className="text-xs text-amber-800 mt-0.5">
                  Tanggal otomatis disamakan dengan Tanggal Faktur (
                  {formatTanggalIndonesia(tanggalFaktur)}).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (daftarHadir.length >= 300) {
                      alert('Batas maksimal daftar hadir adalah 300 baris.');
                      return;
                    }
                    const newSlot: PesertaHadir = {
                      id: `p-${Date.now()}`,
                      no: daftarHadir.length + 1,
                      nama: '',
                      jabatan: '',
                      alamatInstansi: '',
                    };
                    setDaftarHadir([...daftarHadir, newSlot]);
                  }}
                  className="flex items-center gap-1.5 bg-amber-700 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow cursor-pointer transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah 1 Baris</span>
                </button>
              </div>
            </div>

            {/* Pilihan Jumlah Baris Peserta */}
            <div className="p-3 bg-white border border-amber-200 rounded-xl mb-4 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-700" />
                  <span>Pilihan Jumlah Baris Peserta (Maks. 300):</span>
                </span>
                <span className="text-[11px] text-amber-800">
                  Saat ini: <strong>{daftarHadir.length} baris</strong>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-slate-500">Pilihan Cepat:</span>
                {[10, 25, 50, 100, 150, 200, 300].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => handleGenerateDaftarHadirRows(count)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                      daftarHadir.length === count
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-slate-50 hover:bg-amber-50 text-slate-700 border-slate-300'
                    }`}
                  >
                    {count} Baris
                  </button>
                ))}

                <div className="flex items-center gap-1.5 sm:ml-auto">
                  <label className="text-[11px] text-slate-600">Ketik Jumlah (1-300):</label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={jumlahBarisInput}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setJumlahBarisInput(isNaN(val) ? 1 : Math.min(300, Math.max(1, val)));
                    }}
                    className="w-16 p-1 border border-slate-300 rounded text-center text-xs font-bold bg-slate-50 text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => handleGenerateDaftarHadirRows(jumlahBarisInput)}
                    className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded text-xs font-semibold cursor-pointer"
                  >
                    Terapkan
                  </button>
                  <button
                    type="button"
                    onClick={() => setDaftarHadir([])}
                    className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-semibold cursor-pointer ml-1"
                    title="Kosongkan seluruh baris peserta"
                  >
                    Kosongkan Semua
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Nama Kegiatan (Daftar Hadir)
                </label>
                <input
                  type="text"
                  value={daftarHadirJudul}
                  onChange={(e) => setDaftarHadirJudul(e.target.value)}
                  placeholder="Kosongkan jika tidak ada subjudul"
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-medium"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Otomatis diambil langsung dari Nama Kegiatan di atas
                </span>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Tempat Pelaksanaan
                </label>
                <input
                  type="text"
                  value={daftarHadirTempat}
                  onChange={(e) => setDaftarHadirTempat(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-medium"
                />
              </div>
            </div>

            {/* Table of Attendees: No, Nama Peserta, Jabatan/Unsur, Tanda Tangan, Ket. */}
            <div className="overflow-x-auto border border-amber-200 rounded-xl bg-white max-h-96">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-amber-100/70 sticky top-0 border-b border-amber-200 font-bold text-slate-800">
                  <tr>
                    <th className="p-2.5 w-12 text-center">No</th>
                    <th className="p-2.5 text-center min-w-[200px]">Nama Peserta</th>
                    <th className="p-2.5 text-center min-w-[180px]">Jabatan/Unsur</th>
                    <th className="p-2.5 text-center w-36">Tanda Tangan</th>
                    <th className="p-2.5 text-center w-32">Ket.</th>
                    <th className="p-2.5 w-10 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {daftarHadir.map((p, idx) => {
                    const isOdd = (idx + 1) % 2 !== 0;
                    return (
                      <tr key={p.id || idx} className="hover:bg-amber-50/30">
                        <td className="p-2 text-center text-slate-500 font-semibold">
                          {idx + 1}
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={p.nama}
                            onChange={(e) => {
                              const updated = [...daftarHadir];
                              updated[idx].nama = e.target.value;
                              setDaftarHadir(updated);
                            }}
                            placeholder="(Kosongkan jika tanda tangan fisik)"
                            className="w-full p-1 border border-slate-200 rounded text-xs bg-white text-slate-900 font-medium text-center focus:text-left"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={p.jabatan}
                            onChange={(e) => {
                              const updated = [...daftarHadir];
                              updated[idx].jabatan = e.target.value;
                              setDaftarHadir(updated);
                            }}
                            placeholder="Jabatan / Unsur"
                            className="w-full p-1 border border-slate-200 rounded text-xs bg-white text-slate-900 font-medium text-center focus:text-left"
                          />
                        </td>
                        <td className="p-2 align-middle">
                          <div className={`w-full flex ${isOdd ? 'justify-start pl-2' : 'justify-end pr-2'}`}>
                            <span className="font-mono text-[10px] text-slate-500 font-medium">
                              {idx + 1}. .........
                            </span>
                          </div>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={p.alamatInstansi || ''}
                            onChange={(e) => {
                              const updated = [...daftarHadir];
                              updated[idx].alamatInstansi = e.target.value;
                              setDaftarHadir(updated);
                            }}
                            placeholder="Keterangan"
                            className="w-full p-1 border border-slate-200 rounded text-xs bg-white text-slate-900 font-medium text-center"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setDaftarHadir(
                                daftarHadir.filter((_, i) => i !== idx)
                              );
                            }}
                            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                            title="Hapus baris ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {daftarHadir.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-500 bg-amber-50/20">
                        <Users className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-60" />
                        <div className="font-semibold text-xs text-amber-950">
                          Daftar peserta saat ini kosong.
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                          Gunakan tombol <strong>Pilihan Cepat</strong> di atas (misal: 15 Baris atau 20 Baris) untuk menyiapkan formulir tanda tangan secara otomatis.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BOTTOM ACTION BAR */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 sticky bottom-4 shadow-lg z-20">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            Batal
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDirectPreview}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-lg text-xs font-semibold shadow transition cursor-pointer"
            >
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Pratinjau &amp; Cetak PDF</span>
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg text-xs font-semibold shadow-md transition cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Dokumen SPJ</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
