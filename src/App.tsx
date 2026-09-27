import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { SpjDocument, DesaProfile } from './types';
import { Navbar } from './components/Navbar';
import { SpjList } from './components/SpjList';
import { SpjForm } from './components/SpjForm';
import { PrintModal } from './components/PrintView/PrintModal';
import { AdminPanel } from './components/AdminPanel';
import { DesaModal } from './components/DesaModal';
import { LoginModal } from './components/LoginModal';
import { LoginPage } from './components/LoginPage';
import { MasterDataManager } from './components/MasterDataManager';
import { CloudSyncModal } from './components/CloudSyncModal';

function MainApp() {
  const { currentUser, spjs, activeDesa, desas, addSpj, updateSpj } = useApp();

  const [currentView, setCurrentView] = useState<'list' | 'form'>('list');
  const [editingSpj, setEditingSpj] = useState<SpjDocument | null>(null);

  // Modals
  const [printModalSpj, setPrintModalSpj] = useState<SpjDocument | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showDesaModal, setShowDesaModal] = useState(false);
  const [showMasterDataModal, setShowMasterDataModal] = useState(false);
  const [masterDataDefaultTab, setMasterDataDefaultTab] = useState<'rekanan' | 'barang'>('rekanan');
  const [editingDesaTarget, setEditingDesaTarget] = useState<DesaProfile | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCloudSyncModal, setShowCloudSyncModal] = useState(false);
  const [cloudSyncTargetDesaId, setCloudSyncTargetDesaId] = useState<string | undefined>(undefined);

  // If user is not logged in, return to the Login Page directly!
  if (!currentUser) {
    return <LoginPage />;
  }

  // Handlers
  const handleOpenMasterData = (tab: 'rekanan' | 'barang' = 'rekanan') => {
    setMasterDataDefaultTab(tab);
    setShowMasterDataModal(true);
  };

  const handleOpenCloudSync = (desaId?: string) => {
    setCloudSyncTargetDesaId(desaId || activeDesa?.id);
    setShowCloudSyncModal(true);
  };

  const handleOpenNewSpj = () => {
    setEditingSpj(null);
    setCurrentView('form');
  };

  const handleEditSpj = (spj: SpjDocument) => {
    setEditingSpj(spj);
    setCurrentView('form');
  };

  const handleSaveSpj = (spj: SpjDocument) => {
    const exists = spjs.some((s) => s.id === spj.id);
    if (exists) {
      updateSpj(spj);
    } else {
      addSpj(spj);
    }
    setCurrentView('list');
    setEditingSpj(null);
  };

  const handlePreviewSpj = (spj: SpjDocument) => {
    setPrintModalSpj(spj);
  };

  const handleOpenDesaManager = () => {
    setEditingDesaTarget(activeDesa || desas[0]);
    setShowDesaModal(true);
  };

  const handleEditSpecificDesa = (targetDesa: DesaProfile) => {
    setEditingDesaTarget(targetDesa);
    setShowDesaModal(true);
  };

  const currentDesaForPrint =
    printModalSpj && printModalSpj.desaId
      ? desas.find((d) => d.id === printModalSpj.desaId) || activeDesa || desas[0]
      : activeDesa || desas[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      <Navbar
        onOpenNewSpj={handleOpenNewSpj}
        onOpenDesaManager={handleOpenDesaManager}
        onOpenMasterData={() => handleOpenMasterData('rekanan')}
        onOpenAdminPanel={() => setShowAdminPanel(true)}
        onOpenLogin={() => setShowLoginModal(true)}
        onOpenCloudSync={() => handleOpenCloudSync(activeDesa?.id)}
        currentView={currentView}
      />

      <main className={`flex-1 ${printModalSpj ? 'print:hidden' : ''}`}>
        {currentView === 'list' ? (
          <SpjList
            onNewSpj={handleOpenNewSpj}
            onEditSpj={handleEditSpj}
            onPrintSpj={(spj) => setPrintModalSpj(spj)}
            onOpenMasterData={() => handleOpenMasterData('barang')}
            onOpenCloudSync={handleOpenCloudSync}
          />
        ) : (
          <SpjForm
            initialSpj={editingSpj}
            onSave={handleSaveSpj}
            onCancel={() => {
              setCurrentView('list');
              setEditingSpj(null);
            }}
            onPreview={handlePreviewSpj}
            onOpenMasterData={handleOpenMasterData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-xs text-center print:hidden">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="font-semibold text-slate-300">
            Aplikasi SPJ Desa &bull; Surat Pesanan, Faktur, BAST &amp; Daftar Hadir
          </p>
          <p>
            Pemerintah Kabupaten Nias Barat &bull; Standar Administrasi &amp; Perpajakan Dana Desa (ADD/DDS)
          </p>
        </div>
      </footer>

      {/* Print / PDF Modal */}
      {printModalSpj && (
        <PrintModal
          spj={printModalSpj}
          desa={currentDesaForPrint}
          isOpen={Boolean(printModalSpj)}
          onClose={() => setPrintModalSpj(null)}
        />
      )}

      {/* Admin Panel Modal */}
      <AdminPanel
        isOpen={showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
        onEditDesa={handleEditSpecificDesa}
      />

      {/* Cloud Sync & Firebase Modal */}
      <CloudSyncModal
        isOpen={showCloudSyncModal}
        onClose={() => setShowCloudSyncModal(false)}
        defaultDesaId={cloudSyncTargetDesaId}
      />

      {/* Desa Profile Editor Modal */}
      <DesaModal
        desa={editingDesaTarget}
        isOpen={showDesaModal}
        onClose={() => {
          setShowDesaModal(false);
          setEditingDesaTarget(null);
        }}
      />

      {/* Master Data Rekanan & Barang Modal */}
      <MasterDataManager
        isOpen={showMasterDataModal}
        defaultTab={masterDataDefaultTab}
        onClose={() => setShowMasterDataModal(false)}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
