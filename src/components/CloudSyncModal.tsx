import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { DesaProfile } from '../types';
import { CloudDesaSummary } from '../firebase/firebaseService';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Building2,
  FileText,
  Download,
  Upload,
  HardDrive,
  Info,
  ShieldCheck,
  Check,
  Server,
} from 'lucide-react';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDesaId?: string;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  defaultDesaId,
}) => {
  const {
    desas,
    spjs,
    activeDesaId,
    currentUser,
    isCloudOnline,
    isSyncing,
    cloudLastSync,
    firebaseProjectId,
    checkCloudConnection,
    uploadDesaCloud,
    downloadDesaCloud,
    uploadAllCloud,
    downloadAllCloud,
    fetchCloudSummary,
    exportDesaBackup,
    importDesaBackup,
    exportBackup,
    importBackup,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'cloud' | 'file'>('cloud');
  const [selectedDesaId, setSelectedDesaId] = useState<string>(
    defaultDesaId || activeDesaId || desas[0]?.id || ''
  );
  const [cloudSummaries, setCloudSummaries] = useState<CloudDesaSummary[]>([]);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const filePerDesaRef = useRef<HTMLInputElement>(null);
  const fileAllRef = useRef<HTMLInputElement>(null);

  // Sync selectedDesaId when prop changes or modal opens
  useEffect(() => {
    if (currentUser?.role === 'desa' && currentUser.desaId) {
      setSelectedDesaId(currentUser.desaId);
    } else if (defaultDesaId) {
      setSelectedDesaId(defaultDesaId);
    } else if (activeDesaId) {
      setSelectedDesaId(activeDesaId);
    }
  }, [defaultDesaId, activeDesaId, currentUser, isOpen]);

  // Load cloud summaries when modal opens
  const refreshCloudStatus = async () => {
    setLoadingSummary(true);
    try {
      await checkCloudConnection();
      const summaries = await fetchCloudSummary();
      setCloudSummaries(summaries);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshCloudStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentSelectedDesa = desas.find((d) => d.id === selectedDesaId) || desas[0];
  const localDesaSpjs = spjs.filter((s) => s.desaId === selectedDesaId);
  const cloudInfoForDesa = cloudSummaries.find((c) => c.desaId === selectedDesaId);

  // Handlers for Cloud
  const handleUploadDesa = async () => {
    if (!currentSelectedDesa) return;
    const res = await uploadDesaCloud(currentSelectedDesa.id);
    if (res.success) {
      setActionMessage({ type: 'success', text: res.message });
      refreshCloudStatus();
    } else {
      setActionMessage({ type: 'error', text: res.message });
    }
    setTimeout(() => setActionMessage(null), 5000);
  };

  const handleDownloadDesa = async () => {
    if (!currentSelectedDesa) return;
    const res = await downloadDesaCloud(currentSelectedDesa.id);
    if (res.success) {
      setActionMessage({ type: 'success', text: res.message });
      refreshCloudStatus();
    } else {
      setActionMessage({ type: 'error', text: res.message });
    }
    setTimeout(() => setActionMessage(null), 5000);
  };

  const handleUploadAll = async () => {
    const res = await uploadAllCloud();
    if (res.success) {
      setActionMessage({ type: 'success', text: res.message });
      refreshCloudStatus();
    } else {
      setActionMessage({ type: 'error', text: res.message });
    }
    setTimeout(() => setActionMessage(null), 5000);
  };

  const handleDownloadAll = async () => {
    const res = await downloadAllCloud();
    if (res.success) {
      setActionMessage({ type: 'success', text: res.message });
      refreshCloudStatus();
    } else {
      setActionMessage({ type: 'error', text: res.message });
    }
    setTimeout(() => setActionMessage(null), 5000);
  };

  // Handlers for Files
  const handleExportDesa = () => {
    if (!currentSelectedDesa) return;
    exportDesaBackup(currentSelectedDesa.id);
    setActionMessage({
      type: 'success',
      text: `File cadangan khusus Desa ${currentSelectedDesa.namaDesa} telah diunduh.`,
    });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleImportDesaFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const res = await importDesaBackup(file);
    if (res.success) {
      setActionMessage({ type: 'success', text: res.message });
    } else {
      setActionMessage({ type: 'error', text: res.message });
    }
    if (filePerDesaRef.current) filePerDesaRef.current.value = '';
    setTimeout(() => setActionMessage(null), 5000);
  };

  const handleImportAllFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const res = await importBackup(file);
    if (res.success) {
      setActionMessage({ type: 'success', text: res.message });
    } else {
      setActionMessage({ type: 'error', text: res.message });
    }
    if (fileAllRef.current) fileAllRef.current.value = '';
    setTimeout(() => setActionMessage(null), 5000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Koneksi &amp; Sinkronisasi Firebase Cloud
                </h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    isCloudOnline
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isCloudOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                    }`}
                  />
                  {isCloudOnline ? 'Firebase Terhubung' : 'Terputus'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Hubungkan data antar komputer dengan pilihan <strong className="text-emerald-300 font-semibold">Upload &amp; Download per Desa</strong> agar data desa lain tetap aman.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 gap-3 pt-2">
          <button
            onClick={() => setActiveTab('cloud')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition border-b-2 cursor-pointer ${
              activeTab === 'cloud'
                ? 'border-emerald-500 text-emerald-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Sinkronisasi Cloud Firebase (Antar Komputer)</span>
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition border-b-2 cursor-pointer ${
              activeTab === 'file'
                ? 'border-emerald-500 text-emerald-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-4 h-4 text-indigo-400" />
            <span>Cadangan Berkas JSON (Offline)</span>
          </button>
        </div>

        {/* Notification Alert */}
        {actionMessage && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl text-xs flex items-center gap-2.5 ${
              actionMessage.type === 'success'
                ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-800'
                : 'bg-rose-950/80 text-rose-200 border border-rose-800'
            }`}
          >
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span className="font-medium flex-1">{actionMessage.text}</span>
            <button
              onClick={() => setActionMessage(null)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              &times;
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* ==================================================== */}
          {/* TAB 1: CLOUD FIREBASE                                */}
          {/* ==================================================== */}
          {activeTab === 'cloud' && (
            <div className="space-y-6">
              {/* Server Info Banner */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-slate-400">Proyek Firebase:</span>
                  <code className="text-emerald-400 bg-slate-900 px-2 py-0.5 rounded font-mono text-[11px] border border-slate-800">
                    {firebaseProjectId || 'gen-lang-client-0767503923'}
                  </code>
                  {cloudLastSync && (
                    <span className="text-slate-400 text-[11px] ml-2">
                      &bull; Terakhir Sync: <strong className="text-slate-200">{cloudLastSync}</strong>
                    </span>
                  )}
                </div>
                <button
                  onClick={refreshCloudStatus}
                  disabled={loadingSummary}
                  className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingSummary ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>Segarkan Status</span>
                </button>
              </div>

              {/* SECTION: PILIHAN PER DESA (UTAMA) */}
              <div className="bg-slate-950/90 border-2 border-emerald-500/40 rounded-2xl p-5 shadow-lg relative">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>1. Pilihan Sinkronisasi Per Desa (Sangat Dianjurkan)</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Aman &bull; Hanya Desa Terpilih
                    </span>
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Data yang diunggah/diunduh hanya meliputi <strong>profil desa, pejabat, SPJ, dan rekanan</strong> desa terpilih. Seluruh desa lainnya di komputer Anda maupun di komputer lain <strong className="text-slate-200">tetap aman dan tidak tersentuh</strong>.
                </p>

                {/* Desa Selector / Locked Village Display */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-slate-900 p-4 rounded-xl border border-slate-800 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      {currentUser?.role === 'admin'
                        ? 'Pilih Desa yang Ingin Disinkronkan:'
                        : 'Desa Akun Anda (Terkunci Otomatis):'}
                    </label>

                    {currentUser?.role === 'admin' ? (
                      <select
                        value={selectedDesaId}
                        onChange={(e) => setSelectedDesaId(e.target.value)}
                        className="w-full bg-slate-950 text-white font-bold text-xs p-2.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        {desas.map((d) => (
                          <option key={d.id} value={d.id}>
                            Desa {d.namaDesa} ({d.kecamatan})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="w-full bg-slate-950 text-emerald-400 font-bold text-xs p-2.5 rounded-xl border border-emerald-500/40 flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span>Desa {currentSelectedDesa?.namaDesa} ({currentSelectedDesa?.kecamatan})</span>
                        </div>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/30">
                          Khusus Desa Anda
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Summary Box */}
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Di Komputer Ini:</span>
                      <strong className="text-white font-mono">{localDesaSpjs.length} SPJ</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Di Cloud Firebase:</span>
                      {cloudInfoForDesa ? (
                        <strong className="text-emerald-400 font-mono">
                          {cloudInfoForDesa.spjCount} SPJ (Tersimpan)
                        </strong>
                      ) : (
                        <span className="text-amber-400 italic">Belum pernah diupload</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Per Desa Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Upload Desa */}
                  <button
                    onClick={handleUploadDesa}
                    disabled={isSyncing}
                    className="flex flex-col items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white p-3.5 rounded-xl font-bold text-xs shadow-lg transition cursor-pointer disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <CloudUpload className="w-5 h-5 text-white" />
                      <span>Upload Desa {currentSelectedDesa?.namaDesa} ke Cloud</span>
                    </div>
                    <span className="text-[10px] font-normal text-emerald-100">
                      Simpan {localDesaSpjs.length} SPJ &amp; profil desa ini ke Firebase
                    </span>
                  </button>

                  {/* Download Desa */}
                  <button
                    onClick={handleDownloadDesa}
                    disabled={isSyncing}
                    className="flex flex-col items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-100 p-3.5 rounded-xl font-bold text-xs border border-slate-700 transition cursor-pointer disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <CloudDownload className="w-5 h-5 text-emerald-400" />
                      <span>Tarik Data Desa {currentSelectedDesa?.namaDesa} dari Cloud</span>
                    </div>
                    <span className="text-[10px] font-normal text-slate-400">
                      Perbarui komputer ini dari server tanpa mengubah desa lain
                    </span>
                  </button>
                </div>
              </div>

              {/* SECTION: SINKRONISASI MENYELURUH (SEMUA DESA) - KHUSUS ADMIN */}
              {currentUser?.role === 'admin' && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-slate-200">
                        2. Sinkronisasi Menyeluruh (Semua Desa Sekaligus)
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Digunakan oleh Administrator Kabupaten untuk mencadangkan seluruh data sistem ({desas.length} Desa, {spjs.length} Dokumen SPJ) ke Firebase.
                      </p>
                    </div>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                      Mode Admin
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <button
                      onClick={handleUploadAll}
                      disabled={isSyncing}
                      className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer disabled:opacity-50"
                    >
                      <CloudUpload className="w-4 h-4 text-emerald-400" />
                      <span>Upload Semua Desa ke Cloud</span>
                    </button>

                    <button
                      onClick={handleDownloadAll}
                      disabled={isSyncing}
                      className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer disabled:opacity-50"
                    >
                      <CloudDownload className="w-4 h-4 text-indigo-400" />
                      <span>Unduh Semua Desa dari Cloud</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Status List of Villages in Cloud */}
              {cloudSummaries.length > 0 && (
                <div className="border border-slate-800 rounded-2xl p-4 bg-slate-950/40">
                  <h4 className="text-xs font-bold text-slate-300 mb-2">
                    {currentUser?.role === 'admin'
                      ? 'Daftar Desa yang Tersedia di Cloud Firebase:'
                      : `Status Desa Anda di Cloud Firebase:`}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {cloudSummaries
                      .filter((c) => currentUser?.role === 'admin' || c.desaId === currentUser?.desaId)
                      .map((c) => (
                        <div
                          key={c.desaId}
                          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-slate-200">Desa {c.namaDesa}</div>
                            <div className="text-[11px] text-slate-400">
                              Kecamatan {c.kecamatan || '-'}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[11px]">
                              {c.spjCount} SPJ
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: FILE JSON BACKUP (OFFLINE)                    */}
          {/* ==================================================== */}
          {activeTab === 'file' && (
            <div className="space-y-6">
              {/* SECTION: FILE BACKUP PER DESA */}
              <div className="bg-slate-950/90 border border-indigo-500/30 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">
                    1. Cadangan &amp; Pemulihan Berkas JSON Per Desa
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Simpan dokumen SPJ dan data satu desa tertentu ke file JSON. Saat dipulihkan, hanya desa yang bersangkutan yang diperbarui, desa-desa lain tetap tidak berubah.
                </p>

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    {currentUser?.role === 'admin'
                      ? 'Pilih Desa yang Ingin Dicadangkan:'
                      : 'Desa Akun Anda (Terkunci Otomatis):'}
                  </label>

                  {currentUser?.role === 'admin' ? (
                    <select
                      value={selectedDesaId}
                      onChange={(e) => setSelectedDesaId(e.target.value)}
                      className="w-full bg-slate-900 text-white font-bold text-xs p-2.5 rounded-xl border border-slate-700 cursor-pointer"
                    >
                      {desas.map((d) => (
                        <option key={d.id} value={d.id}>
                          Desa {d.namaDesa} ({d.kecamatan}) &bull; {spjs.filter((s) => s.desaId === d.id).length} SPJ
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full bg-slate-900 text-indigo-300 font-bold text-xs p-2.5 rounded-xl border border-indigo-500/40 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                        <span>Desa {currentSelectedDesa?.namaDesa} ({currentSelectedDesa?.kecamatan})</span>
                      </div>
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-200 px-2 py-0.5 rounded-md border border-indigo-500/30">
                        {localDesaSpjs.length} SPJ &bull; Khusus Desa Anda
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleExportDesa}
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl font-semibold text-xs shadow transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh File Cadangan (.json) Desa {currentSelectedDesa?.namaDesa}</span>
                  </button>

                  <div>
                    <input
                      ref={filePerDesaRef}
                      type="file"
                      accept=".json"
                      onChange={handleImportDesaFile}
                      className="hidden"
                      id="input-file-per-desa"
                    />
                    <label
                      htmlFor="input-file-per-desa"
                      className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 p-3 rounded-xl font-semibold text-xs transition cursor-pointer text-center"
                    >
                      <Upload className="w-4 h-4 text-emerald-400" />
                      <span>Pulihkan File (.json) Khusus Desa</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* SECTION: FILE BACKUP SELURUH SISTEM - KHUSUS ADMIN */}
              {currentUser?.role === 'admin' && (
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 text-xs">
                  <h4 className="font-bold text-slate-200 mb-1">
                    2. Cadangan &amp; Pemulihan Seluruh Data Sistem (Semua Desa)
                  </h4>
                  <p className="text-[11px] text-slate-400 mb-4">
                    Mengunduh satu berkas JSON lengkap yang mencakup {desas.length} desa, {spjs.length} SPJ, seluruh pengguna, rekanan, dan barang.
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={exportBackup}
                      className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-emerald-400" />
                      <span>Unduh Berkas Semua Desa (.json)</span>
                    </button>

                    <div>
                      <input
                        ref={fileAllRef}
                        type="file"
                        accept=".json"
                        onChange={handleImportAllFile}
                        className="hidden"
                        id="input-file-all"
                      />
                      <label
                        htmlFor="input-file-all"
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-indigo-400" />
                        <span>Pulihkan Seluruh Sistem (.json)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Perangkat terhubung aman melalui Google Cloud Firestore.
          </span>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2 rounded-xl font-semibold cursor-pointer transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
