import React from 'react';
import { useApp } from '../context/AppContext';
import { LogoNiasBarat } from '../assets/logoDefault';
import {
  FileText,
  PlusCircle,
  Building2,
  ShieldCheck,
  Download,
  Upload,
  LogOut,
  LogIn,
  Layers,
  ChevronDown,
  Store,
  Cloud,
} from 'lucide-react';

interface NavbarProps {
  onOpenNewSpj: () => void;
  onOpenDesaManager?: () => void;
  onOpenMasterData: () => void;
  onOpenAdminPanel: () => void;
  onOpenLogin: () => void;
  onOpenCloudSync: () => void;
  currentView: 'list' | 'form';
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNewSpj,
  onOpenDesaManager,
  onOpenMasterData,
  onOpenAdminPanel,
  onOpenLogin,
  onOpenCloudSync,
  currentView,
}) => {
  const {
    currentUser,
    logout,
    desas,
    activeDesaId,
    setActiveDesaId,
    activeDesa,
    isCloudOnline,
    isSyncing,
  } = useApp();

  const sortedDesas = [...desas].sort((a, b) => a.namaDesa.localeCompare(b.namaDesa, 'id'));

  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-30 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Village Selection */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex-shrink-0 bg-white/10 rounded-lg p-1 flex items-center justify-center border border-white/20 shadow-inner">
              <LogoNiasBarat className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-wide text-white">
                  e-SPJ Desa
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Nias Barat
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>Desa Aktif:</span>
                {currentUser?.role === 'admin' ? (
                  <div className="relative inline-block">
                    <select
                      value={activeDesaId}
                      onChange={(e) => setActiveDesaId(e.target.value)}
                      aria-label="Pilih Desa Aktif"
                      className="bg-slate-800 text-emerald-300 font-semibold text-xs rounded border border-slate-700 py-0.5 px-2 pr-6 appearance-none cursor-pointer hover:bg-slate-700 transition"
                    >
                      <option value="all">🌐 Semua Desa (Tampilkan Semua)</option>
                      {sortedDesas.map((d) => (
                        <option key={d.id} value={d.id}>
                          Desa {d.namaDesa} ({d.kecamatan})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1.5 pointer-events-none" />
                  </div>
                ) : (
                  <span className="text-emerald-400 font-semibold">
                    Desa {activeDesa?.namaDesa || 'Fadoro'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Nav Actions (Khusus Admin untuk Panel Admin) */}
          {currentUser?.role === 'admin' && (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAdminPanel}
                className="hidden md:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 transition cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Panel Admin</span>
              </button>
            </div>
          )}

          {/* User Account / Login State */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-medium text-white">{currentUser.nama}</div>
                  <div className="text-[10px] text-emerald-400 capitalize">
                    {currentUser.role === 'admin' ? 'Akun Administrator' : 'Akun Pengguna Desa'}
                  </div>
                </div>
                <button
                  onClick={logout}
                  title="Keluar"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-400 border border-slate-700 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk (Login)</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Submenu */}
        <div className="flex md:hidden items-center justify-between py-2 border-t border-slate-800 gap-2 overflow-x-auto text-xs">
          <button
            onClick={onOpenNewSpj}
            className="flex items-center gap-1 bg-emerald-600 text-white px-2.5 py-1 rounded text-xs whitespace-nowrap font-medium"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ SPJ Baru</span>
          </button>
          <button
            onClick={onOpenMasterData}
            className="flex items-center gap-1 bg-slate-800 text-slate-200 px-2.5 py-1 rounded text-xs whitespace-nowrap"
          >
            <Store className="w-3.5 h-3.5 text-emerald-400" />
            <span>Rekanan</span>
          </button>
          {currentUser?.role === 'admin' && (
            <button
              onClick={onOpenAdminPanel}
              className="flex items-center gap-1 bg-slate-800 text-slate-200 px-2.5 py-1 rounded text-xs whitespace-nowrap"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Admin</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
