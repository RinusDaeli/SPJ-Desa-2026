import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, User, X } from 'lucide-react';
import { LogoNiasBarat } from '../assets/logoDefault';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const res = login(username, password);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.message || 'Gagal masuk. Periksa kembali username dan password.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-800">
        {/* Header */}
        <div className="bg-slate-950 text-white p-6 text-center relative border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition cursor-pointer p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 mx-auto mb-3 bg-white/10 rounded-full p-2 flex items-center justify-center border border-white/20">
            <LogoNiasBarat className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-bold tracking-tight">Masuk Sistem SPJ Desa</h3>
          <p className="text-xs text-slate-400 mt-1">
            Pemerintah Kabupaten Nias Barat
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nama Pengguna (Username)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-emerald-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="misal: admin atau desafadoro"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900 border-2 border-slate-700 focus:border-emerald-500 rounded-xl text-white font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Kata Sandi (Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-emerald-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-900 border-2 border-slate-700 focus:border-emerald-500 rounded-xl text-white font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl text-sm transition shadow cursor-pointer active:scale-98"
          >
            Masuk ke Aplikasi
          </button>
        </form>
      </div>
    </div>
  );
};
