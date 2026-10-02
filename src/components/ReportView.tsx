import React, { useState, useMemo } from 'react';
import {
  Printer,
  Download,
  FileSpreadsheet,
  Filter,
  Calendar,
  Building,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';
import {
  CAPARecord,
  Instrument,
  LabProfile,
  Parameter,
  QCRecord,
  QCTarget,
  User,
  WestgardViolation,
} from '../types/index.ts';
import { storage, APP_LOGO_SRC } from '../services/storage.ts';

interface ReportViewProps {
  currentUser: User;
  qcRecords: QCRecord[];
  violations: WestgardViolation[];
  capaRecords: CAPARecord[];
  instruments: Instrument[];
  parameters: Parameter[];
  qcTargets: QCTarget[];
}

type ReportType =
  | 'daily'
  | 'monthly'
  | 'parameter'
  | 'levey-jennings'
  | 'westgard'
  | 'capa';

export const ReportView: React.FC<ReportViewProps> = ({
  currentUser,
  qcRecords,
  violations,
  capaRecords,
  instruments,
  parameters,
  qcTargets,
}) => {
  const labProfile: LabProfile = storage.getLabProfile();

  // Report Type
  const [reportType, setReportType] = useState<ReportType>('daily');

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [filterInstrument, setFilterInstrument] = useState<string>('All');
  const [filterParameter, setFilterParameter] = useState<string>('All');
  const [filterLevel, setFilterLevel] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  // Filtered QC records
  const filteredQC = useMemo(() => {
    return qcRecords
      .filter((r) => {
        const inDate = r.date >= startDate && r.date <= endDate;
        const matchInst = filterInstrument === 'All' || r.instrumentName === filterInstrument;
        const matchParam = filterParameter === 'All' || r.parameterName === filterParameter;
        const matchLevel = filterLevel === 'All' || r.level === filterLevel;
        const matchStatus = filterStatus === 'All' || r.status === filterStatus;
        return inDate && matchInst && matchParam && matchLevel && matchStatus;
      })
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  }, [qcRecords, startDate, endDate, filterInstrument, filterParameter, filterLevel, filterStatus]);

  // Filtered Violations
  const filteredViolations = useMemo(() => {
    return violations.filter((v) => {
      const inDate = v.date >= startDate && v.date <= endDate;
      const matchInst = filterInstrument === 'All' || v.instrumentName === filterInstrument;
      const matchParam = filterParameter === 'All' || v.parameterName === filterParameter;
      return inDate && matchInst && matchParam;
    });
  }, [violations, startDate, endDate, filterInstrument, filterParameter]);

  // Filtered CAPA
  const filteredCAPA = useMemo(() => {
    return capaRecords.filter((c) => {
      const inDate = c.date >= startDate && c.date <= endDate;
      const matchInst = filterInstrument === 'All' || c.instrumentName === filterInstrument;
      const matchParam = filterParameter === 'All' || c.parameterName === filterParameter;
      return inDate && matchInst && matchParam;
    });
  }, [capaRecords, startDate, endDate, filterInstrument, filterParameter]);

  // Overall Statistics for current selection
  const stats = useMemo(() => {
    const total = filteredQC.length;
    const pass = filteredQC.filter((r) => r.status === 'PASS').length;
    const warn = filteredQC.filter((r) => r.status === 'WARNING').length;
    const rej = filteredQC.filter((r) => r.status === 'REJECT').length;
    const passRate = total > 0 ? Number(((pass / total) * 100).toFixed(1)) : 0;
    return { total, pass, warn, rej, passRate };
  }, [filteredQC]);

  const [isPrintPreview, setIsPrintPreview] = useState(false);

  // Print Handler
  const handlePrint = () => {
    setIsPrintPreview(true);
  };

  // Export to CSV (Excel compatible with UTF-8 BOM)
  const handleExportCSV = () => {
    let csvContent = '\uFEFF'; // UTF-8 BOM

    if (reportType === 'daily' || reportType === 'monthly' || reportType === 'parameter') {
      csvContent += 'Tanggal,Jam,Alat,Parameter,Level,Lot,Hasil,Satuan,Target Mean,Target SD,Target CV%,Z-Score,Status,Petugas,Keterangan\n';
      filteredQC.forEach((r) => {
        csvContent += `"${r.date}","${r.time}","${r.instrumentName}","${r.parameterName}","${r.level}","${r.lotNumber}",${r.resultValue},"${r.unit}",${r.targetMean},${r.targetSd},${r.targetCv}%,${r.zScore},"${r.status}","${r.officerName}","${r.notes || ''}"\n`;
      });
    } else if (reportType === 'westgard') {
      csvContent += 'Tanggal,Jam,Alat,Parameter,Level,Lot,Hasil,Z-Score,Aturan,Tipe Kesalahan,Rekomendasi SOP,Status Tindakan\n';
      filteredViolations.forEach((v) => {
        csvContent += `"${v.date}","${v.time}","${v.instrumentName}","${v.parameterName}","${v.level}","${v.lotNumber}",${v.resultValue},${v.zScore},"${v.ruleName}","${v.errorType}","${v.sopRecommendation}","${v.status}"\n`;
      });
    } else if (reportType === 'capa') {
      csvContent += 'Nomor CAPA,Tanggal,Alat,Parameter,Sumber,Pelanggaran,Deskripsi,Akar Penyebab,Tindakan Korektif,Tindakan Pencegahan,PIC,Target Selesai,Status,Hasil Verifikasi\n';
      filteredCAPA.forEach((c) => {
        csvContent += `"${c.capaNumber}","${c.date}","${c.instrumentName}","${c.parameterName}","${c.problemSource}","${c.violationType}","${c.problemDescription.replace(/"/g, '""')}","${(c.rootCauseAnalysis || '').replace(/"/g, '""')}","${c.correctiveAction.replace(/"/g, '""')}","${(c.preventiveAction || '').replace(/"/g, '""')}","${c.pic}","${c.targetDate}","${c.status}","${(c.verificationResult || '').replace(/"/g, '""')}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_QC_${reportType}_${startDate}_sd_${endDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'daily':
        return 'LAPORAN HASIL KENDALI MUTU (QC) HARIAN';
      case 'monthly':
        return 'LAPORAN REKAPITULASI EVALUASI QC BULANAN';
      case 'parameter':
        return 'LAPORAN REKAPITULASI QC PER PARAMETER UJI';
      case 'levey-jennings':
        return 'LAPORAN STATISTIK & GRAFIK LEVEY-JENNINGS';
      case 'westgard':
        return 'LAPORAN LOG PELANGGARAN ATURAN WESTGARD';
      case 'capa':
        return 'LAPORAN MONITORING STATUS TINDAKAN KOREKTIF & PENCEGAHAN (CAPA)';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Pusat Laporan & Rekapitulasi QC
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Pencetakan dokumen resmi kendali mutu untuk akreditasi, audit, dan verifikasi dokter Sp.PK
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel (CSV)</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl text-xs font-semibold">
        {[
          { id: 'daily', label: '1. Laporan QC Harian' },
          { id: 'monthly', label: '2. Rekapitulasi Bulanan' },
          { id: 'parameter', label: '3. Per Parameter' },
          { id: 'levey-jennings', label: '4. Ringkasan Levey-Jennings' },
          { id: 'westgard', label: '5. Pelanggaran Westgard' },
          { id: 'capa', label: '6. Status CAPA' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id as ReportType)}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              reportType === tab.id
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Nama Alat</label>
            <select
              value={filterInstrument}
              onChange={(e) => setFilterInstrument(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white outline-none"
            >
              <option value="All">Semua Alat</option>
              {instruments.map((i) => (
                <option key={i.id} value={i.name}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Parameter</label>
            <select
              value={filterParameter}
              onChange={(e) => setFilterParameter(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white outline-none"
            >
              <option value="All">Semua Parameter</option>
              {parameters.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Level Kontrol</label>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white outline-none"
            >
              <option value="All">Semua Level</option>
              <option value="Level 1">Level 1</option>
              <option value="Level 2">Level 2</option>
              <option value="Level 3">Level 3</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Status QC</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white outline-none"
            >
              <option value="All">Semua Status</option>
              <option value="PASS">PASS</option>
              <option value="WARNING">WARNING</option>
              <option value="REJECT">REJECT</option>
            </select>
          </div>
        </div>
      </div>

      {/* Official Printable Report Paper Container */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm p-6 sm:p-10 space-y-6 text-xs text-slate-900 print:shadow-none print:border-none print:p-0">
        {/* Kop Resmi Laboratorium */}
        <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={APP_LOGO_SRC}
              alt="Logo Kabupaten Kayong Utara"
              referrerPolicy="no-referrer"
              className="h-16 w-16 object-contain shrink-0"
            />
            <div>
              <div className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">
                Pemerintah Kabupaten Kayong Utara
              </div>
              <h1 className="text-base sm:text-lg font-black tracking-tight uppercase text-slate-900 leading-tight">
                RSUD SULTAN MUHAMMAD JAMALUDIN I
              </h1>
              <p className="text-xs font-bold text-teal-800">
                INSTALASI LABORATORIUM PATOLOGI KLINIK
              </p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Jalan Provinsi, Sukadana - Kayong Utara, Kode Pos 78852 · Telp: (0534) 771-0022
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                SIP/Izin Operasional: No. 445/012-DINKES/SMJ1/2024
              </p>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4 text-[11px] text-slate-500 space-y-0.5 shrink-0">
            <div>
              Tanggal Cetak:{' '}
              <strong className="text-slate-800 font-mono">
                {new Date().toISOString().replace('T', ' ').slice(0, 16)}
              </strong>
            </div>
            <div>
              Dicetak Oleh:{' '}
              <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.roleLabel})
            </div>
            <div className="text-[10px] text-slate-400">Status Validasi Dokumen: RESMI</div>
          </div>
        </div>

        {/* Report Title & Metadata Box */}
        <div className="text-center space-y-1">
          <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-slate-900">
            {getReportTitle()}
          </h2>
          <div className="flex items-center justify-center gap-3 text-xs text-slate-600">
            <span>
              Periode: <strong>{startDate}</strong> s/d <strong>{endDate}</strong>
            </span>
            <span>·</span>
            <span>
              Alat: <strong>{filterInstrument}</strong>
            </span>
            <span>·</span>
            <span>
              Parameter: <strong>{filterParameter}</strong>
            </span>
          </div>
        </div>

        {/* Summary Metric Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">TOTAL RUN</span>
            <span className="text-sm font-bold text-slate-900 font-mono">{stats.total}</span>
          </div>
          <div>
            <span className="text-[10px] text-emerald-600 block font-medium">PASS (NORMAL)</span>
            <span className="text-sm font-bold text-emerald-700 font-mono">{stats.pass}</span>
          </div>
          <div>
            <span className="text-[10px] text-amber-600 block font-medium">WARNING (1-2s)</span>
            <span className="text-sm font-bold text-amber-700 font-mono">{stats.warn}</span>
          </div>
          <div>
            <span className="text-[10px] text-rose-600 block font-medium">REJECT</span>
            <span className="text-sm font-bold text-rose-700 font-mono">{stats.rej}</span>
          </div>
          <div>
            <span className="text-[10px] text-teal-600 block font-medium">TINGKAT KEPATUHAN</span>
            <span className="text-sm font-bold text-teal-800 font-mono">{stats.passRate}%</span>
          </div>
        </div>

        {/* Dynamic Report Content Based on Selected Tab */}
        {reportType === 'daily' || reportType === 'monthly' || reportType === 'parameter' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-300">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-semibold uppercase text-[10px]">
                  <th className="p-2 border-r border-slate-300">Tanggal & Jam</th>
                  <th className="p-2 border-r border-slate-300">Alat</th>
                  <th className="p-2 border-r border-slate-300">Parameter</th>
                  <th className="p-2 border-r border-slate-300">Level & Lot</th>
                  <th className="p-2 text-right border-r border-slate-300">Hasil QC</th>
                  <th className="p-2 text-right border-r border-slate-300">Target (Mean±SD)</th>
                  <th className="p-2 text-center border-r border-slate-300">Z-Score</th>
                  <th className="p-2 text-center border-r border-slate-300">Status</th>
                  <th className="p-2">Keterangan / Ahli Teknologi Laboratorium Medik (ATLM)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredQC.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-400">
                      Tidak ada rekaman QC pada periode dan filter yang dipilih.
                    </td>
                  </tr>
                ) : (
                  filteredQC.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-200 whitespace-nowrap font-mono text-[11px]">
                        {r.date} {r.time}
                      </td>
                      <td className="p-2 border-r border-slate-200 font-medium">{r.instrumentName}</td>
                      <td className="p-2 border-r border-slate-200 font-bold">{r.parameterName}</td>
                      <td className="p-2 border-r border-slate-200">
                        {r.level} <span className="text-[10px] text-slate-400 block font-mono">Lot: {r.lotNumber}</span>
                      </td>
                      <td className="p-2 text-right border-r border-slate-200 font-mono font-bold">
                        {r.resultValue} {r.unit}
                      </td>
                      <td className="p-2 text-right border-r border-slate-200 font-mono text-[11px]">
                        {r.targetMean} (±{r.targetSd})
                      </td>
                      <td className="p-2 text-center border-r border-slate-200 font-mono font-bold text-[11px]">
                        <span
                          className={
                            r.status === 'REJECT'
                              ? 'text-rose-600'
                              : r.status === 'WARNING'
                              ? 'text-amber-600'
                              : 'text-slate-800'
                          }
                        >
                          {r.zScore > 0 ? `+${r.zScore}` : r.zScore}
                        </span>
                      </td>
                      <td className="p-2 text-center border-r border-slate-200 font-bold text-[10px]">
                        <span
                          className={`px-1.5 py-0.5 rounded ${
                            r.status === 'PASS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.status === 'WARNING'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="p-2 text-[11px] text-slate-600">
                        <div>{r.notes || '-'}</div>
                        <div className="text-[10px] text-slate-400">Pemeriksa: {r.officerName}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : null}

        {/* Levey-Jennings Summary Report */}
        {reportType === 'levey-jennings' && (
          <div className="space-y-4">
            <div className="border border-slate-300 p-4 rounded-xl space-y-3">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Ringkasan Kinerja Statistik Presisi & Akurasi Parameter
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 border-b border-slate-300 text-[10px] uppercase font-bold text-slate-700">
                    <tr>
                      <th className="p-2 border-r border-slate-300">Alat</th>
                      <th className="p-2 border-r border-slate-300">Parameter</th>
                      <th className="p-2 border-r border-slate-300">Level</th>
                      <th className="p-2 text-right border-r border-slate-300">Target Mean</th>
                      <th className="p-2 text-right border-r border-slate-300">Aktual Mean</th>
                      <th className="p-2 text-right border-r border-slate-300">Bias</th>
                      <th className="p-2 text-right border-r border-slate-300">Target CV%</th>
                      <th className="p-2 text-right border-r border-slate-300">Aktual CV%</th>
                      <th className="p-2 text-center border-r border-slate-300">N (Runs)</th>
                      <th className="p-2 text-center">Evaluasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {qcTargets.map((tgt) => {
                      const recordsForTgt = qcRecords.filter(
                        (r) =>
                          r.instrumentName === tgt.instrumentName &&
                          r.parameterName === tgt.parameterName &&
                          r.level === tgt.level
                      );

                      if (recordsForTgt.length === 0) return null;

                      const vals = recordsForTgt.map((r) => r.resultValue);
                      const n = vals.length;
                      const actMean = Number((vals.reduce((a, b) => a + b, 0) / n).toFixed(2));
                      const variance =
                        n > 1
                          ? vals.reduce((a, b) => a + Math.pow(b - actMean, 2), 0) / (n - 1)
                          : 0;
                      const actSd = Math.sqrt(variance);
                      const actCv = actMean > 0 ? Number(((actSd / actMean) * 100).toFixed(2)) : 0;
                      const bias = Number((actMean - tgt.mean).toFixed(2));
                      const isAcceptable = actCv <= tgt.cv * 1.25;

                      return (
                        <tr key={tgt.id} className="hover:bg-slate-50">
                          <td className="p-2 border-r border-slate-200 font-medium">{tgt.instrumentName}</td>
                          <td className="p-2 border-r border-slate-200 font-bold">{tgt.parameterName}</td>
                          <td className="p-2 border-r border-slate-200">{tgt.level}</td>
                          <td className="p-2 text-right border-r border-slate-200 font-mono">{tgt.mean}</td>
                          <td className="p-2 text-right border-r border-slate-200 font-mono font-bold">{actMean}</td>
                          <td className="p-2 text-right border-r border-slate-200 font-mono text-[11px]">
                            {bias > 0 ? `+${bias}` : bias}
                          </td>
                          <td className="p-2 text-right border-r border-slate-200 font-mono">{tgt.cv}%</td>
                          <td className="p-2 text-right border-r border-slate-200 font-mono font-bold">{actCv}%</td>
                          <td className="p-2 text-center border-r border-slate-200 font-mono">{n}</td>
                          <td className="p-2 text-center font-bold text-[10px]">
                            <span
                              className={`px-1.5 py-0.5 rounded ${
                                isAcceptable
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {isAcceptable ? 'MEMENUHI' : 'PERIKSA'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Westgard Violations Report */}
        {reportType === 'westgard' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2 border-r border-slate-300">Tanggal & Jam</th>
                  <th className="p-2 border-r border-slate-300">Alat & Parameter</th>
                  <th className="p-2 border-r border-slate-300">Level & Lot</th>
                  <th className="p-2 text-right border-r border-slate-300">Hasil & Z-Score</th>
                  <th className="p-2 border-r border-slate-300">Aturan Westgard</th>
                  <th className="p-2 border-r border-slate-300">Rekomendasi SOP</th>
                  <th className="p-2 text-center border-r border-slate-300">Status</th>
                  <th className="p-2">Tindakan Penyelesaian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredViolations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400">
                      Tidak terdapat pelanggaran Westgard pada periode ini.
                    </td>
                  </tr>
                ) : (
                  filteredViolations.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-200 whitespace-nowrap font-mono">
                        {v.date} {v.time}
                      </td>
                      <td className="p-2 border-r border-slate-200">
                        <div className="font-bold">{v.parameterName}</div>
                        <div className="text-[10px] text-slate-500">{v.instrumentName}</div>
                      </td>
                      <td className="p-2 border-r border-slate-200 font-mono">
                        {v.level} (Lot: {v.lotNumber})
                      </td>
                      <td className="p-2 text-right border-r border-slate-200 font-mono font-bold">
                        {v.resultValue} (Z: {v.zScore > 0 ? `+${v.zScore}` : v.zScore})
                      </td>
                      <td className="p-2 border-r border-slate-200 font-bold text-rose-700">
                        {v.ruleName}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-[11px] text-slate-600">
                        {v.sopRecommendation}
                      </td>
                      <td className="p-2 text-center border-r border-slate-200 font-bold text-[10px]">
                        {v.status}
                      </td>
                      <td className="p-2 text-[11px] text-slate-700">
                        {v.actionNotes || 'Sedang dalam penanganan.'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* CAPA Status Report */}
        {reportType === 'capa' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2 border-r border-slate-300">Nomor CAPA</th>
                  <th className="p-2 border-r border-slate-300">Tanggal</th>
                  <th className="p-2 border-r border-slate-300">Alat & Parameter</th>
                  <th className="p-2 border-r border-slate-300">Deskripsi Masalah</th>
                  <th className="p-2 border-r border-slate-300">Akar Masalah (RCA)</th>
                  <th className="p-2 border-r border-slate-300">Tindakan Korektif</th>
                  <th className="p-2 border-r border-slate-300">PIC & Target</th>
                  <th className="p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredCAPA.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400">
                      Tidak ada rekaman CAPA pada periode ini.
                    </td>
                  </tr>
                ) : (
                  filteredCAPA.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-200 font-mono font-bold text-teal-800 whitespace-nowrap">
                        {c.capaNumber}
                      </td>
                      <td className="p-2 border-r border-slate-200 font-mono whitespace-nowrap">
                        {c.date}
                      </td>
                      <td className="p-2 border-r border-slate-200">
                        <div className="font-bold">{c.parameterName}</div>
                        <div className="text-[10px] text-slate-500">{c.instrumentName}</div>
                      </td>
                      <td className="p-2 border-r border-slate-200 text-[11px] max-w-xs line-clamp-2">
                        {c.problemDescription}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-[11px] max-w-xs line-clamp-2">
                        {c.rootCauseAnalysis}
                      </td>
                      <td className="p-2 border-r border-slate-200 text-[11px] max-w-xs line-clamp-2">
                        {c.correctiveAction}
                      </td>
                      <td className="p-2 border-r border-slate-200 whitespace-nowrap text-[11px]">
                        <div className="font-medium">{c.pic}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{c.targetDate}</div>
                      </td>
                      <td className="p-2 text-center font-bold text-[10px] whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            c.status === 'Closed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'Dalam Proses'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Official Signature Section */}
        <div className="grid grid-cols-2 gap-12 pt-8 border-t-2 border-slate-900 text-center text-xs">
          <div>
            <p className="text-slate-500 text-[11px]">Dibuat & Diperiksa Oleh:</p>
            <div className="h-20 flex items-end justify-center font-bold text-slate-900">
              Rudi Kurniawan, A.Md.AK
            </div>
            <p className="text-[11px] text-slate-600 font-medium">Ahli Teknologi Laboratorium Medik (ATLM) Pelaksana</p>
            <p className="text-[10px] text-slate-400 font-mono">NIP: 199203152015031002</p>
          </div>

          <div>
            <p className="text-slate-500 text-[11px]">Diverifikasi & Disetujui Oleh:</p>
            <div className="h-20 flex items-end justify-center font-bold text-slate-900">
              dr. Maya Andriani, Sp.PK
            </div>
            <p className="text-[11px] text-slate-600 font-medium">
              Penanggung Jawab Laboratorium / Dokter Spesialis Patologi Klinik
            </p>
            <p className="text-[10px] text-slate-400 font-mono">SIP: 445/782-DPMPTSP/YANKES/2023</p>
          </div>
        </div>
      </div>

      {/* Print Preview Modal */}
      {isPrintPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">Pratinjau Cetak Laporan Mutu Laboratorium</h3>
              </div>
              <button
                onClick={() => setIsPrintPreview(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 bg-slate-100 flex-1">
              <div className="bg-white p-8 rounded-xl shadow-md border border-slate-300 max-w-3xl mx-auto space-y-6 text-xs text-slate-900">
                <div className="text-center font-bold text-sm uppercase text-slate-900">
                  Pratinjau Dokumen Laporan Mutu ({reportType.toUpperCase()})
                </div>
                <div className="text-center text-slate-600 text-xs">
                  Total Data Terpilih: <strong>{stats.total}</strong> record | Pass Rate: <strong className="text-emerald-700">{stats.passRate}%</strong>
                </div>
                <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg text-teal-900 text-center">
                  Dokumen siap untuk dicetak atau diekspor ke format CSV / Excel.
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-end gap-3">
              <button
                onClick={() => setIsPrintPreview(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Tutup
              </button>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Unduh CSV</span>
              </button>
              <button
                onClick={() => {
                  setIsPrintPreview(false);
                  setTimeout(() => window.print(), 300);
                }}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
