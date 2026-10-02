/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Menu, ShieldAlert, CheckCircle2 } from 'lucide-react';
import {
  CAPARecord,
  ControlMaterial,
  Instrument,
  Parameter,
  QCRecord,
  QCTarget,
  User,
  WestgardViolation,
} from './types/index.ts';
import { storage, APP_LOGO_SRC } from './services/storage.ts';
import { Header } from './components/Header.tsx';
import { Sidebar, ActiveTab } from './components/Sidebar.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { QCInput } from './components/QCInput.tsx';
import { LeveyJenningsChart } from './components/LeveyJenningsChart.tsx';
import { WestgardView } from './components/WestgardView.tsx';
import { CAPAView } from './components/CAPAView.tsx';
import { MasterDataView } from './components/MasterDataView.tsx';
import { ReportView } from './components/ReportView.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => storage.isLoggedIn());

  // Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // App Data State (loaded from storage service)
  const [currentUser, setCurrentUser] = useState<User>(() => storage.getCurrentUser());
  const [users, setUsers] = useState<User[]>(() => storage.getUsers());
  const [instruments, setInstruments] = useState<Instrument[]>(() => storage.getInstruments());
  const [parameters, setParameters] = useState<Parameter[]>(() => storage.getParameters());
  const [controlMaterials, setControlMaterials] = useState<ControlMaterial[]>(() =>
    storage.getControlMaterials()
  );
  const [qcTargets, setQcTargets] = useState<QCTarget[]>(() => storage.getQCTargets());
  const [qcRecords, setQcRecords] = useState<QCRecord[]>(() => storage.getQCRecords());
  const [violations, setViolations] = useState<WestgardViolation[]>(() =>
    storage.getWestgardViolations()
  );
  const [capaRecords, setCapaRecords] = useState<CAPARecord[]>(() => storage.getCAPARecords());

  // Deep link parameters for Levey-Jennings navigation
  const [ljParams, setLjParams] = useState<{
    instrumentName?: string;
    parameterName?: string;
    level?: string;
  }>({});

  // Deep link prefill data for CAPA navigation
  const [capaPrefill, setCapaPrefill] = useState<any>(null);

  // Reload all states from storage
  const handleRefreshAll = useCallback(() => {
    setCurrentUser(storage.getCurrentUser());
    setUsers(storage.getUsers());
    setInstruments(storage.getInstruments());
    setParameters(storage.getParameters());
    setControlMaterials(storage.getControlMaterials());
    setQcTargets(storage.getQCTargets());
    setQcRecords(storage.getQCRecords());
    setViolations(storage.getWestgardViolations());
    setCapaRecords(storage.getCAPARecords());
  }, []);

  // Sync with Supabase on mount
  useEffect(() => {
    storage.syncWithDatabase().then(() => {
      handleRefreshAll();
    });
  }, [handleRefreshAll]);

  // Handlers for QC Records
  const handleRecordAdded = (newRecord: QCRecord, newViolations: WestgardViolation[]) => {
    storage.saveQCRecord(newRecord);
    newViolations.forEach((v) => storage.saveWestgardViolation(v));
    setQcRecords(storage.getQCRecords());
    setViolations(storage.getWestgardViolations());
  };

  const handleRecordUpdated = (updated: QCRecord) => {
    storage.updateQCRecord(updated);
    setQcRecords(storage.getQCRecords());
  };

  const handleRecordDeleted = (id: string) => {
    storage.deleteQCRecord(id);
    setQcRecords(storage.getQCRecords());
  };

  // Handlers for Violations
  const handleViolationUpdated = (updated: WestgardViolation) => {
    storage.updateWestgardViolation(updated);
    setViolations(storage.getWestgardViolations());
  };

  // Handlers for CAPA
  const handleCapaSaved = (newCapa: CAPARecord) => {
    storage.saveCAPARecord(newCapa);
    // If linked to violation, update violation status
    if (newCapa.violationId) {
      const viol = violations.find((v) => v.id === newCapa.violationId);
      if (viol) {
        storage.updateWestgardViolation({
          ...viol,
          status: 'Dalam CAPA',
          linkedCapaId: newCapa.capaNumber,
        });
        setViolations(storage.getWestgardViolations());
      }
    }
    setCapaRecords(storage.getCAPARecords());
  };

  const handleCapaUpdated = (updated: CAPARecord) => {
    storage.updateCAPARecord(updated);
    setCapaRecords(storage.getCAPARecords());
  };

  const handleCapaDeleted = (id: string) => {
    storage.deleteCAPARecord(id);
    setCapaRecords(storage.getCAPARecords());
  };

  // Handlers for Master Data
  const handleSaveInstrument = (inst: Instrument) => {
    storage.saveInstrument(inst);
    setInstruments(storage.getInstruments());
  };
  const handleDeleteInstrument = (id: string) => {
    storage.deleteInstrument(id);
    setInstruments(storage.getInstruments());
  };

  const handleSaveParameter = (param: Parameter) => {
    storage.saveParameter(param);
    setParameters(storage.getParameters());
  };
  const handleDeleteParameter = (id: string) => {
    storage.deleteParameter(id);
    setParameters(storage.getParameters());
  };

  const handleSaveControl = (ctrl: ControlMaterial) => {
    storage.saveControlMaterial(ctrl);
    setControlMaterials(storage.getControlMaterials());
  };
  const handleDeleteControl = (id: string) => {
    storage.deleteControlMaterial(id);
    setControlMaterials(storage.getControlMaterials());
  };

  const handleSaveTarget = (tgt: QCTarget) => {
    storage.saveQCTarget(tgt);
    setQcTargets(storage.getQCTargets());
  };
  const handleDeleteTarget = (id: string) => {
    storage.deleteQCTarget(id);
    setQcTargets(storage.getQCTargets());
  };

  // Handlers for User Management
  const handleSaveUser = (u: User) => {
    storage.saveUser(u);
    setUsers(storage.getUsers());
    if (currentUser.id === u.id) {
      setCurrentUser(u);
    }
  };

  const handleDeleteUser = (id: string) => {
    if (currentUser.id === id) {
      alert('Tidak dapat menghapus akun yang sedang aktif digunakan.');
      return;
    }
    storage.deleteUser(id);
    setUsers(storage.getUsers());
  };

  const handleLogout = () => {
    storage.logout();
    setIsAuthenticated(false);
    setActiveTab('dashboard'); // Reset navigation
    // No need to reload, React state update will trigger re-render
  };

  // Navigation Helpers
  const navigateToLJ = (instrumentName: string, parameterName: string, level: string) => {
    setLjParams({ instrumentName, parameterName, level });
    setActiveTab('levey-jennings');
  };

  const navigateToCAPAWithData = (data: any) => {
    setCapaPrefill(data);
    setActiveTab('capa');
  };

  // Unresolved Westgard count & Open CAPA count
  const unresolvedViolations = violations.filter((v) => v.status !== 'Selesai');
  const openCapaCount = capaRecords.filter((c) => c.status === 'Open' || c.status === 'Dalam Proses').length;

  // Authentication Gate: Render Login Screen if user is not authenticated
  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        unresolvedViolationsCount={unresolvedViolations.length}
        openCapaCount={openCapaCount}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        labProfile={storage.getLabProfile()}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Mobile Header Bar */}
        <div className="lg:hidden flex items-center justify-between p-3 bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <img
                src={APP_LOGO_SRC}
                alt="Logo RSUD S.M. Jamaludin I"
                referrerPolicy="no-referrer"
                className="h-7 w-7 object-contain rounded"
              />
              <div className="font-bold text-slate-900 text-xs leading-tight">
                RSUD S.M. Jamaludin I
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
            QC Lab
          </span>
        </div>

        {/* Global Desktop/Tablet Header */}
        <Header
          currentUser={currentUser}
          onUserChange={(u) => {
            setCurrentUser(u);
            storage.setCurrentUser(u);
          }}
          unresolvedViolations={unresolvedViolations}
          onNavigateToWestgard={() => setActiveTab('westgard')}
          onRefreshData={handleRefreshAll}
          onLogout={handleLogout}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              qcRecords={qcRecords}
              violations={violations}
              capaRecords={capaRecords}
              onNavigate={(tab, prefill) => {
                if (prefill) setCapaPrefill(prefill);
                setActiveTab(tab);
              }}
              onInspectQC={(record) => {
                navigateToLJ(record.instrumentName, record.parameterName, record.level);
              }}
            />
          )}

          {activeTab === 'input-qc' && (
            <QCInput
              currentUser={currentUser}
              instruments={instruments}
              parameters={parameters}
              controlMaterials={controlMaterials}
              qcTargets={qcTargets}
              qcRecords={qcRecords}
              onRecordAdded={handleRecordAdded}
              onRecordUpdated={handleRecordUpdated}
              onRecordDeleted={handleRecordDeleted}
              onNavigateToLJ={navigateToLJ}
              onNavigateToCAPAWithData={navigateToCAPAWithData}
            />
          )}

          {activeTab === 'levey-jennings' && (
            <LeveyJenningsChart
              instruments={instruments}
              parameters={parameters}
              qcTargets={qcTargets}
              qcRecords={qcRecords}
              initialInstrument={ljParams.instrumentName}
              initialParameter={ljParams.parameterName}
              initialLevel={ljParams.level}
              onNavigateToCAPAWithData={navigateToCAPAWithData}
            />
          )}

          {activeTab === 'westgard' && (
            <WestgardView
              currentUser={currentUser}
              violations={violations}
              onViolationUpdated={handleViolationUpdated}
              onViolationDeleted={(id) => {
                storage.deleteWestgardViolation(id);
                setViolations(storage.getWestgardViolations());
              }}
              onNavigateToLJ={navigateToLJ}
              onNavigateToCAPAWithData={navigateToCAPAWithData}
            />
          )}

          {activeTab === 'capa' && (
            <CAPAView
              currentUser={currentUser}
              capaRecords={capaRecords}
              instruments={instruments}
              parameters={parameters}
              onCapaSaved={handleCapaSaved}
              onCapaUpdated={handleCapaUpdated}
              onCapaDeleted={handleCapaDeleted}
              prefillData={capaPrefill}
              onClearPrefill={() => setCapaPrefill(null)}
            />
          )}

          {activeTab === 'master-data' && (
            <MasterDataView
              currentUser={currentUser}
              instruments={instruments}
              parameters={parameters}
              controlMaterials={controlMaterials}
              qcTargets={qcTargets}
              users={users}
              labProfile={storage.getLabProfile()}
              onSaveInstrument={handleSaveInstrument}
              onDeleteInstrument={handleDeleteInstrument}
              onSaveParameter={handleSaveParameter}
              onDeleteParameter={handleDeleteParameter}
              onSaveControl={handleSaveControl}
              onDeleteControl={handleDeleteControl}
              onSaveTarget={handleSaveTarget}
              onDeleteTarget={handleDeleteTarget}
              onSaveUser={handleSaveUser}
              onDeleteUser={handleDeleteUser}
              onSaveProfile={(prof) => {
                storage.saveLabProfile(prof);
                handleRefreshAll();
              }}
            />
          )}

          {activeTab === 'laporan' && (
            <ReportView
              currentUser={currentUser}
              qcRecords={qcRecords}
              violations={violations}
              capaRecords={capaRecords}
              instruments={instruments}
              parameters={parameters}
              qcTargets={qcTargets}
            />
          )}
        </main>
      </div>
    </div>
  );
}
