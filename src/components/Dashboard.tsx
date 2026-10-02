import React, { useMemo } from 'react';
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  FileText,
  Clock,
  Layers,
} from 'lucide-react';
import { CAPARecord, QCRecord, WestgardViolation } from '../types/index.ts';
import { ActiveTab } from './Sidebar.tsx';

interface DashboardProps {
  qcRecords: QCRecord[];
  violations: WestgardViolation[];
  capaRecords: CAPARecord[];
  onNavigate: (tab: ActiveTab, prefillData?: any) => void;
  onInspectQC: (record: QCRecord) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  qcRecords,
  violations,
  capaRecords,
  onNavigate,
  onInspectQC,
}) => {
  // Today's date in local ISO
  const todayStr = useMemo(() => {
    // Pick the latest record's date or today
    if (qcRecords.length > 0) {
      return qcRecords[0].date;
    }
    return new Date().toISOString().split('T')[0];
  }, [qcRecords]);

  // Daily Stats
  const todayRecords = useMemo(
    () => qcRecords.filter((r) => r.date === todayStr),
    [qcRecords, todayStr]
  );

  const totalToday = todayRecords.length;
  const passToday = todayRecords.filter((r) => r.status === 'PASS').length;
  const warningToday = todayRecords.filter((r) => r.status === 'WARNING').length;
  const rejectToday = todayRecords.filter((r) => r.status === 'REJECT').length;

  // Westgard unresolved & open CAPA
  const unresolvedViolations = useMemo(
    () => violations.filter((v) => v.status !== 'Selesai'),
    [violations]
  );

  const openCapaList = useMemo(
    () => capaRecords.filter((c) => c.status === 'Open' || c.status === 'Dalam Proses'),
    [capaRecords]
  );

  // Latest 8 QC Records
  const latestRecords = useMemo(() => qcRecords.slice(0, 8), [qcRecords]);

  // 7-day trend calculation
  const trendData = useMemo(() => {
    const datesMap = new Map<string, { pass: number; warning: number; reject: number }>();

    // Get last 7 distinct dates
    const uniqueDates = Array.from(new Set(qcRecords.map((r) => r.date)))
      .sort()
      .slice(-7);

    uniqueDates.forEach((d) => {
      datesMap.set(d, { pass: 0, warning: 0, reject: 0 });
    });

    qcRecords.forEach((r) => {
      if (datesMap.has(r.date)) {
        const item = datesMap.get(r.date)!;
        if (r.status === 'PASS') item.pass++;
        else if (r.status === 'WARNING') item.warning++;
        else if (r.status === 'REJECT') item.reject++;
      }
    });

    return Array.from(datesMap.entries()).map(([date, counts]) => ({
      date,
      displayDate: date.slice(5), // MM-DD
      ...counts,
      total: counts.pass + counts.warning + counts.reject,
    }));
  }, [qcRecords]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Dashboard Pemantauan QC
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Ringkasan Kendali Mutu Internal (PMI) Laboratorium · Data tanggal acuan:{' '}
            <span className="font-semibold text-slate-700">{todayStr}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('input-qc')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Input QC Baru</span>
          </button>
          <button
            onClick={() => onNavigate('levey-jennings')}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors"
          >
            <TrendingUp className="w-4 h-4 text-teal-600" />
            <span className="hidden sm:inline">Grafik LJ</span>
          </button>
        </div>
      </div>

      {/* Westgard Alert Box (If unresolved violations exist) */}
      {unresolvedViolations.length > 0 && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-rose-900">
                Peringatan: Terdapat {unresolvedViolations.length} Pelanggaran Aturan Westgard yang Belum Selesai!
              </h3>
              <p className="text-xs text-rose-700 mt-0.5">
                Segera evaluasi parameter terkait ({unresolvedViolations.slice(0, 3).map((v) => `${v.parameterName} [${v.ruleName}]`).join(', ')}).
                Tahan pengeluaran hasil pasien jika berstatus Reject sesuai SOP.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate('westgard')}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              Evaluasi Pelanggaran →
            </button>
          </div>
        </div>
      )}

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total QC Hari Ini */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total QC</span>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalToday}</div>
          <p className="text-[11px] text-slate-500 mt-1">Pemeriksaan hari ini</p>
        </div>

        {/* Normal / Pass */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Normal (Pass)</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{passToday}</div>
          <p className="text-[11px] text-emerald-600/80 mt-1 font-medium">Dalam batas aman (±2SD)</p>
        </div>

        {/* Warning (1-2s) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Warning</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{warningToday}</div>
          <p className="text-[11px] text-amber-600/80 mt-1 font-medium">Aturan 1-2s (Waspada)</p>
        </div>

        {/* Reject */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Reject</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-700">{rejectToday}</div>
          <p className="text-[11px] text-rose-600/80 mt-1 font-medium">Di luar batas toleransi</p>
        </div>

        {/* Westgard Violations */}
        <div
          onClick={() => onNavigate('westgard')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-purple-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-purple-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pelanggaran</span>
            <Layers className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-purple-700">{unresolvedViolations.length}</div>
          <p className="text-[11px] text-purple-600/80 mt-1 font-medium">Perlu tindak lanjut</p>
        </div>

        {/* Open CAPA */}
        <div
          onClick={() => onNavigate('capa')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">CAPA Aktif</span>
            <ShieldAlert className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-blue-700">{openCapaList.length}</div>
          <p className="text-[11px] text-blue-600/80 mt-1 font-medium">Dalam investigasi</p>
        </div>
      </div>

      {/* Middle Grid: Trend Chart & Quick Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Tren Kinerja QC (7 Hari Terakhir)</h3>
              <p className="text-xs text-slate-500">Distribusi hasil Pass, Warning, dan Reject per tanggal</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block"></span>
                <span>Pass</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-amber-400 inline-block"></span>
                <span>Warning</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-rose-500 inline-block"></span>
                <span>Reject</span>
              </span>
            </div>
          </div>

          {/* Bar Chart Visualizer */}
          <div className="pt-2">
            {trendData.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-xs text-slate-400">
                Belum ada data riwayat QC
              </div>
            ) : (
              <div className="space-y-3">
                {trendData.map((item) => {
                  const maxTotal = Math.max(...trendData.map((d) => d.total), 1);
                  const passPct = (item.pass / maxTotal) * 100;
                  const warnPct = (item.warning / maxTotal) * 100;
                  const rejPct = (item.reject / maxTotal) * 100;

                  return (
                    <div key={item.date} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">{item.date}</span>
                        <span className="text-slate-500 font-mono text-[11px]">
                          Total: <strong className="text-slate-800">{item.total}</strong> ({item.pass}P · {item.warning}W · {item.reject}R)
                        </span>
                      </div>
                      <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
                        {item.pass > 0 && (
                          <div
                            style={{ width: `${passPct}%` }}
                            className="bg-emerald-500 h-full transition-all"
                            title={`Pass: ${item.pass}`}
                          />
                        )}
                        {item.warning > 0 && (
                          <div
                            style={{ width: `${warnPct}%` }}
                            className="bg-amber-400 h-full transition-all"
                            title={`Warning: ${item.warning}`}
                          />
                        )}
                        {item.reject > 0 && (
                          <div
                            style={{ width: `${rejPct}%` }}
                            className="bg-rose-500 h-full transition-all"
                            title={`Reject: ${item.reject}`}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Action & CAPA Spotlight */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Pemantauan CAPA Terbuka</h3>
              <button
                onClick={() => onNavigate('capa')}
                className="text-xs text-teal-600 hover:text-teal-800 font-semibold flex items-center gap-1"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Tindakan korektif dan preventif yang memerlukan investigasi atau penyelesaian
            </p>

            <div className="space-y-2.5">
              {openCapaList.length === 0 ? (
                <div className="p-4 rounded-lg bg-slate-50 text-center text-xs text-slate-500">
                  <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                  Semua CAPA telah diselesaikan dan diverifikasi.
                </div>
              ) : (
                openCapaList.slice(0, 3).map((capa) => (
                  <div
                    key={capa.id}
                    onClick={() => onNavigate('capa')}
                    className="p-3 rounded-lg border border-slate-200 hover:border-teal-300 hover:bg-teal-50/20 cursor-pointer transition-all text-xs"
                  >
                    <div className="flex items-center justify-between font-semibold mb-1">
                      <span className="text-teal-700 font-mono">{capa.capaNumber}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          capa.status === 'Open'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {capa.status}
                      </span>
                    </div>
                    <div className="text-slate-800 font-medium line-clamp-1">
                      {capa.instrumentName} - {capa.parameterName}
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-[11px] mt-1">
                      <Clock className="w-3 h-3" />
                      <span>Target: {capa.targetDate}</span>
                      <span>·</span>
                      <span>PIC: {capa.pic}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>SOP Mutu ISO 15189 / Akreditasi</span>
              <span className="font-semibold text-slate-700">Aktif</span>
            </div>
          </div>
        </div>
      </div>

      {/* Latest QC Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Pemeriksaan QC Terbaru
            </h3>
            <p className="text-xs text-slate-500">
              Daftar hasil kontrol kualitas harian yang terakhir dicatat
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('input-qc')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-800 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-teal-50 transition-colors"
            >
              <span>Riwayat Lengkap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Tanggal & Jam</th>
                <th className="py-3 px-4">Alat</th>
                <th className="py-3 px-4">Parameter</th>
                <th className="py-3 px-4">Level</th>
                <th className="py-3 px-4 text-right">Hasil QC</th>
                <th className="py-3 px-4 text-right">Target (SD)</th>
                <th className="py-3 px-4 text-center">Z-Score</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {latestRecords.map((r) => {
                const zColor =
                  Math.abs(r.zScore) > 3
                    ? 'text-rose-600 font-bold bg-rose-50'
                    : Math.abs(r.zScore) > 2
                    ? 'text-amber-600 font-bold bg-amber-50'
                    : 'text-slate-700 bg-slate-50';

                return (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{r.date}</div>
                      <div className="text-[10px] text-slate-400">{r.time} · {r.officerName.split(',')[0]}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 whitespace-nowrap">
                      {r.instrumentName}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {r.parameterName}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-slate-600 font-medium">{r.level}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">Lot: {r.lotNumber}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono whitespace-nowrap">
                      {r.resultValue} <span className="text-[10px] text-slate-500 font-normal">{r.unit}</span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 font-mono whitespace-nowrap text-[11px]">
                      {r.targetMean} (±{r.targetSd})
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded font-mono text-[11px] ${zColor}`}>
                        {r.zScore > 0 ? `+${r.zScore}` : r.zScore}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {r.status === 'PASS' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          PASS
                        </span>
                      )}
                      {r.status === 'WARNING' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                          WARNING
                        </span>
                      )}
                      {r.status === 'REJECT' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                          REJECT
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={r.notes}>
                      {r.violationRules && r.violationRules.length > 0 ? (
                        <span className="text-rose-700 font-medium">
                          {r.violationRules.join(', ')} - {r.notes}
                        </span>
                      ) : (
                        r.notes || '-'
                      )}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => onInspectQC(r)}
                        className="px-2 py-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded transition-colors"
                      >
                        Detail / Grafik
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
