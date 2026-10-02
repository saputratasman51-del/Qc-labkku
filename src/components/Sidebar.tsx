import React from 'react';
import {
  LayoutDashboard,
  ClipboardPen,
  LineChart,
  AlertTriangle,
  ShieldAlert,
  Database,
  FileSpreadsheet,
  X,
  Building2,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { LabProfile, User } from '../types/index.ts';
import { APP_LOGO_SRC } from '../services/storage.ts';

export type ActiveTab =
  | 'dashboard'
  | 'input-qc'
  | 'levey-jennings'
  | 'westgard'
  | 'capa'
  | 'master-data'
  | 'laporan';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  unresolvedViolationsCount: number;
  openCapaCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  labProfile: LabProfile;
  currentUser?: User;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  unresolvedViolationsCount,
  openCapaCount,
  isOpenMobile,
  onCloseMobile,
  labProfile,
  currentUser,
  onLogout,
}) => {
  const menuItems: {
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'input-qc',
      label: 'Input QC Harian',
      icon: ClipboardPen,
    },
    {
      id: 'levey-jennings',
      label: 'Grafik Levey-Jennings',
      icon: LineChart,
    },
    {
      id: 'westgard',
      label: 'Pelanggaran Westgard',
      icon: AlertTriangle,
      badge: unresolvedViolationsCount,
      badgeColor: 'bg-rose-100 text-rose-700 border-rose-200',
    },
    {
      id: 'capa',
      label: 'CAPA',
      icon: ShieldAlert,
      badge: openCapaCount,
      badgeColor: 'bg-amber-100 text-amber-700 border-amber-200',
    },
    {
      id: 'master-data',
      label: 'Master Data',
      icon: Database,
    },
    {
      id: 'laporan',
      label: 'Laporan',
      icon: FileSpreadsheet,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* App Logo & Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={APP_LOGO_SRC}
              alt="Logo RSUD Sultan Muhammad Jamaludin I"
              referrerPolicy="no-referrer"
              className="h-10 w-10 object-contain rounded-lg bg-white p-0.5 shadow-sm shrink-0"
            />
            <div>
              <div className="text-xs font-bold text-white tracking-tight uppercase leading-tight">
                RSUD S.M. JAMALUDIN I
              </div>
              <div className="text-[10px] text-teal-400 font-medium">
                Lab Patologi Klinik · Kayong Utara
              </div>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 text-slate-400 hover:text-white rounded-md lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Menu Utama
          </p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                      item.badgeColor || 'bg-slate-800 text-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
          {/* User Session Bar in Sidebar */}
          {currentUser && (
            <div className="pt-2 border-t border-slate-800/80 mt-2">
              <div className="px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-slate-200 truncate leading-tight">
                      {currentUser.name.split(',')[0]}
                    </p>
                    <p className="text-[9px] text-teal-400 truncate font-mono">
                      @{currentUser.username}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onCloseMobile();
                    onLogout();
                  }}
                  title="Keluar (Logout)"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Lab Info Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs">
          <div className="flex items-start gap-2.5">
            <Building2 className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
            <div className="space-y-0.5">
              <p className="font-semibold text-slate-200 line-clamp-1">RSUD S.M. Jamaludin I</p>
              <p className="text-[11px] text-slate-400 line-clamp-1">Jalan Provinsi, Sukadana (78852)</p>
              <div className="text-[10px] text-teal-400/90 font-mono pt-1">
                Kabupaten Kayong Utara
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
