import React, { useState, useMemo } from 'react';
import { SpjDocument, DesaProfile, KategoriBelanja, SumberDana } from '../types';
import { useApp } from '../context/AppContext';
import { formatTanggalIndonesia } from '../utils/dateHelper';
import { formatRupiah } from '../utils/terbilang';
import {
  FileText,
  Printer,
  Edit2,
  Copy,
  Trash2,
  Search,
  Filter,
  PlusCircle,
  Building2,
  Coins,
  Receipt,
  Calendar,
  Layers,
  CheckCircle2,
  Store,
  Package,
  Cloud,
  ArrowUpDown,
  Users,
  ChevronDown,
  ChevronRight,
  Shield,
  FolderTree,
  X,
} from 'lucide-react';

/**
 * Ekstrak kunci nomor urut pesanan untuk sorting numerik yang akurat.
 * Contoh format: 400/ 01 /DS.2001/2026 atau 400/ 15 /DS.2001/2026 atau 400/ ...... /DS...
 */
function extractNomorPesananKey(nomor: string): { num: number; raw: string } {
  if (!nomor) return { num: -1, raw: '' };
  const parts = nomor.split('/');
  const middlePart = parts.length >= 3 ? parts[1].trim() : nomor.trim();
  const digitsMatch = middlePart.match(/\d+/);
  const num = digitsMatch ? parseInt(digitsMatch[0], 10) : -1;
  return { num, raw: middlePart };
}

function compareNomorPesanan(a: SpjDocument, b: SpjDocument, ascending: boolean = false): number {
  const keyA = extractNomorPesananKey(a.nomorSuratPesanan);
  const keyB = extractNomorPesananKey(b.nomorSuratPesanan);

  // Jika keduanya memiliki angka urut yang valid
  if (keyA.num !== -1 && keyB.num !== -1) {
    if (keyA.num !== keyB.num) {
      return ascending ? keyA.num - keyB.num : keyB.num - keyA.num;
    }
  } else if (keyA.num !== -1 && keyB.num === -1) {
    // Nomor dengan angka valid didahulukan dari yang kosong ('......')
    return -1;
  } else if (keyA.num === -1 && keyB.num !== -1) {
    return 1;
  }

  // Jika angka sama atau keduanya tidak punya angka valid, urutkan string alami
  const strCompare = keyA.raw.localeCompare(keyB.raw, undefined, { numeric: true, sensitivity: 'base' });
  if (strCompare !== 0) {
    return ascending ? strCompare : -strCompare;
  }

  // Fallback ke string lengkap nomorSuratPesanan
  const fullCompare = (a.nomorSuratPesanan || '').localeCompare(b.nomorSuratPesanan || '', undefined, {
    numeric: true,
    sensitivity: 'base',
  });
  if (fullCompare !== 0) {
    return ascending ? fullCompare : -fullCompare;
  }

  // Fallback ke tanggal faktur
  return (b.tanggalFaktur || '').localeCompare(a.tanggalFaktur || '');
}

interface SpjListProps {
  onNewSpj: () => void;
  onEditSpj: (spj: SpjDocument) => void;
  onPrintSpj: (spj: SpjDocument) => void;
  onOpenMasterData?: () => void;
  onOpenCloudSync?: (desaId?: string) => void;
}

