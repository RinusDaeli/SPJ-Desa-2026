import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { DesaProfile, Role } from '../types';
import {
  ShieldCheck,
  Building2,
  Users,
  Download,
  Upload,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  UserPlus,
  Cloud,
  CloudUpload,
  CloudDownload,
  HardDrive,
} from 'lucide-react';
import { LogoNiasBarat, LogoDesaRenderer } from '../assets/logoDefault';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onEditDesa: (desa: DesaProfile) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, onEditDesa }) => {
  const {
    currentUser,
    desas,
    users,
    spjs,
    addDesa,
    deleteDesa,
    addUser,
    updateUser,
    deleteUser,
    exportBackup,
    importBackup,
    exportDesaBackup,
    importDesaBackup,
    uploadDesaCloud,
    downloadDesaCloud,
    uploadAllCloud,
    downloadAllCloud,
    isCloudOnline,
    isSyncing,
    cloudLastSync,
    firebaseProjectId,
    resetToDefault,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'desa' | 'users' | 'backup'>('desa');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filePerDesaInputRef = useRef<HTMLInputElement>(null);
  const [selectedBackupDesaId, setSelectedBackupDesaId] = useState<string>(desas[0]?.id || '');

  // New Desa Modal state
  const [showAddDesa, setShowAddDesa] = useState(false);
  const [newDesaNama, setNewDesaNama] = useState('');
  const [newDesaKode, setNewDesaKode] = useState('');
  const [newDesaKecamatan, setNewDesaKecamatan] = useState('Sirombu');
  const [newKadesNama, setNewKadesNama] = useState('');
  const [newKadesNip, setNewKadesNip] = useState('');
  const [newSekdesNama, setNewSekdesNama] = useState('');
  const [newBendaharaNama, setNewBendaharaNama] = useState('');
  const [newPelaksanaADDNama, setNewPelaksanaADDNama] = useState('');
  const [newPelaksanaDDSNama, setNewPelaksanaDDSNama] = useState('');
  const [autoCreateUserForDesa, setAutoCreateUserForDesa] = useState(true);

  // New User Modal state
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('123');
  const [newNamaLengkap, setNewNamaLengkap] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('desa');
  const [newUserDesaId, setNewUserDesaId] = useState<string>('');

  // Status message
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [confirmDeleteDesaId, setConfirmDeleteDesaId] = useState<string | null>(null);
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);

  if (!isOpen || currentUser?.role !== 'admin') return null;

  const handleCreateDesa = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedDesaNama = newDesaNama.trim();
    if (!trimmedDesaNama) return;

    // Check duplicate
    const exists = desas.some(
      (d) => d.namaDesa.toLowerCase() === trimmedDesaNama.toLowerCase()
    );
    if (exists) {
      setStatusMessage({
        type: 'error',
        text: `Desa dengan nama "${trimmedDesaNama}" sudah ada di sistem.`,
      });
      setTimeout(() => setStatusMessage(null), 3500);
      return;
    }

    const kodeToUse =
      newDesaKode.trim().toUpperCase() ||
      trimmedDesaNama.substring(0, 3).toUpperCase();

    const newDesaId = addDesa({
      namaDesa: trimmedDesaNama,
      kodeDesa: kodeToUse,
      kecamatan: newDesaKecamatan.trim() || 'Sirombu',
      kabupaten: 'Nias Barat',
      provinsi: 'Sumatera Utara',
      alamatKantor: `Desa ${trimmedDesaNama} Kecamatan ${newDesaKecamatan}`,
      kepalaDesa: {
        nama: newKadesNama.trim() || 'NAMA KEPALA DESA',
        nip: newKadesNip.trim() || '-',
        jabatan: 'Pj. Kepala Desa',
      },
      sekretarisDesa: {
        nama: newSekdesNama.trim() || 'NAMA SEKRETARIS DESA',
        jabatan: 'Sekretaris Desa',
      },
      bendaharaDesa: {
        nama: newBendaharaNama.trim() || 'NAMA BENDAHARA DESA',
        jabatan: 'Bendahara Desa',
      },
      pelaksanaADD: {
        nama: newPelaksanaADDNama.trim() || 'PELAKSANA ADD',
        jabatan: 'Pelaksana Kegiatan ADD',
      },
      pelaksanaDDS: {
        nama: newPelaksanaDDSNama.trim() || 'PELAKSANA DDS',
        jabatan: 'Pelaksana Kegiatan DDS',
      },
    });

    // Directly connect newly added desa to the user selection
    setNewUserDesaId(newDesaId);

    // If auto create user is active, automatically generate user account connected to this desa
    if (autoCreateUserForDesa) {
      const cleanName = trimmedDesaNama.toLowerCase().replace(/[^a-z0-9]/g, '');
      const genUsername = `desa${cleanName}`;
      addUser({
        username: genUsername,
        password: '123',
        nama: `Operator Desa ${trimmedDesaNama}`,
        role: 'desa',
        desaId: newDesaId,
      });

      setStatusMessage({
        type: 'success',
        text: `Desa ${trimmedDesaNama} berhasil ditambahkan dan langsung terhubung dengan akun login (@${genUsername})!`,
      });
    } else {
      setStatusMessage({
        type: 'success',
        text: `Desa ${trimmedDesaNama} berhasil ditambahkan!`,
      });
    }

    // Reset Form
    setNewDesaNama('');
    setNewDesaKode('');
    setNewKadesNama('');
    setNewKadesNip('');
    setNewSekdesNama('');
    setNewBendaharaNama('');
    setNewPelaksanaADDNama('');
    setNewPelaksanaDDSNama('');
    setShowAddDesa(false);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;

    const exists = users.some(
      (u) => u.username.toLowerCase() === newUsername.trim().toLowerCase()
    );
    if (exists) {
      setStatusMessage({
        type: 'error',
        text: `Nama pengguna "${newUsername}" sudah digunakan. Gunakan username lain.`,
      });
      setTimeout(() => setStatusMessage(null), 3500);
      return;
    }

    const assignedDesaId = newUserRole === 'desa' ? (newUserDesaId || desas[desas.length - 1]?.id) : undefined;

    addUser({
      username: newUsername.trim().toLowerCase(),
      password: newPassword,
      nama: newNamaLengkap.trim() || newUsername,
      role: newUserRole,
      desaId: assignedDesaId,
    });

    const targetDesa = desas.find((d) => d.id === assignedDesaId);
    const desaText = targetDesa ? ` (Terhubung ke Desa ${targetDesa.namaDesa})` : '';

    setShowAddUser(false);
    setNewUsername('');
    setNewNamaLengkap('');
    setStatusMessage({
      type: 'success',
      text: `Pengguna @${newUsername.trim().toLowerCase()} berhasil ditambahkan${desaText}!`,
    });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleFileRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const res = await importBackup(file);
    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => setStatusMessage(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 text-slate-100 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-800">
        {/* Header */}
        <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 p-2.5 rounded-2xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Panel Administrator Sistem SPJ</h2>
              <p className="text-xs text-slate-400">
                Kelola data Desa, akun pengguna, serta cadangkan &amp; pulihkan data (Backup &amp; Restore)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition cursor-pointer p-1.5 rounded-xl hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 gap-2 pt-3">
          <button
            onClick={() => setActiveTab('desa')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition border-b-2 cursor-pointer ${
              activeTab === 'desa'
                ? 'border-emerald-500 text-emerald-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>Kelola Desa ({desas.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition border-b-2 cursor-pointer ${
              activeTab === 'users'
                ? 'border-emerald-500 text-emerald-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Kelola Pengguna ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition border-b-2 cursor-pointer ${
              activeTab === 'backup'
                ? 'border-emerald-500 text-emerald-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Backup &amp; Restore</span>
          </button>
        </div>

        {/* Notifications */}
        {statusMessage && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                : 'bg-rose-950/80 text-rose-300 border border-rose-800'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: KELOLA DESA */}
          {activeTab === 'desa' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-white">Daftar Desa Terdaftar</h3>
                  <p className="text-xs text-slate-400">
                    Setiap desa memiliki pejabat, data pelaksana kegiatan, dan dokumen SPJ masing-masing.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddDesa(true)}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow cursor-pointer transition active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Desa Baru</span>
                </button>
              </div>

              {/* Add Desa Modal / Form */}
              {showAddDesa && (
                <form
                  onSubmit={handleCreateDesa}
                  className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3"
                >
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-bold text-white">Form Tambah Desa Baru</h4>
                    <button
                      type="button"
                      onClick={() => setShowAddDesa(false)}
                      className="text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Nama Desa *</label>
                      <input
                        type="text"
                        required
                        value={newDesaNama}
                        onChange={(e) => setNewDesaNama(e.target.value)}
                        placeholder="Contoh: Bawosaloo"
                        className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Kode Singkatan</label>
                      <input
                        type="text"
                        value={newDesaKode}
                        onChange={(e) => setNewDesaKode(e.target.value)}
                        placeholder="Contoh: BWS"
                        className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs uppercase focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Kecamatan</label>
                      <input
                        type="text"
                        value={newDesaKecamatan}
                        onChange={(e) => setNewDesaKecamatan(e.target.value)}
                        placeholder="Contoh: Sirombu"
                        className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Nama Pj. Kepala Desa</label>
                      <input
                        type="text"
                        value={newKadesNama}
                        onChange={(e) => setNewKadesNama(e.target.value)}
                        placeholder="Nama Lengkap Kades"
                        className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">NIP Kepala Desa</label>
                      <input
                        type="text"
                        value={newKadesNip}
                        onChange={(e) => setNewKadesNip(e.target.value)}
                        placeholder="19860117 201503 1 001"
                        className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Sekretaris Desa</label>
                      <input
                        type="text"
                        value={newSekdesNama}
                        onChange={(e) => setNewSekdesNama(e.target.value)}
                        placeholder="Nama Sekdes"
                        className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Bendahara Desa</label>
                      <input
                        type="text"
                        value={newBendaharaNama}
                        onChange={(e) => setNewBendaharaNama(e.target.value)}
                        placeholder="Nama Bendahara"
                        className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Pelaksana Kegiatan ADD</label>
                      <input
                        type="text"
                        value={newPelaksanaADDNama}
                        onChange={(e) => setNewPelaksanaADDNama(e.target.value)}
                        placeholder="Nama Pelaksana ADD"
                        className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Pelaksana Kegiatan DDS</label>
                      <input
                        type="text"
                        value={newPelaksanaDDSNama}
                        onChange={(e) => setNewPelaksanaDDSNama(e.target.value)}
                        placeholder="Nama Pelaksana DDS"
                        className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Auto-create user checkbox */}
                  <div className="pt-2 border-t border-slate-800">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoCreateUserForDesa}
                        onChange={(e) => setAutoCreateUserForDesa(e.target.checked)}
                        className="rounded text-emerald-500 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-slate-300">
                        Otomatis buat &amp; hubungkan akun login desa ini (Username:{' '}
                        <code className="text-emerald-400 font-mono bg-slate-900 px-1 rounded border border-slate-800">
                          desa{newDesaNama ? newDesaNama.toLowerCase().replace(/[^a-z0-9]/g, '') : '...'}
                        </code>
                        , Sandi: <code className="font-mono text-white">123</code>)
                      </span>
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddDesa(false)}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow cursor-pointer transition active:scale-95"
                    >
                      Simpan Desa Baru
                    </button>
                  </div>
                </form>
              )}

              {/* Grid Desa */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {desas.map((desa) => {
                  const spjCount = spjs.filter((s) => s.desaId === desa.id).length;
                  const desaUsers = users.filter((u) => u.desaId === desa.id);

                  return (
                    <div
                      key={desa.id}
                      className="border border-slate-800 bg-slate-950 p-4 rounded-2xl shadow-sm hover:border-slate-700 transition flex flex-col justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl p-1 flex items-center justify-center flex-shrink-0">
                          <LogoDesaRenderer logoUrl={desa.logoUrl} className="w-9 h-9" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-white truncate">
                              Desa {desa.namaDesa}
                            </span>
                            <span className="text-[10px] font-mono bg-slate-900 text-emerald-400 px-1.5 py-0.5 rounded border border-slate-800">
                              {desa.kodeDesa}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            Kecamatan {desa.kecamatan}, Kab. {desa.kabupaten}
                          </p>
                          <div className="mt-2 space-y-0.5 text-[11px] text-slate-300">
                            <div>
                              <span className="font-medium text-slate-400">Kades:</span>{' '}
                              <span className="text-white">{desa.kepalaDesa.nama}</span>
                            </div>
                            <div>
                              <span className="font-medium text-slate-400">Sekdes:</span>{' '}
                              <span className="text-white">{desa.sekretarisDesa.nama}</span>
                            </div>
                            <div>
                              <span className="font-medium text-slate-400">Pelaksana ADD:</span>{' '}
                              <span className="text-white">{desa.pelaksanaADD.nama}</span> | <span className="font-medium text-slate-400">DDS:</span> <span className="text-white">{desa.pelaksanaDDS.nama}</span>
                            </div>
                            <div className="pt-1 text-[11px] text-slate-400 flex items-center gap-1">
                              <span className="font-medium text-slate-400">Akun terhubung:</span>
                              {desaUsers.length > 0 ? (
                                desaUsers.map((du) => (
                                  <span key={du.id} className="font-mono bg-slate-900 text-emerald-400 border border-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                                    @{du.username}
                                  </span>
                                ))
                              ) : (
                                <span className="text-amber-400 italic">Belum ada akun</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="text-slate-400 font-medium">
                          {spjCount} Dokumen SPJ
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setActiveTab('users');
                              setShowAddUser(true);
                              setNewUserRole('desa');
                              setNewUserDesaId(desa.id);
                              const clean = desa.namaDesa.toLowerCase().replace(/[^a-z0-9]/g, '');
                              setNewUsername(`desa${clean}`);
                              setNewNamaLengkap(`Operator Desa ${desa.namaDesa}`);
                            }}
                            className="flex items-center gap-1 text-slate-200 hover:text-emerald-400 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 px-2 py-1 rounded-lg font-medium transition cursor-pointer"
                            title="Buat Akun Login untuk Desa ini"
                          >
                            <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                            <span>+ Akun</span>
                          </button>

                          <button
                            onClick={() => {
                              onEditDesa(desa);
                              onClose();
                            }}
                            className="flex items-center gap-1 text-emerald-300 hover:text-emerald-200 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-lg font-medium transition cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit Detail</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedBackupDesaId(desa.id);
                              setActiveTab('backup');
                            }}
                            className="flex items-center gap-1 text-indigo-300 hover:text-indigo-200 bg-indigo-950/60 border border-indigo-800/80 px-2.5 py-1 rounded-lg font-medium transition cursor-pointer"
                            title="Backup atau Sinkronkan Desa Ini ke Cloud Firebase"
                          >
                            <Cloud className="w-3 h-3 text-indigo-400" />
                            <span>Sync/Backup</span>
                          </button>

                          {desas.length > 1 && (
                            confirmDeleteDesaId === desa.id ? (
                              <div className="flex items-center gap-1 bg-rose-950/80 border border-rose-800 p-1 rounded-lg animate-fadeIn">
                                <span className="text-[10px] text-rose-300 font-bold">Hapus?</span>
                                <button
                                  onClick={() => {
                                    const ok = deleteDesa(desa.id);
                                    if (ok) {
                                      setStatusMessage({ type: 'success', text: `Desa ${desa.namaDesa} berhasil dihapus!` });
                                    } else {
                                      setStatusMessage({ type: 'error', text: 'Tidak dapat menghapus semua desa. Minimal tersisa 1 desa.' });
                                    }
                                    setConfirmDeleteDesaId(null);
                                    setTimeout(() => setStatusMessage(null), 3500);
                                  }}
                                  className="bg-rose-600 hover:bg-rose-500 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-xs cursor-pointer"
                                >
                                  Ya
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteDesaId(null)}
                                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded text-[10px] cursor-pointer"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteDesaId(desa.id)}
                                className="text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                                title="Hapus Desa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: KELOLA PENGGUNA */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-white">Daftar Akun Pengguna (Login)</h3>
                  <p className="text-xs text-slate-400">
                    Akun bertipe <strong className="text-emerald-400">Desa</strong> hanya dapat melihat dan mengelola berkas SPJ desanya sendiri.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddUser(true)}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow cursor-pointer transition active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Pengguna</span>
                </button>
              </div>

              {/* Add User Form */}
              {showAddUser && (
                <form
                  onSubmit={handleCreateUser}
                  className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3"
                >
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-bold text-white">Form Tambah Akun Pengguna</h4>
                    <button
                      type="button"
                      onClick={() => setShowAddUser(false)}
                      className="text-xs text-slate-400 hover:text-white cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">
                        Username (Nama Pengguna) *
                      </label>
                      <input
                        type="text"
                        required
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="Contoh: desafadoro"
                        className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Kata Sandi *</label>
                      <input
                        type="text"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 3 karakter"
                        className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs font-mono focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Nama Lengkap</label>
                      <input
                        type="text"
                        value={newNamaLengkap}
                        onChange={(e) => setNewNamaLengkap(e.target.value)}
                        placeholder="Contoh: Kaur Pembangunan Fadoro"
                        className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Peran (Role)</label>
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as Role)}
                        className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="desa">Operator / Pejabat Desa</option>
                        <option value="admin">Administrator (Akses Semua Desa)</option>
                      </select>
                    </div>

                    {newUserRole === 'desa' && (
                      <div>
                        <label className="font-semibold text-slate-300 block mb-1">
                          Hubungkan ke Desa:
                        </label>
                        <select
                          value={newUserDesaId}
                          onChange={(e) => setNewUserDesaId(e.target.value)}
                          className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                        >
                          <option value="">-- Pilih Desa --</option>
                          {desas.map((d) => (
                            <option key={d.id} value={d.id}>
                              Desa {d.namaDesa}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddUser(false)}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-xl cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow cursor-pointer transition active:scale-95"
                    >
                      Simpan Akun
                    </button>
                  </div>
                </form>
              )}

              {/* Table of Users */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-900/90 border-b border-slate-800 font-semibold text-slate-300">
                    <tr>
                      <th className="p-3">Nama &amp; Username</th>
                      <th className="p-3">Peran (Role)</th>
                      <th className="p-3">Desa Terkait</th>
                      <th className="p-3">Kata Sandi</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {users.map((u) => {
                      const userDesa = desas.find((d) => d.id === u.desaId);
                      return (
                        <tr key={u.id} className="hover:bg-slate-900/40">
                          <td className="p-3">
                            <div className="font-bold text-white">{u.nama}</div>
                            <div className="text-[11px] text-emerald-400 font-mono">@{u.username}</div>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                                u.role === 'admin'
                                  ? 'bg-purple-950/80 text-purple-300 border border-purple-800'
                                  : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                              }`}
                            >
                              {u.role === 'admin' ? 'Administrator' : 'Desa'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-300">
                            {u.role === 'admin' ? (
                              <span className="text-slate-400 italic">Semua Desa (Kabupaten)</span>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <select
                                  value={u.desaId || ''}
                                  onChange={(e) => {
                                    updateUser({ ...u, desaId: e.target.value });
                                    const dName = desas.find((d) => d.id === e.target.value)?.namaDesa || '';
                                    setStatusMessage({
                                      type: 'success',
                                      text: `Akun @${u.username} berhasil dihubungkan ke Desa ${dName}!`,
                                    });
                                    setTimeout(() => setStatusMessage(null), 3000);
                                  }}
                                  className="p-1.5 border border-slate-700 rounded-lg text-xs bg-slate-900 text-white font-semibold cursor-pointer max-w-[200px]"
                                  title="Ganti atau hubungkan akun ini ke desa lain"
                                >
                                  <option value="" disabled>-- Pilih Desa --</option>
                                  {desas.map((d) => (
                                    <option key={d.id} value={d.id}>
                                      Desa {d.namaDesa}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </td>
                          <td className="p-3 font-mono text-slate-400">{u.password}</td>
                          <td className="p-3 text-right">
                            {confirmDeleteUserId === u.id ? (
                              <div className="flex items-center justify-end gap-1.5 animate-fadeIn">
                                <span className="text-[10px] text-rose-400 font-bold">Hapus?</span>
                                <button
                                  onClick={() => {
                                    const ok = deleteUser(u.id);
                                    if (ok) {
                                      setStatusMessage({
                                        type: 'success',
                                        text: `Akun @${u.username} berhasil dihapus!`,
                                      });
                                    } else {
                                      setStatusMessage({
                                        type: 'error',
                                        text: 'Minimal tersisa 1 akun pengguna sistem.',
                                      });
                                    }
                                    setConfirmDeleteUserId(null);
                                    setTimeout(() => setStatusMessage(null), 3000);
                                  }}
                                  className="bg-rose-600 hover:bg-rose-500 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-xs cursor-pointer"
                                >
                                  Ya, Hapus
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteUserId(null)}
                                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded text-[10px] cursor-pointer"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              users.length > 1 && (
                                <button
                                  onClick={() => setConfirmDeleteUserId(u.id)}
                                  className="text-rose-400 hover:text-rose-300 p-1.5 hover:bg-rose-950/40 rounded-lg cursor-pointer transition"
                                  title="Hapus akun pengguna"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: BACKUP & RESTORE */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              {/* Header Status Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${isCloudOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                  <span className="font-bold">
                    {isCloudOnline ? 'Firebase Cloud Aktif' : 'Firebase Offline'}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">({firebaseProjectId || 'gen-lang-client-0767503923'})</span>
                </div>
                {cloudLastSync && (
                  <span className="text-slate-400 text-[11px]">
                    Sync Terakhir: <strong className="text-emerald-400">{cloudLastSync}</strong>
                  </span>
                )}
              </div>

              {/* SECTION 1: SINKRONISASI CLOUD FIREBASE PER DESA */}
              <div className="p-5 border-2 border-emerald-500/40 bg-slate-950 rounded-2xl space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <Cloud className="w-5 h-5 text-emerald-400" />
                      <h4>1. Sinkronisasi Cloud Firebase Khusus Per Desa</h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Pilihan ini memastikan <strong className="text-emerald-300">hanya data desa tertentu yang diunggah / ditarik</strong>. Data desa lainnya di komputer ini maupun di server sama sekali tidak akan terhapus atau tertimpa.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    Aman &bull; Terisolasi
                  </span>
                </div>

                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Pilih Desa Target:
                    </label>
                    <select
                      value={selectedBackupDesaId}
                      onChange={(e) => setSelectedBackupDesaId(e.target.value)}
                      className="w-full p-2 border border-slate-700 rounded-lg text-xs font-bold text-white bg-slate-950 cursor-pointer focus:ring-1 focus:ring-emerald-500"
                    >
                      {desas.map((d) => (
                        <option key={d.id} value={d.id}>
                          Desa {d.namaDesa} ({d.kecamatan}) &bull; {spjs.filter((s) => s.desaId === d.id).length} SPJ
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div>
                      Desa Terpilih: <strong className="text-white">{desas.find((d) => d.id === selectedBackupDesaId)?.namaDesa || '-'}</strong>
                    </div>
                    <div>
                      Arsip SPJ Lokal: <strong className="text-emerald-400">{spjs.filter((s) => s.desaId === selectedBackupDesaId).length} dokumen</strong>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={async () => {
                      if (!selectedBackupDesaId) return;
                      const res = await uploadDesaCloud(selectedBackupDesaId);
                      setStatusMessage({ type: res.success ? 'success' : 'error', text: res.message });
                      setTimeout(() => setStatusMessage(null), 4000);
                    }}
                    disabled={isSyncing}
                    className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow transition cursor-pointer active:scale-98 disabled:opacity-50"
                  >
                    <CloudUpload className="w-4 h-4" />
                    <span>Upload Desa Ini ke Cloud Firebase</span>
                  </button>

                  <button
                    onClick={async () => {
                      if (!selectedBackupDesaId) return;
                      const res = await downloadDesaCloud(selectedBackupDesaId);
                      setStatusMessage({ type: res.success ? 'success' : 'error', text: res.message });
                      setTimeout(() => setStatusMessage(null), 4000);
                    }}
                    disabled={isSyncing}
                    className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs border border-slate-700 shadow transition cursor-pointer active:scale-98 disabled:opacity-50"
                  >
                    <CloudDownload className="w-4 h-4 text-emerald-400" />
                    <span>Tarik Data Desa Ini dari Cloud</span>
                  </button>
                </div>
              </div>

              {/* SECTION 2: CADANGAN FILE JSON PER DESA */}
              <div className="p-5 border border-indigo-500/30 bg-slate-950 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                  <HardDrive className="w-5 h-5 text-indigo-400" />
                  <h4>2. Cadangan &amp; Pemulihan Berkas JSON Khusus Per Desa (Offline)</h4>
                </div>
                <p className="text-xs text-slate-400">
                  Simpan cadangan ke berkas <code>.json</code> di komputer untuk satu desa saja. Saat dipulihkan, desa-desa lain tetap utuh tanpa risiko tertimpa.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      if (!selectedBackupDesaId) return;
                      exportDesaBackup(selectedBackupDesaId);
                      const d = desas.find((x) => x.id === selectedBackupDesaId);
                      setStatusMessage({
                        type: 'success',
                        text: `File cadangan Desa ${d?.namaDesa || ''} berhasil diunduh.`,
                      });
                      setTimeout(() => setStatusMessage(null), 3500);
                    }}
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow transition cursor-pointer active:scale-98"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh File Cadangan (.json) Desa Ini</span>
                  </button>

                  <div>
                    <input
                      ref={filePerDesaInputRef}
                      type="file"
                      accept=".json"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const res = await importDesaBackup(file);
                        setStatusMessage({ type: res.success ? 'success' : 'error', text: res.message });
                        if (filePerDesaInputRef.current) filePerDesaInputRef.current.value = '';
                        setTimeout(() => setStatusMessage(null), 4000);
                      }}
                      className="hidden"
                      id="admin-restore-file-per-desa"
                    />
                    <label
                      htmlFor="admin-restore-file-per-desa"
                      className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-500/40 font-semibold py-2.5 px-4 rounded-xl text-xs shadow-xs transition cursor-pointer active:scale-98 text-center"
                    >
                      <Upload className="w-4 h-4 text-indigo-400" />
                      <span>Pulihkan File Cadangan (.json) Desa</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* SECTION 3: OPERASI MENYELURUH (SEMUA DESA) */}
              <div className="p-5 border border-slate-800 bg-slate-950/70 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-200 text-xs">
                    3. Operasi Menyeluruh (Semua Desa &bull; {desas.length} Desa, {spjs.length} SPJ)
                  </h4>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700 font-semibold">
                    Admin Kabupaten
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Cloud All */}
                  <div className="space-y-2">
                    <span className="font-semibold text-slate-400 block">Cloud Firebase (Semua):</span>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          const res = await uploadAllCloud();
                          setStatusMessage({ type: res.success ? 'success' : 'error', text: res.message });
                          setTimeout(() => setStatusMessage(null), 4000);
                        }}
                        disabled={isSyncing}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white py-2 px-3 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50 border border-slate-700"
                      >
                        <CloudUpload className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Upload Semua</span>
                      </button>

                      <button
                        onClick={async () => {
                          const res = await downloadAllCloud();
                          setStatusMessage({ type: res.success ? 'success' : 'error', text: res.message });
                          setTimeout(() => setStatusMessage(null), 4000);
                        }}
                        disabled={isSyncing}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white py-2 px-3 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50 border border-slate-700"
                      >
                        <CloudDownload className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Unduh Semua</span>
                      </button>
                    </div>
                  </div>

                  {/* File All */}
                  <div className="space-y-2">
                    <span className="font-semibold text-slate-400 block">File Berkas (.json) Semua:</span>
                    <div className="flex gap-2">
                      <button
                        onClick={exportBackup}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 px-3 rounded-xl text-xs font-semibold cursor-pointer border border-slate-700"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Unduh Semua</span>
                      </button>

                      <div className="flex-1">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".json"
                          onChange={handleFileRestore}
                          className="hidden"
                          id="admin-restore-file-all"
                        />
                        <label
                          htmlFor="admin-restore-file-all"
                          className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 px-3 rounded-xl text-xs font-semibold cursor-pointer text-center border border-slate-700"
                        >
                          <Upload className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Pulihkan Semua</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
