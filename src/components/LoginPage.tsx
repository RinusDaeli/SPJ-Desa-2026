import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { LogoNiasBarat } from '../assets/logoDefault';

export const LoginPage: React.FC = () => {
  const { login } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const res = login(username, password);
    if (!res.success) {
      setErrorMsg(res.message || 'Nama Pengguna atau Kata Sandi salah.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-between p-4 sm:p-6 text-white font-sans relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 max-w-5xl mx-auto w-full flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl p-1.5 flex items-center justify-center border border-white/20 shadow-md">
            <LogoNiasBarat className="w-9 h-9" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white leading-tight">
              Pemerintah Kabupaten Nias Barat
            </h1>
            <p className="text-[11px] sm:text-xs text-emerald-400 font-medium">
              Sistem Administrasi SPJ Keuangan Desa (ADD / DDS)
            </p>
          </div>
        </div>
        <div className="hidden sm:block text-right">
          <span className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-semibold text-slate-300">
            TA. 2026
          </span>
        </div>
      </header>

      {/* Center Card */}
      <main className="relative z-10 max-w-md w-full mx-auto my-auto py-8">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mb-1">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Silakan Masuk
            </h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Akses khusus untuk Pejabat Desa dan Administrator Pengelolaan SPJ Kabupaten Nias Barat.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Nama Pengguna (Username)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin atau akun desa"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border-2 border-slate-700 focus:border-emerald-500 rounded-xl text-sm font-medium text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Kata Sandi (Password)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border-2 border-slate-700 focus:border-emerald-500 rounded-xl text-sm font-medium text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 px-4 rounded-xl text-sm shadow-lg shadow-emerald-500/20 transition active:scale-98 cursor-pointer mt-2"
            >
              <span>Masuk ke Sistem</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-5xl mx-auto w-full py-4 text-center text-xs text-slate-500 border-t border-slate-800/60">
        <p>
          &copy; {new Date().getFullYear()} Pemerintah Kabupaten Nias Barat &bull; Dinas Pemberdayaan Masyarakat dan Desa (DPMD)
        </p>
      </footer>
    </div>
  );
};