export const SpjList: React.FC<SpjListProps> = ({
  onNewSpj,
  onEditSpj,
  onPrintSpj,
  onOpenMasterData,
  onOpenCloudSync,
}) => {
  const { spjs, activeDesa, desas, users, activeDesaId, setActiveDesaId, currentUser, deleteSpj, duplicateSpj } = useApp();

  const isAdmin = currentUser?.role === 'admin';
  const [adminGroupBy, setAdminGroupBy] = useState<'desa' | 'none'>('desa');
  const [adminDesaFilter, setAdminDesaFilter] = useState<string>('all');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const expandAllGroups = () => {
    setCollapsedGroups({});
  };

  const collapseAllGroups = () => {
    const next: Record<string, boolean> = {};
    desas.forEach((d) => {
      next[`desa-${d.id}`] = true;
    });
    setCollapsedGroups(next);
  };

  const desaMap = useMemo(() => {
    const map = new Map<string, DesaProfile>();
    desas.forEach((d) => map.set(d.id, d));
    return map;
  }, [desas]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterSumberDana, setFilterSumberDana] = useState<string>('all');
  const [filterKategori, setFilterKategori] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'nomor_desc' | 'nomor_asc' | 'tanggal_desc' | 'tanggal_asc'>('nomor_desc');
  const [confirmDeleteSpjId, setConfirmDeleteSpjId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Filter spjs by active desa unless admin viewing all
  const filteredSpjs = spjs.filter((spj) => {
    // If user is desa, only show their village SPJs
    if (!isAdmin && currentUser?.desaId) {
      if (spj.desaId !== currentUser.desaId) return false;
    } else if (isAdmin) {
      if (adminDesaFilter !== 'all' && spj.desaId !== adminDesaFilter) {
        return false;
      }
    }

    // Filter Sumber Dana
    if (filterSumberDana !== 'all') {
      if (filterSumberDana === 'DDS' && (spj.sumberDana === 'DDS' || spj.sumberDana === 'DD')) {
        // match DDS
      } else if (spj.sumberDana !== filterSumberDana) {
        return false;
      }
    }

    // Filter Kategori
    if (filterKategori !== 'all' && spj.kategoriBelanja !== filterKategori) {
      return false;
    }

    // Search query: pencarian cepat dan komprehensif di banyak data SPJ
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const matchKegiatan = spj.namaKegiatan.toLowerCase().includes(q);
      const matchPenyedia = spj.penyedia.namaPerusahaan.toLowerCase().includes(q);
      const matchPimpinan = (spj.penyedia.pimpinan || '').toLowerCase().includes(q);
      const matchPelaksana = (spj.pelaksanaNama || '').toLowerCase().includes(q);
      const matchNomor = spj.nomorSuratPesanan.toLowerCase().includes(q);
      const matchFaktur = spj.nomorFaktur.toLowerCase().includes(q);
      const matchBAST = (spj.nomorBAST || '').toLowerCase().includes(q);
      const matchTahun = (spj.tahunAnggaran || '').toLowerCase().includes(q);
      const spjDesa = desaMap.get(spj.desaId);
      const matchDesa = (spjDesa?.namaDesa || '').toLowerCase().includes(q);
      const matchKecamatan = (spjDesa?.kecamatan || '').toLowerCase().includes(q);
      const matchItem = spj.items && spj.items.some((it) => it.nama.toLowerCase().includes(q));

      if (
        !matchKegiatan &&
        !matchPenyedia &&
        !matchPimpinan &&
        !matchPelaksana &&
        !matchNomor &&
        !matchFaktur &&
        !matchBAST &&
        !matchTahun &&
        !matchDesa &&
        !matchKecamatan &&
        !matchItem
      ) {
        return false;
      }
    }

    return true;
  });

  // Urutkan SPJ sesuai nomor pesanan (default: terbesar ke terkecil)
  const sortedSpjs = useMemo(() => {
    return [...filteredSpjs].sort((a, b) => {
      if (sortBy === 'nomor_desc') {
        return compareNomorPesanan(a, b, false);
      }
      if (sortBy === 'nomor_asc') {
        return compareNomorPesanan(a, b, true);
      }
      if (sortBy === 'tanggal_desc') {
        return (b.tanggalFaktur || '').localeCompare(a.tanggalFaktur || '');
      }
      if (sortBy === 'tanggal_asc') {
        return (a.tanggalFaktur || '').localeCompare(b.tanggalFaktur || '');
      }
      return compareNomorPesanan(a, b, false);
    });
  }, [filteredSpjs, sortBy]);

  // Kelompokkan SPJ per Desa (khusus Admin)
  const desaGroups = useMemo(() => {
    const sortedDesas = [...desas].sort((a, b) => a.namaDesa.localeCompare(b.namaDesa, 'id'));

    return sortedDesas
      .map((desa) => {
        const desaSpjs = sortedSpjs.filter((s) => s.desaId === desa.id);
        const user = users.find((u) => u.desaId === desa.id);
        const totalBelanja = desaSpjs.reduce((acc, s) => acc + (s.totalBelanja || 0), 0);
        const totalDibayarkan = desaSpjs.reduce((acc, s) => acc + (s.jumlahDibayarkan || 0), 0);
        return {
          id: desa.id,
          desa,
          user,
          spjs: desaSpjs,
          totalBelanja,
          totalDibayarkan,
        };
      })
      .filter((group) => {
        if (adminDesaFilter !== 'all') {
          return group.id === adminDesaFilter;
        }
        if (searchQuery.trim() !== '' || filterSumberDana !== 'all' || filterKategori !== 'all') {
          return group.spjs.length > 0;
        }
        return true;
      });
  }, [desas, users, sortedSpjs, adminDesaFilter, searchQuery, filterSumberDana, filterKategori]);

  // Calculate statistics
  const totalBelanjaAll = sortedSpjs.reduce((acc, s) => acc + (s.totalBelanja || 0), 0);
  const totalPajakAll = sortedSpjs.reduce((acc, s) => acc + (s.totalPajak || 0), 0);
  const totalDibayarkanAll = sortedSpjs.reduce((acc, s) => acc + (s.jumlahDibayarkan || 0), 0);

  const getKategoriBadge = (kat: KategoriBelanja) => {
    switch (kat) {
      case 'makanan_minuman':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/60">
            Makanan &amp; Minuman (+ Daftar Hadir)
          </span>
        );
      case 'sewa':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-800/60">
            Sewa Peralatan (PPh 23)
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
            Barang Umum (PPN / PPh 22)
          </span>
        );
    }
  };

  const renderSpjCard = (spj: SpjDocument) => {
    const isMakanan = spj.kategoriBelanja === 'makanan_minuman';
    const pesananKey = extractNomorPesananKey(spj.nomorSuratPesanan);
    const spjDesa = desaMap.get(spj.desaId);

    return (
      <div
        key={spj.id}
        className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-sm hover:border-emerald-500/50 hover:bg-slate-900 transition flex flex-col md:flex-row md:items-center justify-between gap-5"
      >
        {/* Information Left */}
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* Tampilkan Nama Desa jika Admin sedang melihat daftar tanpa grup atau grup pengguna */}
            {isAdmin && spjDesa && adminGroupBy !== 'desa' && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-indigo-400" />
                <span>Desa {spjDesa.namaDesa}</span>
              </span>
            )}

            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-950 text-emerald-400 border border-slate-800">
              {spj.sumberDana === 'DD'
                ? 'Dana Desa (DD)'
                : spj.sumberDana === 'ADD'
                ? 'Alokasi Dana Desa (ADD)'
                : spj.sumberDana}
            </span>
            {getKategoriBadge(spj.kategoriBelanja)}
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{formatTanggalIndonesia(spj.tanggalFaktur)}</span>
            </span>
          </div>

          <h3 className="text-base font-bold text-white leading-snug">
            {spj.namaKegiatan}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 text-xs text-slate-300">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-slate-400">Surat Pesanan:</span>{' '}
              <span className="font-mono font-bold text-slate-200">{spj.nomorSuratPesanan}</span>
              {pesananKey.num !== -1 && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                  #{pesananKey.num}
                </span>
              )}
            </div>
            <div>
              <span className="text-slate-400">Penyedia:</span>{' '}
              <span className="font-semibold text-slate-200">
                {spj.penyedia.namaPerusahaan}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Pelaksana:</span>{' '}
              <span className="font-medium text-slate-200">{spj.pelaksanaNama}</span>
            </div>
          </div>

          {/* Items summary */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-400">
            <span className="font-medium text-slate-300">Barang:</span>
            {spj.items.map((it, idx) => (
              <span
                key={idx}
                className="bg-slate-800/90 text-slate-300 border border-slate-700/60 px-2 py-0.5 rounded text-[11px]"
              >
                {it.nama} ({it.volume} {it.satuan})
              </span>
            ))}
          </div>
        </div>

        {/* Financial Summary & Actions Right */}
        <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800 flex-shrink-0">
          <div className="text-left md:text-right">
            <div className="text-[11px] text-slate-400">
              Total Belanja: <strong className="font-mono text-slate-200">Rp {formatRupiah(spj.totalBelanja)}</strong>
            </div>
            <div className="text-[11px] text-rose-400">
              Potongan Pajak: <strong className="font-mono">Rp {formatRupiah(spj.totalPajak)}</strong>
            </div>
            <div className="text-sm font-extrabold text-emerald-400 font-mono mt-0.5">
              Dibayar: Rp {formatRupiah(spj.jumlahDibayarkan)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => onPrintSpj(spj)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer active:scale-95"
              title="Lihat Pratinjau &amp; Cetak PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak PDF</span>
            </button>

            <button
              onClick={() => onEditSpj(spj)}
              className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-xl transition cursor-pointer"
              title="Edit Data SPJ"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                duplicateSpj(spj.id);
                setNotification(`Dokumen SPJ "${spj.namaKegiatan}" berhasil diduplikasi.`);
                setTimeout(() => setNotification(null), 3500);
              }}
              className="p-2 text-slate-300 hover:text-indigo-400 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-xl transition cursor-pointer"
              title="Duplikasi Dokumen SPJ"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            {confirmDeleteSpjId === spj.id ? (
              <div className="flex items-center gap-1.5 bg-rose-950/80 border border-rose-800 px-2.5 py-1 rounded-xl shadow-xs">
                <span className="text-[11px] text-rose-300 font-bold whitespace-nowrap">Hapus?</span>
                <button
                  onClick={() => {
                    deleteSpj(spj.id);
                    setConfirmDeleteSpjId(null);
                    setNotification(`Dokumen SPJ "${spj.namaKegiatan}" berhasil dihapus.`);
                    setTimeout(() => setNotification(null), 3500);
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-2 py-0.5 rounded text-[11px] font-bold shadow-xs transition cursor-pointer"
                  title="Konfirmasi hapus dokumen"
                >
                  Ya
                </button>
                <button
                  onClick={() => setConfirmDeleteSpjId(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer"
                  title="Batal"
                >
                  Batal
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDeleteSpjId(spj.id)}
                className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-rose-950/50 border border-slate-700/60 rounded-xl transition cursor-pointer"
                title="Hapus Dokumen SPJ"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner / Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 relative overflow-hidden border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Pemerintah Kabupaten Nias Barat
              </span>
              <span className="text-xs text-slate-400">
                TA. 2026
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Sistem Surat Pertanggungjawaban (SPJ) Desa
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Membuat otomatis <strong className="text-white">Surat Pesanan</strong>, <strong className="text-white">Faktur</strong>, <strong className="text-white">Berita Acara Pemeriksaan &amp; Serah Terima Barang</strong>, serta <strong className="text-white">Daftar Hadir</strong> sesuai regulasi perpajakan dana desa.
            </p>
          </div>

          <div className="flex-shrink-0 flex flex-wrap items-center gap-2.5">
            {onOpenCloudSync && (
              <button
                onClick={() => onOpenCloudSync(activeDesa?.id)}
                className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-3 rounded-xl border border-slate-700 shadow-md transition active:scale-95 cursor-pointer text-sm"
                title={`Sinkronkan atau Cadangkan data Desa ${activeDesa?.namaDesa || ''} ke Cloud Firebase`}
              >
                <Cloud className="w-4 h-4 text-emerald-400" />
                <span>Cloud &bull; Backup Desa</span>
              </button>
            )}
            {onOpenMasterData && (
              <button
                onClick={onOpenMasterData}
                className="flex items-center gap-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-3 rounded-xl border border-slate-700 shadow-md transition active:scale-95 cursor-pointer text-sm"
                title="Kelola Master Rekanan dan Daftar Barang"
              >
                <Package className="w-4 h-4 text-emerald-400" />
                <span>Master Rekanan &amp; Barang</span>
              </button>
            )}
            <button
              onClick={onNewSpj}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-3 rounded-xl shadow-lg transition active:scale-95 cursor-pointer text-sm"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Buat SPJ Baru</span>
            </button>
          </div>
        </div>

        {/* Decorative background element */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-800/90 border border-slate-700/60 flex items-center justify-center text-slate-300 flex-shrink-0">
            <FileText className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Dokumen SPJ</div>
            <div className="text-xl font-bold text-white mt-0.5">
              {filteredSpjs.length} Berkas
            </div>
            <div className="text-[11px] text-slate-500">
              Desa {activeDesa?.namaDesa || 'Fadoro'}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-800/90 border border-slate-700/60 flex items-center justify-center text-slate-300 flex-shrink-0">
            <Coins className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Belanja Kotor</div>
            <div className="text-xl font-bold text-white font-mono mt-0.5">
              Rp {formatRupiah(totalBelanjaAll)}
            </div>
            <div className="text-[11px] text-slate-500">Sebelum dipotong pajak</div>
          </div>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-800/90 border border-slate-700/60 flex items-center justify-center text-slate-300 flex-shrink-0">
            <Receipt className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Pajak Dipotong</div>
            <div className="text-xl font-bold text-rose-400 font-mono mt-0.5">
              Rp {formatRupiah(totalPajakAll)}
            </div>
            <div className="text-[11px] text-slate-500">PPN / PPh / PHR</div>
          </div>
        </div>

        <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-800/90 border border-slate-700/60 flex items-center justify-center text-slate-300 flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Total Bersih Dibayarkan</div>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">
              Rp {formatRupiah(totalDibayarkanAll)}
            </div>
            <div className="text-[11px] text-slate-500">Diterima oleh Rekanan</div>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="mb-6 p-3.5 rounded-2xl text-xs bg-emerald-950/70 text-emerald-200 border border-emerald-800/60 flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="font-semibold">{notification}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-emerald-400 hover:text-white font-bold px-2 py-0.5 rounded cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-sm mb-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Search Input dengan Tombol Bersihkan */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kegiatan, barang/spesifikasi, nomor surat/faktur, rekanan, pelaksana, atau desa..."
              className="w-full pl-10 pr-9 py-2.5 text-xs border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-950 text-white placeholder-slate-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                title="Hapus kata kunci pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Desa Khusus Admin */}
            {isAdmin && (
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <select
                  value={adminDesaFilter}
                  onChange={(e) => setAdminDesaFilter(e.target.value)}
                  className="p-1.5 border border-slate-700 rounded-lg bg-slate-950 text-xs text-emerald-300 font-semibold focus:ring-2 focus:ring-emerald-500"
                  title="Saring Desa"
                >
                  <option value="all">Semua Desa ({desas.length} Desa)</option>
                  {desas.map((d) => (
                    <option key={d.id} value={d.id}>
                      Desa {d.namaDesa} ({d.kecamatan})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Urutan (Sorting) */}
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="p-1.5 border border-emerald-600/50 rounded-lg bg-slate-950 text-xs text-emerald-400 font-semibold focus:ring-2 focus:ring-emerald-500"
                title="Pilihan Urutan Dokumen SPJ"
              >
                <option value="nomor_desc">Nomor Pesanan: Terbesar ke Terkecil (&darr;)</option>
                <option value="nomor_asc">Nomor Pesanan: Terkecil ke Terbesar (&uarr;)</option>
                <option value="tanggal_desc">Tanggal Faktur: Terbaru (&darr;)</option>
                <option value="tanggal_asc">Tanggal Faktur: Terlama (&uarr;)</option>
              </select>
            </div>

            {/* Sumber Dana Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterSumberDana}
                onChange={(e) => setFilterSumberDana(e.target.value)}
                className="p-1.5 border border-slate-700 rounded-lg bg-slate-950 text-xs text-slate-200 font-medium focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Semua Sumber Dana</option>
                <option value="ADD">Alokasi Dana Desa (ADD)</option>
                <option value="DDS">Dana Desa (DDS)</option>
                <option value="PBH">Pendapatan Dana Bagi Hasil (PBH)</option>
                <option value="PAD">Pendapatan Asli Desa (PAD)</option>
                <option value="DLL">Pendapatan Lain-lain (DLL)</option>
              </select>
            </div>

            {/* Kategori Belanja Filter */}
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="p-1.5 border border-slate-700 rounded-lg bg-slate-950 text-xs text-slate-200 font-medium focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Semua Kategori Belanja</option>
              <option value="barang">Barang / Perlengkapan Umum</option>
              <option value="makanan_minuman">Makanan &amp; Minuman</option>
              <option value="sewa">Sewa</option>
            </select>
          </div>
        </div>

        {/* Indikator Hasil Pencarian & Tombol Reset Cepat */}
        {searchQuery.trim() !== '' && (
          <div className="flex items-center justify-between bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>
                Ditemukan <strong className="text-emerald-400 font-bold">{sortedSpjs.length}</strong> dari{' '}
                <strong className="text-slate-200">{spjs.length}</strong> dokumen SPJ untuk pencarian &quot;
                <strong className="text-white">{searchQuery}</strong>&quot;
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-emerald-300 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <span>Reset Pencarian</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Admin Mode Bar: Pengelompokan SPJ */}
      {isAdmin && (
        <div className="mb-6 p-3 bg-slate-900/90 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center">
              <FolderTree className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Mode Pengelompokan Admin</span>
              <span className="text-[11px] text-slate-400">
                Kelompokkan dokumen SPJ berdasarkan wilayah desa atau tampilkan semua berkas
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {adminGroupBy === 'desa' && (
              <div className="flex items-center gap-1.5 text-xs mr-1">
                <button
                  type="button"
                  onClick={expandAllGroups}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition cursor-pointer"
                  title="Buka semua daftar desa"
                >
                  Buka Semua Desa
                </button>
                <button
                  type="button"
                  onClick={collapseAllGroups}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition cursor-pointer"
                  title="Tutup semua daftar desa"
                >
                  Tutup Semua Desa
                </button>
              </div>
            )}

            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setAdminGroupBy('desa')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  adminGroupBy === 'desa'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Kelompokkan per Desa</span>
              </button>
              <button
                type="button"
                onClick={() => setAdminGroupBy('none')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  adminGroupBy === 'none'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>Semua (Tanpa Grup)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Documents List */}
      {sortedSpjs.length === 0 ? (
        <div className="bg-slate-900/90 rounded-2xl p-12 text-center border border-slate-800 shadow-sm">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">Belum Ada Dokumen SPJ</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-5">
            {searchQuery || filterSumberDana !== 'all' || filterKategori !== 'all' || adminDesaFilter !== 'all'
              ? 'Tidak ada SPJ yang cocok dengan kriteria pencarian dan filter.'
              : `Belum ada berkas SPJ yang dibuat untuk Desa ${activeDesa?.namaDesa || 'ini'}. Mulai dengan membuat SPJ baru.`}
          </p>
          <button
            onClick={onNewSpj}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Buat SPJ Pertama</span>
          </button>
        </div>
      ) : (
        <>
          {/* 1. ADMIN MODE: GROUP BY DESA */}
          {isAdmin && adminGroupBy === 'desa' && (
            <div className="space-y-6">
              {desaGroups.map((group) => {
                const isCollapsed = !!collapsedGroups[`desa-${group.id}`];

                return (
                  <div
                    key={group.id}
                    className="bg-slate-900/95 border border-slate-800 rounded-2xl overflow-hidden shadow-sm transition hover:border-slate-700"
                  >
                    {/* Header Grup Desa */}
                    <div
                      onClick={() => toggleGroupCollapse(`desa-${group.id}`)}
                      className="p-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 hover:bg-slate-800/70 cursor-pointer flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 transition select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-950/70 border border-emerald-800/60 flex items-center justify-center text-emerald-400 font-bold shadow-inner">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-white tracking-wide">
                              Desa {group.desa.namaDesa}
                            </h3>
                            <span className="text-xs text-slate-400 font-normal">
                              Kecamatan {group.desa.kecamatan}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-emerald-400 border border-slate-700 font-bold">
                              DS.{group.desa.kodeDesa}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                            <span>
                              Akun Pengguna:{' '}
                              <strong className="text-slate-200">
                                {group.user ? `${group.user.nama} (@${group.user.username})` : 'Belum Terdaftar'}
                              </strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                            {group.spjs.length} Dokumen SPJ
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700 font-mono">
                            Rp {formatRupiah(group.totalBelanja)}
                          </span>
                        </div>
                        <div className="p-1 rounded-lg text-slate-400 hover:text-white transition">
                          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>

                    {/* Konten Berkas SPJ dalam Grup Desa */}
                    {!isCollapsed && (
                      <div className="p-4 space-y-3.5 bg-slate-950/40">
                        {group.spjs.length === 0 ? (
                          <div className="text-center py-6 text-slate-500 text-xs italic">
                            Belum ada berkas SPJ untuk Desa {group.desa.namaDesa}.
                          </div>
                        ) : (
                          group.spjs.map((spj) => renderSpjCard(spj))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. DEFAULT LIST (Non-admin or admin groupBy === 'none') */}
          {(!isAdmin || adminGroupBy === 'none') && (
            <div className="space-y-4">
              {sortedSpjs.map((spj) => renderSpjCard(spj))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
