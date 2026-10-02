import React, { useState } from 'react';
import {
  AlertTriangle,
  Sliders,
  TrendingUp,
  ShieldAlert,
  CheckCircle,
  HelpCircle,
  Clock,
  CheckCircle2,
  FileText,
  Search,
  Settings2,
  Trash2,
} from 'lucide-react';
import { User, WestgardRuleDefinition, WestgardViolation } from '../types/index.ts';
import { storage } from '../services/storage.ts';

interface WestgardViewProps {
  currentUser: User;
  violations: WestgardViolation[];
  onViolationUpdated: (updated: WestgardViolation) => void;
  onViolationDeleted?: (id: string) => void;
  onNavigateToLJ: (instrumentName: string, parameterName: string, level: string) => void;
  onNavigateToCAPAWithData: (data: any) => void;
}

export const WestgardView: React.FC<WestgardViewProps> = ({
  currentUser,
  violations,
  onViolationUpdated,
  onViolationDeleted,
  onNavigateToLJ,
  onNavigateToCAPAWithData,
}) => {
  const [activeTab, setActiveTab] = useState<'violations' | 'rules'>('violations');
  const [rules, setRules] = useState<WestgardRuleDefinition[]>(() => storage.getWestgardRules());

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Belum Ditindaklanjuti' | 'Dalam CAPA' | 'Selesai'>('All');
  const [severityFilter, setSeverityFilter] = useState<'All' | 'WARNING' | 'REJECT'>('All');

  // Resolution Modal
  const [resolvingViolation, setResolvingViolation] = useState<WestgardViolation | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Toggle Rule in SOP Settings
  const handleToggleRule = (ruleId: string) => {
    const updated = rules.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
    setRules(updated);
    storage.saveWestgardRules(updated);
  };

  // Mark Violation Resolved
  const handleConfirmResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingViolation) return;

    if (!resolutionNotes.trim()) {
      alert('Harap masukkan catatan tindakan penyelesaian.');
      return;
    }

    const updated: WestgardViolation = {
      ...resolvingViolation,
      status: 'Selesai',
      actionNotes: resolutionNotes.trim(),
      resolvedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      resolvedBy: currentUser.name,
    };

    onViolationUpdated(updated);
    setResolvingViolation(null);
    setResolutionNotes('');
  };

  // Filtered Violations
  const filteredViolations = violations.filter((v) => {
    const matchSearch =
      v.parameterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.instrumentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.ruleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.date.includes(searchTerm);

    const matchStatus = statusFilter === 'All' || v.status === statusFilter;
    const matchSeverity = severityFilter === 'All' || v.severity === severityFilter;

    return matchSearch && matchStatus && matchSeverity;
  });

  const unresolvedCount = violations.filter((v) => v.status !== 'Selesai').length;

  return (
    <div className="space-y-6">
      {/* Top Banner and Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Pelanggaran Aturan Westgard
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Deteksi otomatis kesalahan acak (random error) & sistemik (systematic error) berdasarkan
            standar CLSI
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab('violations')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'violations'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>Daftar Pelanggaran ({violations.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings2 className="w-4 h-4 text-teal-600" />
            <span>Pengaturan SOP Westgard</span>
          </button>
        </div>
      </div>

      {activeTab === 'violations' ? (
        <>
          {/* Quick Filter and Search Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari parameter, alat, aturan..."
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white outline-none"
                >
                  <option value="All">Semua Status</option>
                  <option value="Belum Ditindaklanjuti">Belum Ditindaklanjuti</option>
                  <option value="Dalam CAPA">Dalam CAPA</option>
                  <option value="Selesai">Selesai</option>
                </select>

                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white outline-none"
                >
                  <option value="All">Semua Tingkat</option>
                  <option value="WARNING">Warning (1-2s)</option>
                  <option value="REJECT">Reject</option>
                </select>
              </div>
            </div>
          </div>

          {/* Violations Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Tanggal & Waktu</th>
                    <th className="py-3 px-4">Alat & Parameter</th>
                    <th className="py-3 px-4">Level & Lot</th>
                    <th className="py-3 px-4 text-right">Hasil QC (Z-Score)</th>
                    <th className="py-3 px-4">Jenis Pelanggaran</th>
                    <th className="py-3 px-4">Rekomendasi SOP Laboratorium</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredViolations.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <span className="font-semibold text-slate-700">Tidak ada pelanggaran Westgard yang sesuai kriteria.</span>
                      </td>
                    </tr>
                  ) : (
                    filteredViolations.map((v) => {
                      const isReject = v.severity === 'REJECT';
                      return (
                        <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-semibold text-slate-900">{v.date}</div>
                            <div className="text-[10px] text-slate-400">{v.time}</div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-bold text-slate-900">{v.parameterName}</div>
                            <div className="text-[11px] text-slate-500">{v.instrumentName}</div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="text-slate-800 font-medium">{v.level}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">Lot: {v.lotNumber}</span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="font-mono font-bold text-slate-900">{v.resultValue}</div>
                            <div
                              className={`text-[11px] font-mono font-bold ${
                                isReject ? 'text-rose-600' : 'text-amber-600'
                              }`}
                            >
                              Z: {v.zScore > 0 ? `+${v.zScore}` : v.zScore} SD
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                isReject
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {v.ruleName}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Tipe: {v.errorType} Error
                            </span>
                          </td>
                          <td className="py-3 px-4 max-w-sm">
                            <p className="text-slate-700 text-[11px] leading-relaxed line-clamp-2" title={v.sopRecommendation}>
                              {v.sopRecommendation}
                            </p>
                            {v.actionNotes && (
                              <div className="text-[10px] text-emerald-700 mt-1 font-medium bg-emerald-50 p-1 rounded">
                                Penyelesaian: {v.actionNotes} ({v.resolvedBy} · {v.resolvedAt})
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {v.status === 'Belum Ditindaklanjuti' && (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                                Butuh Aksi
                              </span>
                            )}
                            {v.status === 'Dalam CAPA' && (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                                Dalam CAPA
                              </span>
                            )}
                            {v.status === 'Selesai' && (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                Selesai
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Lihat Grafik */}
                              <button
                                onClick={() => onNavigateToLJ(v.instrumentName, v.parameterName, v.level)}
                                title="Lihat Grafik Levey-Jennings"
                                className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded text-[11px] font-semibold flex items-center gap-1"
                              >
                                <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
                                <span className="hidden sm:inline">Grafik</span>
                              </button>

                              {/* Buat CAPA */}
                              <button
                                onClick={() => {
                                  onNavigateToCAPAWithData({
                                    problemSource: `Pelanggaran Westgard (${v.ruleName})`,
                                    instrumentName: v.instrumentName,
                                    parameterName: v.parameterName,
                                    violationType: v.ruleName,
                                    violationId: v.id,
                                    qcRecordId: v.qcRecordId,
                                    problemDescription: `Terjadi pelanggaran ${v.ruleName} pada ${v.parameterName} (${v.level}) dengan hasil ${v.resultValue} (Z: ${v.zScore} SD) pada tanggal ${v.date}.`,
                                  });
                                }}
                                title="Buat CAPA dari Pelanggaran Ini"
                                className="px-2 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 shadow-xs"
                              >
                                <ShieldAlert className="w-3.5 h-3.5" />
                                <span>CAPA</span>
                              </button>

                              {/* Tandai Selesai */}
                              {v.status !== 'Selesai' && (
                                <button
                                  onClick={() => {
                                    setResolvingViolation(v);
                                    setResolutionNotes('');
                                  }}
                                  title="Tandai Sudah Ditindaklanjuti"
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[11px] font-semibold flex items-center gap-1"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Selesai</span>
                                </button>
                              )}

                              {/* Hapus Rekaman Pelanggaran */}
                              {onViolationDeleted && (
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Hapus rekaman pelanggaran ${v.ruleName} pada ${v.parameterName}?`)) {
                                      onViolationDeleted(v.id);
                                    }
                                  }}
                                  title="Hapus Pelanggaran"
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Settings Tab for Westgard Rules (CLSI C24 SOP) */
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">
              Konfigurasi Aturan Multi-Rule Westgard (SOP Laboratorium)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Aktifkan atau nonaktifkan aturan evaluasi Westgard sesuai dengan pedoman kendali mutu
              internal yang disetujui oleh Penanggung Jawab Laboratorium (Sp.PK).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={`p-4 rounded-xl border transition-all ${
                  rule.enabled
                    ? 'border-slate-300 bg-white shadow-xs'
                    : 'border-slate-200 bg-slate-50 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                        rule.severity === 'REJECT'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rule.id}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{rule.name}</h4>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => handleToggleRule(rule.id)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
                  </label>
                </div>

                <p className="text-xs text-slate-600 mb-2">{rule.description}</p>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Tipe Kesalahan:</span>
                    <span className="font-semibold text-slate-800">{rule.errorType} Error</span>
                  </div>
                  <div className="text-slate-700">
                    <strong className="text-slate-900">Rekomendasi SOP:</strong> {rule.sopRecommendation}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolution Note Modal */}
      {resolvingViolation && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Tandai Pelanggaran Ditindaklanjuti</h3>
              </div>
              <button
                onClick={() => setResolvingViolation(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleConfirmResolution} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Parameter:</span>
                  <span className="font-semibold text-slate-800">{resolvingViolation.parameterName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pelanggaran:</span>
                  <span className="font-bold text-rose-700">{resolvingViolation.ruleName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Z-Score:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {resolvingViolation.zScore > 0 ? `+${resolvingViolation.zScore}` : resolvingViolation.zScore} SD
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Tindakan Penyelesaian <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Misal: Dilakukan pencucian probe kuvet dan pengulangan kontrol vial baru, hasil kembali dalam batas ±1SD..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResolvingViolation(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Simpan & Tandai Selesai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
