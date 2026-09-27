import React, { useState, useEffect } from 'react';
import { DesaProfile } from '../types';
import { useApp } from '../context/AppContext';
import { Building2, X, Upload, RotateCcw, Check, UserCheck, Shield } from 'lucide-react';
import { LogoNiasBarat, LogoDesaRenderer } from '../assets/logoDefault';

interface DesaModalProps {
  desa: DesaProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DesaModal: React.FC<DesaModalProps> = ({ desa, isOpen, onClose }) => {
  const { updateDesa } = useApp();
  const [formData, setFormData] = useState<DesaProfile | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (desa) {
      setFormData(JSON.parse(JSON.stringify(desa)));
    }
  }, [desa, isOpen]);

  if (!isOpen || !formData) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64 = uploadEvent.target?.result as string;
      setFormData((prev) => (prev ? { ...prev, logoUrl: base64 } : null));
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    setFormData((prev) => (prev ? { ...prev, logoUrl: undefined } : null));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    updateDesa(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 text-slate-100 rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-800">
        {/* Header */}
        <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/20 text-amber-400 border border-amber-500/30 p-2.5 rounded-2xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Edit Profil &amp; Pejabat Desa {formData.namaDesa}</h2>
              <p className="text-xs text-slate-400">
                Informasi ini akan tercetak otomatis pada Kop Surat, Faktur, dan Berita Acara (BAST)
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {savedSuccess && (
            <div className="p-3 bg-emerald-950/80 text-emerald-300 border border-emerald-800 rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="font-semibold">Data Desa berhasil diperbarui!</span>
            </div>
          )}

          {/* Section 1: Logo & Identitas Desa */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Logo &amp; Wilayah Desa</span>
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Logo Preview */}
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-900 border border-slate-700 rounded-2xl p-2 flex items-center justify-center shadow-xs">
                  <LogoDesaRenderer logoUrl={formData.logoUrl} className="w-16 h-16" />
                </div>
                <div className="flex gap-2 mt-2">
                  <label
                    htmlFor="logo-upload"
                    className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 border border-slate-700 rounded-lg text-[11px] font-medium cursor-pointer shadow-xs transition"
                  >
                    <Upload className="w-3 h-3 text-slate-400" />
                    <span>Ubah</span>
                  </label>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={handleResetLogo}
                      title="Kembalikan ke logo bawaan Nias Barat"
                      className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 border border-slate-700 rounded-lg text-[11px] font-medium cursor-pointer shadow-xs transition"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-400" />
                      <span>Default</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Text Fields */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Nama Desa *</label>
                  <input
                    type="text"
                    required
                    value={formData.namaDesa}
                    onChange={(e) => setFormData({ ...formData, namaDesa: e.target.value })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded-xl focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Kode Singkatan Surat *</label>
                  <input
                    type="text"
                    required
                    value={formData.kodeDesa}
                    onChange={(e) => setFormData({ ...formData, kodeDesa: e.target.value.toUpperCase() })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded-xl uppercase font-mono focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Kecamatan *</label>
                  <input
                    type="text"
                    required
                    value={formData.kecamatan}
                    onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded-xl focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Kabupaten *</label>
                  <input
                    type="text"
                    required
                    value={formData.kabupaten}
                    onChange={(e) => setFormData({ ...formData, kabupaten: e.target.value })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded-xl focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-300 block mb-1">Alamat Lengkap Kantor Desa</label>
                  <input
                    type="text"
                    value={formData.alamatKantor}
                    onChange={(e) => setFormData({ ...formData, alamatKantor: e.target.value })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded-xl focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Kepala Desa & Perangkat Inti */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Kepala Desa, Sekretaris &amp; Bendahara</span>
            </h3>

            {/* Kepala Desa */}
            <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
              <div className="font-bold text-emerald-400 text-xs mb-2">Pimpinan Desa (Kepala Desa)</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-1">
                  <label className="font-medium text-slate-400 block mb-0.5">Nama Lengkap &amp; Gelar</label>
                  <input
                    type="text"
                    required
                    value={formData.kepalaDesa.nama}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        kepalaDesa: { ...formData.kepalaDesa, nama: e.target.value },
                      })
                    }
                    className="w-full p-1.5 bg-slate-950 border border-slate-700 text-white rounded-lg uppercase font-semibold"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-400 block mb-0.5">NIP (Jika Ada / PNS)</label>
                  <input
                    type="text"
                    value={formData.kepalaDesa.nip || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        kepalaDesa: { ...formData.kepalaDesa, nip: e.target.value },
                      })
                    }
                    placeholder="Contoh: 19860117 201503 1 001"
                    className="w-full p-1.5 bg-slate-950 border border-slate-700 text-white rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-medium text-slate-400 block mb-0.5">Jabatan Tertulis</label>
                  <input
                    type="text"
                    value={formData.kepalaDesa.jabatan}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        kepalaDesa: { ...formData.kepalaDesa, jabatan: e.target.value },
                      })
                    }
                    className="w-full p-1.5 bg-slate-950 border border-slate-700 text-white rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Sekretaris & Bendahara */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Sekretaris */}
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                <div className="font-bold text-slate-200 text-xs mb-2">Sekretaris Desa</div>
                <div className="space-y-2">
                  <div>
                    <label className="font-medium text-slate-400 block mb-0.5">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      value={formData.sekretarisDesa.nama}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sekretarisDesa: { ...formData.sekretarisDesa, nama: e.target.value },
                        })
                      }
                      className="w-full p-1.5 bg-slate-950 border border-slate-700 text-white rounded-lg uppercase font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-slate-400 block mb-0.5">Keterangan Jabatan</label>
                    <input
                      type="text"
                      value={formData.sekretarisDesa.jabatan}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sekretarisDesa: { ...formData.sekretarisDesa, jabatan: e.target.value },
                        })
                      }
                      className="w-full p-1.5 bg-slate-950 border border-slate-700 text-white rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Bendahara */}
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                <div className="font-bold text-slate-200 text-xs mb-2">Bendahara Desa</div>
                <div className="space-y-2">
                  <div>
                    <label className="font-medium text-slate-400 block mb-0.5">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      value={formData.bendaharaDesa.nama}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bendaharaDesa: { ...formData.bendaharaDesa, nama: e.target.value },
                        })
                      }
                      className="w-full p-1.5 bg-slate-950 border border-slate-700 text-white rounded-lg uppercase font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-slate-400 block mb-0.5">Keterangan Jabatan</label>
                    <input
                      type="text"
                      value={formData.bendaharaDesa.jabatan}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bendaharaDesa: { ...formData.bendaharaDesa, jabatan: e.target.value },
                        })
                      }
                      className="w-full p-1.5 bg-slate-950 border border-slate-700 text-white rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Pelaksana Kegiatan Default */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="font-bold text-white text-sm">Pelaksana Kegiatan Default (Kaur / Kasi)</h3>
            <p className="text-[11px] text-slate-400 -mt-2">
              Pejabat yang bertindak sebagai pemesan pada Surat Pesanan &amp; penerima barang pada BAST.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Pelaksana ADD */}
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                <div className="font-bold text-slate-200 text-xs mb-2">Pelaksana Kegiatan ADD</div>
                <div className="space-y-2">
                  <div>
                    <label className="font-medium text-slate-400 block mb-0.5">Nama Lengkap</label>
                    <input
                      type="text"
                      value={formData.pelaksanaADD.nama}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pelaksanaADD: { ...formData.pelaksanaADD, nama: e.target.value },
                        })
                      }
                      className="w-full p-1.5 bg-slate-950 border border-slate-700 text-white rounded-lg uppercase font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-slate-400 block mb-0.5">Keterangan Jabatan</label>
                    <input
                      type="text"
                      value={formData.pelaksanaADD.jabatan}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pelaksanaADD: { ...formData.pelaksanaADD, jabatan: e.target.value },
                        })
                      }
                      className="w-full p-1.5 bg-slate-950 border border-slate-700 text-white rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Pelaksana DDS */}
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
                <div className="font-bold text-slate-200 text-xs mb-2">Pelaksana Kegiatan DDS / DD</div>
                <div className="space-y-2">
                  <div>
                    <label className="font-medium text-slate-400 block mb-0.5">Nama Lengkap</label>
                    <input
                      type="text"
                      value={formData.pelaksanaDDS.nama}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pelaksanaDDS: { ...formData.pelaksanaDDS, nama: e.target.value },
                        })
                      }
                      className="w-full p-1.5 bg-slate-950 border border-slate-700 text-white rounded-lg uppercase font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-slate-400 block mb-0.5">Keterangan Jabatan</label>
                    <input
                      type="text"
                      value={formData.pelaksanaDDS.jabatan}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pelaksanaDDS: { ...formData.pelaksanaDDS, jabatan: e.target.value },
                        })
                      }
                      className="w-full p-1.5 bg-slate-950 border border-slate-700 text-white rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl font-medium transition cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow transition cursor-pointer active:scale-98"
            >
              Simpan Perubahan Desa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
