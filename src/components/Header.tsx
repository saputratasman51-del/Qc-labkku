import React, { useState } from 'react';
import {
  Bell,
  ChevronDown,
  User as UserIcon,
  ShieldCheck,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Database,
  RefreshCw,
} from 'lucide-react';
import { User, WestgardViolation } from '../types/index.ts';
import { storage, APP_LOGO_SRC } from '../services/storage.ts';
import { SupabaseModal } from './SupabaseModal.tsx';

interface HeaderProps {
  currentUser: User;
  onUserChange: (user: User) => void;
  unresolvedViolations: WestgardViolation[];
  onNavigateToWestgard: () => void;
  onRefreshData: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onUserChange,
  unresolvedViolations,
  onNavigateToWestgard,
  onRefreshData,
  onLogout,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAlertMenu, setShowAlertMenu] = useState(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const labProfile = storage.getLabProfile();

  const handleManualSync = async () => {
    setIsRefreshing(true);
    await storage.syncWithDatabase();
    onRefreshData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleExportBackup = () => {
    const dataStr = storage.exportBackup();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-labqc-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (storage.importBackup(content)) {
        onRefreshData();
        alert('Data cadangan berhasil diimpor!');
      } else {
        alert('Gagal mengimpor data. Format file tidak valid.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Lab Branding & Title */}
        <div className="flex items-center gap-3">
          <img
            src={APP_LOGO_SRC}
            alt="Logo Kabupaten Kayong Utara - RSUD Sultan Muhammad Jamaludin I"
            referrerPolicy="no-referrer"
            className="h-10 w-10 object-contain rounded-lg bg-white p-0.5 shadow-xs border border-slate-200 shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {labProfile.name}
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                QC Lab SMJ I
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              {labProfile.institution} · {labProfile.address}, {labProfile.city}
            </p>
          </div>
        </div>

        {/* Action Controls & User Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Database & Synchronization Utilities */}
          <div className="hidden md:flex items-center gap-1.5 border-r border-slate-200 pr-3">
            <button
              onClick={() => setShowSupabaseModal(true)}
              title="Koneksi & Sinkronisasi Database Supabase"
              className="px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Supabase</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Database Terhubung"></span>
            </button>
            <button
              onClick={handleManualSync}
              disabled={isRefreshing}
              title="Perbarui & Sinkronkan Data dari Database"
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-teal-600' : ''}`} />
              <span>{isRefreshing ? 'Sinkronisasi...' : 'Sinkron Data'}</span>
            </button>
            <button
              onClick={handleExportBackup}
              title="Ekspor Cadangan JSON"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <label
              title="Impor Cadangan JSON"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>
          </div>

          {/* Westgard Alert Bell */}
          <div className="relative">
            <button
              onClick={() => setShowAlertMenu(!showAlertMenu)}
              className={`relative p-2 rounded-lg transition-colors ${
                unresolvedViolations.length > 0
                  ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
              title="Notifikasi Pelanggaran QC"
            >
              <Bell className="w-5 h-5" />
              {unresolvedViolations.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
                  {unresolvedViolations.length}
                </span>
              )}
            </button>

            {showAlertMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Pelanggaran Westgard Aktif
                    </span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-semibold">
                    {unresolvedViolations.length} Butuh Aksi
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {unresolvedViolations.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      <span>Semua parameter QC dalam batas normal. Tidak ada pelanggaran aktif.</span>
                    </div>
                  ) : (
                    unresolvedViolations.slice(0, 5).map((v) => (
                      <div key={v.id} className="p-3 hover:bg-slate-50 text-left transition-colors">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-slate-900">{v.parameterName}</span>
                          <span className="text-[11px] text-slate-400">{v.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
                          <span>{v.instrumentName}</span>
                          <span>·</span>
                          <span>{v.level}</span>
                          <span>·</span>
                          <span className="font-mono text-rose-600 font-medium">Z: {v.zScore > 0 ? `+${v.zScore}` : v.zScore} SD</span>
                        </div>
                        <p className="text-[11px] text-rose-700 font-medium line-clamp-1">{v.ruleName}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
                  <button
                    onClick={() => {
                      setShowAlertMenu(false);
                      onNavigateToWestgard();
                    }}
                    className="w-full py-1.5 px-3 text-xs font-semibold text-teal-700 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition-colors"
                  >
                    Buka Halaman Pelanggaran Westgard →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Switcher Dropdown & Logout */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-slate-800 line-clamp-1">{currentUser.name}</div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-teal-600" />
                  <span>{currentUser.roleLabel}</span>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
                    Ganti Pengguna
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono">@{currentUser.username}</span>
                </div>
                <div className="py-1 max-h-60 overflow-y-auto">
                  {storage.getUsers().map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onUserChange(u);
                        storage.setCurrentUser(u);
                        setShowUserMenu(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-xs flex items-start gap-2.5 hover:bg-slate-50 transition-colors ${
                        u.id === currentUser.id ? 'bg-teal-50/70' : ''
                      }`}
                    >
                      <UserIcon
                        className={`w-4 h-4 mt-0.5 ${
                          u.id === currentUser.id ? 'text-teal-600' : 'text-slate-400'
                        }`}
                      />
                      <div>
                        <p
                          className={`font-semibold ${
                            u.id === currentUser.id ? 'text-teal-900' : 'text-slate-800'
                          }`}
                        >
                          {u.name}
                        </p>
                        <p className="text-[11px] text-slate-500">{u.roleLabel}</p>
                        <p className="text-[10px] text-slate-400 font-mono">NIP: {u.nip}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Logout inside menu */}
                <div className="pt-1 mt-1 border-t border-slate-100 px-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Keluar (Logout)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Direct Logout Button */}
          <button
            onClick={onLogout}
            title="Keluar dari Aplikasi (Logout)"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline text-xs font-semibold text-rose-600">Keluar</span>
          </button>
        </div>
      </div>

      {/* Supabase Connection Modal */}
      <SupabaseModal
        isOpen={showSupabaseModal}
        onClose={() => setShowSupabaseModal(false)}
        onDataSynced={onRefreshData}
      />
    </header>
  );
};
