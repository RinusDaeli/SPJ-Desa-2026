import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MasterRekanan, MasterBarang, KategoriBelanja } from '../types';
import { formatRupiah } from '../utils/terbilang';
import {
  Store,
  Package,
  Plus,
  Trash2,
  Edit2,
  Search,
  X,
  Check,
  CheckCircle,
  Building2,
  Tag,
  Phone,
  MapPin,
  Coins,
  Cloud,
  RefreshCw,
  Globe,
} from 'lucide-react';

interface MasterDataManagerProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'rekanan' | 'barang';
}

export const MasterDataManager: React.FC<MasterDataManagerProps> = ({
  isOpen,
  onClose,
  defaultTab = 'rekanan',
}) => {
  const {
    masterRekanans,
    addMasterRekanan,
    updateMasterRekanan,
    deleteMasterRekanan,
    masterBarangs,
    addMasterBarang,
    updateMasterBarang,
    deleteMasterBarang,
    activeDesa,
    isCloudOnline,
    isSyncing,
    cloudLastSync,
    syncMasterDataCloud,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'rekanan' | 'barang'>(defaultTab);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  // Search states
  const [searchRekanan, setSearchRekanan] = useState('');
  const [searchBarang, setSearchBarang] = useState('');
  const [filterKategoriBarang, setFilterKategoriBarang] = useState<string>('all');
  const [confirmDeleteRekananId, setConfirmDeleteRekananId] = useState<string | null>(null);
  const [confirmDeleteBarangId, setConfirmDeleteBarangId] = useState<string | null>(null);

  // Rekanan form state
  const [showRekananModal, setShowRekananModal] = useState(false);
  const [editingRekanan, setEditingRekanan] = useState<MasterRekanan | null>(null);
  const [rekNamaPerusahaan, setRekNamaPerusahaan] = useState('');
  const [rekPimpinan, setRekPimpinan] = useState('');
  const [rekJabatan, setRekJabatan] = useState('Pimpinan');
  const [rekAlamat, setRekAlamat] = useState('');
  const [rekKota, setRekKota] = useState('Nias Barat');
  const [rekNoTelepon, setRekNoTelepon] = useState('');

  // Barang form state
  const [showBarangModal, setShowBarangModal] = useState(false);
  const [editingBarang, setEditingBarang] = useState<MasterBarang | null>(null);
  const [brgNama, setBrgNama] = useState('');
  const [brgSatuan, setBrgSatuan] = useState('unit');
  const [brgHargaSatuan, setBrgHargaSatuan] = useState<number>(0);
  const [brgKategori, setBrgKategori] = useState<KategoriBelanja>('barang');
  const [brgKeterangan, setBrgKeterangan] = useState('');

  // Notification state
  const [notification, setNotification] = useState<string | null>(null);

  // Manual trigger to sync master data to cloud
  const handleSyncCloud = async () => {
    const res = await syncMasterDataCloud();
    if (res.success) {
      setNotification(`✓ ${res.message}`);
    } else {
      setNotification(`⚠ Gagal: ${res.message}`);
    }
    setTimeout(() => setNotification(null), 4000);
  };

  if (!isOpen) return null;

  // Open Add Rekanan
  const handleOpenAddRekanan = () => {
    setEditingRekanan(null);
    setRekNamaPerusahaan('');
    setRekPimpinan('');
    setRekJabatan('Pimpinan');
    setRekAlamat('');
    setRekKota(activeDesa?.kabupaten || 'Nias Barat');
    setRekNoTelepon('');
    setShowRekananModal(true);
  };

  // Open Edit Rekanan
  const handleOpenEditRekanan = (rek: MasterRekanan) => {
    setEditingRekanan(rek);
    setRekNamaPerusahaan(rek.namaPerusahaan);
    setRekPimpinan(rek.pimpinan);
    setRekJabatan(rek.jabatan);
    setRekAlamat(rek.alamat);
    setRekKota(rek.kota);
    setRekNoTelepon(rek.noTelepon || '');
    setShowRekananModal(true);
  };

  // Save Rekanan
  const handleSaveRekanan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rekNamaPerusahaan.trim() || !rekPimpinan.trim()) return;

    if (editingRekanan) {
      updateMasterRekanan({
        ...editingRekanan,
        namaPerusahaan: rekNamaPerusahaan.trim(),
        pimpinan: rekPimpinan.trim().toUpperCase(),
        jabatan: rekJabatan.trim(),
        alamat: rekAlamat.trim(),
        kota: rekKota.trim(),
        noTelepon: rekNoTelepon.trim() || undefined,
      });
      setNotification(`Data penyedia "${rekNamaPerusahaan}" berhasil diperbarui & disinkronkan ke Cloud Firebase.`);
    } else {
      addMasterRekanan({
        namaPerusahaan: rekNamaPerusahaan.trim(),
        pimpinan: rekPimpinan.trim().toUpperCase(),
        jabatan: rekJabatan.trim(),
        alamat: rekAlamat.trim(),
        kota: rekKota.trim(),
        noTelepon: rekNoTelepon.trim() || undefined,
        desaId: undefined, // Katalog Bersama untuk SEMUA DESA
      });
      setNotification(`Penyedia "${rekNamaPerusahaan}" berhasil ditambahkan ke Cloud Firebase & langsung muncul di seluruh akun Desa!`);
    }

    setShowRekananModal(false);
    setTimeout(() => setNotification(null), 3500);
  };

  // Open Add Barang
  const handleOpenAddBarang = () => {
    setEditingBarang(null);
    setBrgNama('');
    setBrgSatuan('unit');
    setBrgHargaSatuan(0);
    setBrgKategori('barang');
    setBrgKeterangan('');
    setShowBarangModal(true);
  };

  // Open Edit Barang
  const handleOpenEditBarang = (brg: MasterBarang) => {
    setEditingBarang(brg);
    setBrgNama(brg.nama);
    setBrgSatuan(brg.satuan);
    setBrgHargaSatuan(brg.hargaSatuan);
    setBrgKategori(brg.kategori);
    setBrgKeterangan(brg.keterangan || '');
    setShowBarangModal(true);
  };

  // Save Barang
  const handleSaveBarang = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brgNama.trim()) return;

    if (editingBarang) {
      updateMasterBarang({
        ...editingBarang,
        nama: brgNama.trim(),
        satuan: brgSatuan.trim(),
        hargaSatuan: Number(brgHargaSatuan) || 0,
        kategori: brgKategori,
        keterangan: brgKeterangan.trim() || undefined,
      });
      setNotification(`Barang "${brgNama}" berhasil diperbarui & disinkronkan ke Cloud Firebase.`);
    } else {
      addMasterBarang({
        nama: brgNama.trim(),
        satuan: brgSatuan.trim(),
        hargaSatuan: Number(brgHargaSatuan) || 0,
        kategori: brgKategori,
        keterangan: brgKeterangan.trim() || undefined,
        desaId: undefined, // Katalog Bersama untuk SEMUA DESA
      });
      setNotification(`Barang "${brgNama}" berhasil ditambahkan ke Cloud Firebase & langsung muncul di seluruh akun Desa!`);
    }

    setShowBarangModal(false);
    setTimeout(() => setNotification(null), 3500);
  };

  // Filtered lists
  const filteredRekanans = masterRekanans.filter((r) => {
    const q = searchRekanan.toLowerCase();
    return (
      r.namaPerusahaan.toLowerCase().includes(q) ||
      r.pimpinan.toLowerCase().includes(q) ||
      r.alamat.toLowerCase().includes(q) ||
      r.kota.toLowerCase().includes(q)
    );
  });

  const filteredBarangs = masterBarangs
    .filter((b) => {
      if (filterKategoriBarang !== 'all' && b.kategori !== filterKategoriBarang) {
        return false;
      }
      const q = searchBarang.toLowerCase();
      return (
        b.nama.toLowerCase().includes(q) ||
        b.satuan.toLowerCase().includes(q) ||
        (b.keterangan && b.keterangan.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => a.nama.localeCompare(b.nama, 'id'));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 text-slate-100 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-800">
        {/* Header */}
        <div className="bg-slate-950 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 p-2.5 rounded-2xl">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">Master Data Desa: Rekanan &amp; Daftar Barang</h2>
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Cloud className="w-3 h-3 text-emerald-400" />
                  <span>Katalog Bersama Seluruh Desa</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Data rekanan &amp; barang terhubung ke Cloud Firebase: dapat diakses dan digunakan oleh seluruh akun desa di Kabupaten Nias Barat.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncCloud}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
              title="Sinkronkan data rekanan & barang ke Cloud Firebase sekarang"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Cloud'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition cursor-pointer p-1.5 rounded-xl hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 gap-2 pt-3">
          <button
            onClick={() => setActiveTab('rekanan')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition border-b-2 cursor-pointer ${
              activeTab === 'rekanan'
                ? 'border-emerald-500 text-emerald-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Store className="w-4 h-4 text-emerald-400" />
            <span>Data Rekanan / Penyedia ({masterRekanans.length})</span>
            <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-1.5 py-0.2 rounded-full font-normal">
              Semua Desa
            </span>
          </button>

          <button
            onClick={() => setActiveTab('barang')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition border-b-2 cursor-pointer ${
              activeTab === 'barang'
                ? 'border-emerald-500 text-emerald-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4 text-indigo-400" />
            <span>Master Daftar Barang ({masterBarangs.length})</span>
            <span className="text-[10px] bg-indigo-950 text-indigo-400 border border-indigo-800/80 px-1.5 py-0.2 rounded-full font-normal">
              Semua Desa
            </span>
          </button>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div className="mx-6 mt-4 p-3 rounded-xl text-xs bg-emerald-950/80 text-emerald-300 border border-emerald-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: DATA REKANAN */}
          {activeTab === 'rekanan' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchRekanan}
                    onChange={(e) => setSearchRekanan(e.target.value)}
                    placeholder="Cari nama toko, pimpinan, atau alamat..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-700 rounded-xl bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <button
                  onClick={handleOpenAddRekanan}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-semibold shadow cursor-pointer transition active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Rekanan Baru</span>
                </button>
              </div>

              {/* Grid of Rekanans */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredRekanans.map((rek) => (
                  <div
                    key={rek.id}
                    className="p-4 border border-slate-800 rounded-2xl bg-slate-950 hover:border-slate-700 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <h4 className="font-bold text-white text-sm truncate">
                            {rek.namaPerusahaan}
                          </h4>
                          <span className="text-[9px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 px-1.5 py-0.2 rounded-full font-medium inline-flex items-center gap-1 shrink-0">
                            <Globe className="w-2.5 h-2.5 text-emerald-400" />
                            <span>Semua Desa</span>
                          </span>
                        </div>
                        <span className="text-[10px] bg-slate-900 text-slate-300 border border-slate-800 px-2 py-0.5 rounded font-mono shrink-0">
                          {rek.kota}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-400">Pimpinan:</span>{' '}
                          <span className="text-white">{rek.pimpinan}</span>
                          <span className="text-slate-500">({rek.jabatan})</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                          <span className="truncate">{rek.alamat}</span>
                        </div>
                        {rek.noTelepon && (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            <span>{rek.noTelepon}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-end gap-2 text-xs">
                      <button
                        onClick={() => handleOpenEditRekanan(rek)}
                        className="flex items-center gap-1 text-slate-300 hover:text-emerald-400 p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer transition"
                        title="Edit data rekanan"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      {confirmDeleteRekananId === rek.id ? (
                        <div className="flex items-center gap-1 bg-rose-950/80 border border-rose-800 p-1 rounded-lg">
                          <span className="text-[10px] text-rose-300 font-bold">Hapus?</span>
                          <button
                            onClick={() => {
                              deleteMasterRekanan(rek.id);
                              setConfirmDeleteRekananId(null);
                              setNotification(`Rekanan "${rek.namaPerusahaan}" berhasil dihapus.`);
                              setTimeout(() => setNotification(null), 3000);
                            }}
                            className="bg-rose-600 hover:bg-rose-500 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-xs cursor-pointer"
                          >
                            Ya
                          </button>
                          <button
                            onClick={() => setConfirmDeleteRekananId(null)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded text-[10px] cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteRekananId(rek.id)}
                          className="flex items-center gap-1 text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-950/40 cursor-pointer transition"
                          title="Hapus rekanan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {filteredRekanans.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Tidak ada data rekanan yang cocok dengan pencarian.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MASTER BARANG */}
          {activeTab === 'barang' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchBarang}
                      onChange={(e) => setSearchBarang(e.target.value)}
                      placeholder="Cari nama barang atau spesifikasi..."
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-700 rounded-xl bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <select
                    value={filterKategoriBarang}
                    onChange={(e) => setFilterKategoriBarang(e.target.value)}
                    className="p-2 border border-slate-700 rounded-xl text-xs bg-slate-950 text-white cursor-pointer focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="all">Semua Kategori</option>
                    <option value="barang">Barang Umum</option>
                    <option value="makanan_minuman">Makanan &amp; Minuman</option>
                    <option value="sewa">Sewa</option>
                  </select>
                </div>

                <button
                  onClick={handleOpenAddBarang}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-xl text-xs font-semibold shadow cursor-pointer transition active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Barang Baru</span>
                </button>
              </div>

              {/* Table of Master Barangs */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900/90 border-b border-slate-800 font-semibold text-slate-300">
                    <tr>
                      <th className="p-2.5 w-10 text-center">No</th>
                      <th className="p-2.5">Nama &amp; Spesifikasi Barang</th>
                      <th className="p-2.5 w-28">Kategori</th>
                      <th className="p-2.5 w-20 text-center">Satuan</th>
                      <th className="p-2.5 w-36 text-right">Harga Acuan (Rp)</th>
                      <th className="p-2.5 w-24 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredBarangs.map((brg, idx) => (
                      <tr key={brg.id} className="hover:bg-slate-900/40">
                        <td className="p-2.5 text-center text-slate-500 font-medium">
                          {idx + 1}
                        </td>
                        <td className="p-2.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-white">{brg.nama}</span>
                            <span className="text-[9px] bg-indigo-950/70 text-indigo-400 border border-indigo-800/80 px-1.5 py-0.2 rounded-full font-medium inline-flex items-center gap-0.5">
                              <Globe className="w-2.5 h-2.5 text-indigo-400" />
                              <span>Semua Desa</span>
                            </span>
                          </div>
                          {brg.keterangan && (
                            <div className="text-[11px] text-slate-400">{brg.keterangan}</div>
                          )}
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              brg.kategori === 'makanan_minuman'
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                                : brg.kategori === 'sewa'
                                ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {brg.kategori === 'makanan_minuman'
                              ? 'Konsumsi'
                              : brg.kategori === 'sewa'
                              ? 'Sewa'
                              : 'Barang'}
                          </span>
                        </td>
                        <td className="p-2.5 text-center text-slate-400 font-mono">
                          {brg.satuan}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-emerald-400">
                          Rp {formatRupiah(brg.hargaSatuan)}
                        </td>
                        <td className="p-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEditBarang(brg)}
                              className="text-slate-300 hover:text-emerald-400 p-1 hover:bg-slate-800 rounded transition cursor-pointer"
                              title="Edit barang"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {confirmDeleteBarangId === brg.id ? (
                              <div className="flex items-center gap-1 bg-rose-950/80 border border-rose-800 p-0.5 rounded">
                                <button
                                  onClick={() => {
                                    deleteMasterBarang(brg.id);
                                    setConfirmDeleteBarangId(null);
                                    setNotification(`Barang "${brg.nama}" berhasil dihapus.`);
                                    setTimeout(() => setNotification(null), 3000);
                                  }}
                                  className="bg-rose-600 hover:bg-rose-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer"
                                >
                                  Ya
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteBarangId(null)}
                                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-1 py-0.5 rounded text-[10px] cursor-pointer"
                                >
                                  x
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteBarangId(brg.id)}
                                className="text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-950/40 rounded transition cursor-pointer"
                                title="Hapus barang"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL FORM REKANAN */}
      {showRekananModal && (
        <div className="fixed inset-0 z-60 bg-black/75 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveRekanan}
            className="bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-3 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm text-white">
                {editingRekanan ? 'Edit Master Rekanan' : 'Tambah Rekanan Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setShowRekananModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 bg-emerald-950/50 border border-emerald-800/80 rounded-xl text-[11px] text-emerald-300 flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Data rekanan ini otomatis tersimpan di Cloud Firebase &amp; dapat langsung digunakan oleh seluruh akun Desa.</span>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Nama Usaha / Perusahaan / Toko *
              </label>
              <input
                type="text"
                required
                value={rekNamaPerusahaan}
                onChange={(e) => setRekNamaPerusahaan(e.target.value)}
                placeholder="Contoh: UD. NIAT / Toko Komputer Sirombu"
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Nama Pimpinan / Direktur *
                </label>
                <input
                  type="text"
                  required
                  value={rekPimpinan}
                  onChange={(e) => setRekPimpinan(e.target.value.toUpperCase())}
                  placeholder="HADRIANUS DAELI"
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white uppercase focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Jabatan Pimpinan
                </label>
                <input
                  type="text"
                  value={rekJabatan}
                  onChange={(e) => setRekJabatan(e.target.value)}
                  placeholder="Pimpinan UD. NIAT"
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Alamat Usaha / Toko
              </label>
              <input
                type="text"
                value={rekAlamat}
                onChange={(e) => setRekAlamat(e.target.value)}
                placeholder="Jl. Pelabuhan Sirombu / Balogawu"
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Kota / Wilayah Tertulis
                </label>
                <input
                  type="text"
                  value={rekKota}
                  onChange={(e) => setRekKota(e.target.value)}
                  placeholder="Sirombu / Balogawu"
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Nomor HP / WA (Opsional)
                </label>
                <input
                  type="text"
                  value={rekNoTelepon}
                  onChange={(e) => setRekNoTelepon(e.target.value)}
                  placeholder="081234567890"
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowRekananModal(false)}
                className="px-3 py-1.5 text-slate-400 hover:text-white rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow cursor-pointer transition active:scale-95"
              >
                Simpan Rekanan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL FORM BARANG */}
      {showBarangModal && (
        <div className="fixed inset-0 z-60 bg-black/75 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveBarang}
            className="bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-3 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm text-white">
                {editingBarang ? 'Edit Master Barang' : 'Tambah Master Barang Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setShowBarangModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 bg-indigo-950/50 border border-indigo-800/80 rounded-xl text-[11px] text-indigo-300 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Data barang ini otomatis tersimpan di Cloud Firebase &amp; dapat langsung dipilih oleh seluruh akun Desa.</span>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Nama &amp; Spesifikasi Barang *
              </label>
              <input
                type="text"
                required
                value={brgNama}
                onChange={(e) => setBrgNama(e.target.value)}
                placeholder="Contoh: Laptop Asus Core i5 / Nasi Kotak"
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-medium focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Kategori
                </label>
                <select
                  value={brgKategori}
                  onChange={(e) => setBrgKategori(e.target.value as KategoriBelanja)}
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white cursor-pointer focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="barang">Barang Umum</option>
                  <option value="makanan_minuman">Makanan &amp; Minuman</option>
                  <option value="sewa">Sewa</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Satuan
                </label>
                <input
                  type="text"
                  required
                  value={brgSatuan}
                  onChange={(e) => setBrgSatuan(e.target.value)}
                  placeholder="unit, kotak, paket, dus"
                  className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Harga Satuan Acuan / Standar (Rp)
              </label>
              <input
                type="number"
                min="0"
                value={brgHargaSatuan}
                onChange={(e) => setBrgHargaSatuan(parseFloat(e.target.value) || 0)}
                placeholder="17500000"
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-emerald-400 font-mono font-bold focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-slate-400 mt-1 italic">
                * Harga acuan default ini nantinya tetap bisa diedit manual saat pembuatan SPJ.
              </p>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Keterangan Tambahan (Opsional)
              </label>
              <input
                type="text"
                value={brgKeterangan}
                onChange={(e) => setBrgKeterangan(e.target.value)}
                placeholder="misal: Kondisi baik dan bersegel resmi"
                className="w-full p-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowBarangModal(false)}
                className="px-3 py-1.5 text-slate-400 hover:text-white rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow cursor-pointer transition active:scale-95"
              >
                Simpan Barang
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
