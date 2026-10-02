import React, { useState, useMemo } from 'react';
import {
  Printer,
  Download,
  Filter,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { Instrument, Parameter, QCRecord, QCTarget } from '../types/index.ts';

interface LeveyJenningsProps {
  instruments: Instrument[];
  parameters: Parameter[];
  qcTargets: QCTarget[];
  qcRecords: QCRecord[];
  initialInstrument?: string;
  initialParameter?: string;
  initialLevel?: string;
  onNavigateToCAPAWithData: (data: any) => void;
}

export const LeveyJenningsChart: React.FC<LeveyJenningsProps> = ({
  instruments,
  parameters,
  qcTargets,
  qcRecords,
  initialInstrument,
  initialParameter,
  initialLevel,
  onNavigateToCAPAWithData,
}) => {
  // Selected Filters
  const [selectedInstrument, setSelectedInstrument] = useState<string>(
    initialInstrument || instruments[0]?.name || ''
  );

  // Available parameters for selected instrument
  const availableParams = useMemo(() => {
    const inst = instruments.find((i) => i.name === selectedInstrument);
    if (!inst) return [];
    return parameters.filter((p) => p.instrumentId === inst.id);
  }, [instruments, parameters, selectedInstrument]);

  const [selectedParameter, setSelectedParameter] = useState<string>(() => {
    if (initialParameter) return initialParameter;
    return availableParams[0]?.name || 'Glukosa Darah';
  });

  const [selectedLevel, setSelectedLevel] = useState<string>(
    initialLevel || 'Level 1'
  );

  const [dateRange, setDateRange] = useState<string>('30d'); // '30d' | 'this_month' | 'all'

  // Selected Point Inspector Modal
  const [inspectedRecord, setInspectedRecord] = useState<QCRecord | null>(null);
  const [hoveredRecord, setHoveredRecord] = useState<QCRecord | null>(null);

  // Get matching target for the selected parameter & level
  const target = useMemo(() => {
    return qcTargets.find(
      (t) =>
        t.instrumentName === selectedInstrument &&
        t.parameterName === selectedParameter &&
        t.level === selectedLevel
    );
  }, [qcTargets, selectedInstrument, selectedParameter, selectedLevel]);

  // Filtered QC records for this chart
  const filteredRecords = useMemo(() => {
    return qcRecords
      .filter((r) => {
        const matchInst = r.instrumentName === selectedInstrument;
        const matchParam = r.parameterName === selectedParameter;
        const matchLevel = r.level === selectedLevel;

        if (!matchInst || !matchParam || !matchLevel) return false;

        if (dateRange === '30d') {
          // Last 30 days
          const d = new Date();
          d.setDate(d.getDate() - 30);
          return new Date(r.date) >= d;
        } else if (dateRange === 'this_month') {
          const currentMonth = new Date().toISOString().slice(0, 7);
          return r.date.startsWith(currentMonth);
        }
        return true;
      })
      .sort((a, b) => {
        // Chronological order for chart: oldest to newest
        return `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
      });
  }, [qcRecords, selectedInstrument, selectedParameter, selectedLevel, dateRange]);

  // Calculate Actual Statistics from plotted records
  const actualStats = useMemo(() => {
    if (filteredRecords.length === 0) {
      return {
        mean: 0,
        sd: 0,
        cv: 0,
        n: 0,
        passCount: 0,
        warningCount: 0,
        rejectCount: 0,
        min: 0,
        max: 0,
      };
    }

    const values = filteredRecords.map((r) => r.resultValue);
    const n = values.length;
    const sum = values.reduce((acc, v) => acc + v, 0);
    const mean = sum / n;

    // Sample SD
    const variance =
      n > 1
        ? values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n - 1)
        : 0;
    const sd = Math.sqrt(variance);
    const cv = mean > 0 ? (sd / mean) * 100 : 0;

    const passCount = filteredRecords.filter((r) => r.status === 'PASS').length;
    const warningCount = filteredRecords.filter((r) => r.status === 'WARNING').length;
    const rejectCount = filteredRecords.filter((r) => r.status === 'REJECT').length;

    return {
      mean: Number(mean.toFixed(2)),
      sd: Number(sd.toFixed(2)),
      cv: Number(cv.toFixed(2)),
      n,
      passCount,
      warningCount,
      rejectCount,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }, [filteredRecords]);

  // Target values (fallback to actual mean/sd if target missing)
  const targetMean = target ? target.mean : actualStats.mean || 100;
  const targetSd = target && target.sd > 0 ? target.sd : actualStats.sd || 2.5;
  const targetCv = target ? target.cv : actualStats.cv || 2.5;

  // Chart Geometry & Scales - generous margins so numbers are never clipped
  const svgWidth = 980;
  const svgHeight = 460;
  const margin = { top: 35, right: 145, bottom: 65, left: 75 };
  const innerWidth = svgWidth - margin.left - margin.right;
  const innerHeight = svgHeight - margin.top - margin.bottom;

  // Y Scale based on Target +/- 3.5 SD
  const yMin = Number((targetMean - 3.8 * targetSd).toFixed(2));
  const yMax = Number((targetMean + 3.8 * targetSd).toFixed(2));
  const yRange = yMax - yMin;

  const getYCoord = (val: number) => {
    if (yRange <= 0) return innerHeight / 2;
    const ratio = (val - yMin) / yRange;
    return innerHeight - ratio * innerHeight;
  };

  const getXCoord = (index: number, total: number) => {
    if (total <= 1) return innerWidth / 2;
    return (index / (total - 1)) * innerWidth;
  };

  // SD Lines Values
  const linePlus3SD = targetMean + 3 * targetSd;
  const linePlus2SD = targetMean + 2 * targetSd;
  const linePlus1SD = targetMean + 1 * targetSd;
  const lineMean = targetMean;
  const lineMin1SD = targetMean - 1 * targetSd;
  const lineMin2SD = targetMean - 2 * targetSd;
  const lineMin3SD = targetMean - 3 * targetSd;

  const [isPrintPreview, setIsPrintPreview] = useState(false);

  // Print Action
  const handlePrint = () => {
    setIsPrintPreview(true);
  };

  const handleDownloadImage = () => {
    const svgElement = document.getElementById('levey-jennings-svg');
    if (!svgElement) return;

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = svgWidth;
      canvas.height = svgHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0);

        const png = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = png;
        downloadLink.download = `Levey-Jennings-${selectedInstrument}-${selectedParameter}-${selectedLevel}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };
    image.src = blobURL;
  };

  return (
    <div className="space-y-6">
      {/* Print-only Official Laboratory Header */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Pemerintah Kabupaten Kayong Utara
            </div>
            <h1 className="text-base font-black uppercase text-slate-900">
              RSUD SULTAN MUHAMMAD JAMALUDIN I
            </h1>
            <p className="text-xs font-bold text-teal-800">
              INSTALASI LABORATORIUM PATOLOGI KLINIK - GRAFIK LEVEY-JENNINGS
            </p>
          </div>
          <div className="text-right text-[10px] text-slate-700 space-y-0.5">
            <div>Tanggal Cetak: <strong className="font-mono">{new Date().toLocaleDateString('id-ID')}</strong></div>
            <div>Alat: <strong>{selectedInstrument}</strong></div>
            <div>Parameter: <strong>{selectedParameter} ({selectedLevel})</strong></div>
          </div>
        </div>
      </div>

      {/* Top Banner and Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Grafik Levey-Jennings
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Pemantauan visual presisi, akurasi, dan deteksi tren/shift analitis laboratorium
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadImage}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Unduh PNG</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4 text-teal-600" />
            <span>Cetak Grafik</span>
          </button>
        </div>
      </div>

      {/* Filter Selection Panel */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Instrument Filter */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pilih Alat</label>
            <select
              value={selectedInstrument}
              onChange={(e) => {
                setSelectedInstrument(e.target.value);
                const firstParam = parameters.find(
                  (p) => p.instrumentName === e.target.value
                );
                if (firstParam) setSelectedParameter(firstParam.name);
              }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-teal-500"
            >
              {instruments.map((i) => (
                <option key={i.id} value={i.name}>
                  {i.name} ({i.brand})
                </option>
              ))}
            </select>
          </div>

          {/* Parameter Filter */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Parameter Uji</label>
            <select
              value={selectedParameter}
              onChange={(e) => setSelectedParameter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-teal-500"
            >
              {availableParams.length > 0 ? (
                availableParams.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} ({p.unit})
                  </option>
                ))
              ) : (
                <option value={selectedParameter}>{selectedParameter}</option>
              )}
            </select>
          </div>

          {/* Control Level Filter */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Level Kontrol</label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="Level 1">Level 1 (Normal)</option>
              <option value="Level 2">Level 2 (Abnormal High)</option>
              <option value="Level 3">Level 3 (Abnormal Low)</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Rentang Periode</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="30d">30 Hari Terakhir</option>
              <option value="this_month">Bulan Ini</option>
              <option value="all">Semua Riwayat</option>
            </select>
          </div>
        </div>
      </div>

      {/* Target vs Actual Statistical KPI Card */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Target Mean vs Actual Mean */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
            Mean (X̄ Target / Aktual)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-bold text-slate-900 font-mono">{targetMean}</span>
            <span className="text-xs text-slate-500 font-mono">/ {actualStats.mean}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Bias: {(actualStats.mean - targetMean).toFixed(2)}
          </p>
        </div>

        {/* Target SD vs Actual SD */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
            SD (Target / Aktual)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-bold text-slate-900 font-mono">±{targetSd}</span>
            <span className="text-xs text-slate-500 font-mono">/ ±{actualStats.sd}</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Standar Deviasi</p>
        </div>

        {/* Target CV% vs Actual CV% */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
            CV% (Target / Aktual)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-bold text-slate-900 font-mono">{targetCv}%</span>
            <span className="text-xs text-slate-500 font-mono">/ {actualStats.cv}%</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Impresisi Relatif</p>
        </div>

        {/* Total Runs (N) */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
            Jumlah Data (N)
          </span>
          <div className="text-xl font-bold text-slate-900 font-mono mt-1">
            {actualStats.n} <span className="text-xs text-slate-400 font-normal">titik</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Total pemeriksaan</p>
        </div>

        {/* Warning Count */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-600 block uppercase tracking-wider">
            Warning (1-2s)
          </span>
          <div className="text-xl font-bold text-amber-700 font-mono mt-1">
            {actualStats.warningCount}
          </div>
          <p className="text-[10px] text-amber-600/70 mt-1">Peringatan</p>
        </div>

        {/* Reject Count */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-rose-600 block uppercase tracking-wider">
            Reject
          </span>
          <div className="text-xl font-bold text-rose-700 font-mono mt-1">
            {actualStats.rejectCount}
          </div>
          <p className="text-[10px] text-rose-600/70 mt-1">Pelanggaran kritis</p>
        </div>
      </div>

      {/* Main Levey-Jennings SVG Chart Container */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Chart Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                {selectedParameter} — {selectedInstrument}
              </h3>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                {selectedLevel} {target?.lotNumber ? `· Lot ${target.lotNumber}` : ''}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Satuan: {filteredRecords[0]?.unit || 'mg/dL'} · Klik salah satu titik untuk memeriksa
              analisis Westgard lengkap.
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 inline-block"></span>
              <span className="text-slate-600">Pass (Normal)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-amber-200 inline-block"></span>
              <span className="text-slate-600">Warning (1-2s)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200 inline-block"></span>
              <span className="text-slate-600">Reject (Westgard)</span>
            </span>
          </div>
        </div>

        {/* SVG Canvas */}
        {filteredRecords.length === 0 ? (
          <div className="py-24 text-center text-slate-400">
            <Info className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Tidak Ada Data QC</p>
            <p className="text-xs">
              Belum ada data pemeriksaan untuk alat, parameter, dan level ini dalam rentang tanggal
              yang dipilih.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[760px] relative">
              <svg
                id="levey-jennings-svg"
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-auto select-none font-sans"
              >
                <g transform={`translate(${margin.left}, ${margin.top})`}>
                  {/* Background Zones */}
                  {/* Zone +2SD to +3SD (Reject zone top) */}
                  <rect
                    x={0}
                    y={getYCoord(linePlus3SD)}
                    width={innerWidth}
                    height={getYCoord(linePlus2SD) - getYCoord(linePlus3SD)}
                    fill="#ffe4e6"
                    opacity={0.4}
                  />
                  {/* Zone +1SD to +2SD (Warning zone top) */}
                  <rect
                    x={0}
                    y={getYCoord(linePlus2SD)}
                    width={innerWidth}
                    height={getYCoord(linePlus1SD) - getYCoord(linePlus2SD)}
                    fill="#fef3c7"
                    opacity={0.4}
                  />
                  {/* Zone -1SD to +1SD (Normal safe zone) */}
                  <rect
                    x={0}
                    y={getYCoord(linePlus1SD)}
                    width={innerWidth}
                    height={getYCoord(lineMin1SD) - getYCoord(linePlus1SD)}
                    fill="#ecfdf5"
                    opacity={0.5}
                  />
                  {/* Zone -2SD to -1SD (Warning zone bottom) */}
                  <rect
                    x={0}
                    y={getYCoord(lineMin1SD)}
                    width={innerWidth}
                    height={getYCoord(lineMin2SD) - getYCoord(lineMin1SD)}
                    fill="#fef3c7"
                    opacity={0.4}
                  />
                  {/* Zone -3SD to -2SD (Reject zone bottom) */}
                  <rect
                    x={0}
                    y={getYCoord(lineMin2SD)}
                    width={innerWidth}
                    height={getYCoord(lineMin3SD) - getYCoord(lineMin2SD)}
                    fill="#ffe4e6"
                    opacity={0.4}
                  />

                  {/* Horizontal Guideline: +3SD (Red Dashed) */}
                  <line
                    x1={0}
                    y1={getYCoord(linePlus3SD)}
                    x2={innerWidth}
                    y2={getYCoord(linePlus3SD)}
                    stroke="#e11d48"
                    strokeWidth={1.5}
                    strokeDasharray="5,4"
                  />
                  <text
                    x={innerWidth + 8}
                    y={getYCoord(linePlus3SD) + 4}
                    fill="#e11d48"
                    fontSize={11}
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    +3SD ({linePlus3SD.toFixed(1)})
                  </text>

                  {/* Horizontal Guideline: +2SD (Amber Dashed) */}
                  <line
                    x1={0}
                    y1={getYCoord(linePlus2SD)}
                    x2={innerWidth}
                    y2={getYCoord(linePlus2SD)}
                    stroke="#d97706"
                    strokeWidth={1.2}
                    strokeDasharray="4,4"
                  />
                  <text
                    x={innerWidth + 8}
                    y={getYCoord(linePlus2SD) + 4}
                    fill="#d97706"
                    fontSize={11}
                    fontWeight="semibold"
                    fontFamily="monospace"
                  >
                    +2SD ({linePlus2SD.toFixed(1)})
                  </text>

                  {/* Horizontal Guideline: +1SD (Slate Dotted) */}
                  <line
                    x1={0}
                    y1={getYCoord(linePlus1SD)}
                    x2={innerWidth}
                    y2={getYCoord(linePlus1SD)}
                    stroke="#cbd5e1"
                    strokeWidth={1}
                    strokeDasharray="2,2"
                  />
                  <text
                    x={innerWidth + 8}
                    y={getYCoord(linePlus1SD) + 4}
                    fill="#64748b"
                    fontSize={10}
                    fontFamily="monospace"
                  >
                    +1SD ({linePlus1SD.toFixed(1)})
                  </text>

                  {/* Horizontal Guideline: Mean (Solid Teal) */}
                  <line
                    x1={0}
                    y1={getYCoord(lineMean)}
                    x2={innerWidth}
                    y2={getYCoord(lineMean)}
                    stroke="#0d9488"
                    strokeWidth={2}
                  />
                  <text
                    x={innerWidth + 8}
                    y={getYCoord(lineMean) + 4}
                    fill="#0d9488"
                    fontSize={11}
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    X̄ ({lineMean.toFixed(1)})
                  </text>

                  {/* Horizontal Guideline: -1SD (Slate Dotted) */}
                  <line
                    x1={0}
                    y1={getYCoord(lineMin1SD)}
                    x2={innerWidth}
                    y2={getYCoord(lineMin1SD)}
                    stroke="#cbd5e1"
                    strokeWidth={1}
                    strokeDasharray="2,2"
                  />
                  <text
                    x={innerWidth + 8}
                    y={getYCoord(lineMin1SD) + 4}
                    fill="#64748b"
                    fontSize={10}
                    fontFamily="monospace"
                  >
                    -1SD ({lineMin1SD.toFixed(1)})
                  </text>

                  {/* Horizontal Guideline: -2SD (Amber Dashed) */}
                  <line
                    x1={0}
                    y1={getYCoord(lineMin2SD)}
                    x2={innerWidth}
                    y2={getYCoord(lineMin2SD)}
                    stroke="#d97706"
                    strokeWidth={1.2}
                    strokeDasharray="4,4"
                  />
                  <text
                    x={innerWidth + 8}
                    y={getYCoord(lineMin2SD) + 4}
                    fill="#d97706"
                    fontSize={11}
                    fontWeight="semibold"
                    fontFamily="monospace"
                  >
                    -2SD ({lineMin2SD.toFixed(1)})
                  </text>

                  {/* Horizontal Guideline: -3SD (Red Dashed) */}
                  <line
                    x1={0}
                    y1={getYCoord(lineMin3SD)}
                    x2={innerWidth}
                    y2={getYCoord(lineMin3SD)}
                    stroke="#e11d48"
                    strokeWidth={1.5}
                    strokeDasharray="5,4"
                  />
                  <text
                    x={innerWidth + 8}
                    y={getYCoord(lineMin3SD) + 4}
                    fill="#e11d48"
                    fontSize={11}
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    -3SD ({lineMin3SD.toFixed(1)})
                  </text>

                  {/* Connecting Line Between Sequential Points */}
                  <polyline
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={filteredRecords
                      .map((r, i) => `${getXCoord(i, filteredRecords.length)},${getYCoord(r.resultValue)}`)
                      .join(' ')}
                  />

                  {/* Plotted Data Points */}
                  {filteredRecords.map((r, i) => {
                    const cx = getXCoord(i, filteredRecords.length);
                    const cy = getYCoord(r.resultValue);
                    const isHovered = hoveredRecord?.id === r.id;

                    let pointColor = '#10b981'; // Green
                    let ringColor = '#a7f3d0';

                    if (r.status === 'REJECT') {
                      pointColor = '#f43f5e'; // Red
                      ringColor = '#fecdd3';
                    } else if (r.status === 'WARNING') {
                      pointColor = '#f59e0b'; // Amber
                      ringColor = '#fde68a';
                    }

                    return (
                      <g
                        key={r.id}
                        className="cursor-pointer transition-transform"
                        onMouseEnter={() => setHoveredRecord(r)}
                        onMouseLeave={() => setHoveredRecord(null)}
                        onClick={() => setInspectedRecord(r)}
                      >
                        {/* Outer glow ring on hover */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isHovered ? 11 : 7}
                          fill={ringColor}
                          opacity={isHovered ? 0.9 : 0.6}
                          className="transition-all"
                        />
                        {/* Core point */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isHovered ? 6 : 4.5}
                          fill={pointColor}
                          stroke="#ffffff"
                          strokeWidth={2}
                        />

                        {/* X-Axis Tick Label (Date) */}
                        <text
                          x={cx}
                          y={innerHeight + 20}
                          textAnchor="middle"
                          fill="#64748b"
                          fontSize={10}
                          transform={`rotate(-40, ${cx}, ${innerHeight + 20})`}
                          fontFamily="monospace"
                        >
                          {r.date.slice(5)}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>

              {/* Hover Floating Tooltip */}
              {hoveredRecord && (
                <div className="absolute top-2 left-2 bg-slate-900/90 text-white p-2.5 rounded-lg shadow-xl text-xs pointer-events-none z-20 backdrop-blur-xs max-w-xs animate-in fade-in duration-100">
                  <div className="flex items-center justify-between gap-4 font-bold border-b border-slate-700 pb-1 mb-1">
                    <span>{hoveredRecord.date} {hoveredRecord.time}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        hoveredRecord.status === 'REJECT'
                          ? 'bg-rose-500 text-white'
                          : hoveredRecord.status === 'WARNING'
                          ? 'bg-amber-400 text-slate-900'
                          : 'bg-emerald-500 text-white'
                      }`}
                    >
                      {hoveredRecord.status}
                    </span>
                  </div>
                  <div className="space-y-0.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Hasil QC:</span>
                      <span className="font-mono font-bold text-white">
                        {hoveredRecord.resultValue} {hoveredRecord.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Z-Score:</span>
                      <span className="font-mono font-bold text-teal-300">
                        {hoveredRecord.zScore > 0 ? `+${hoveredRecord.zScore}` : hoveredRecord.zScore} SD
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Petugas:</span>
                      <span className="text-slate-200">{hoveredRecord.officerName}</span>
                    </div>
                    {hoveredRecord.violationRules && (
                      <div className="text-rose-300 text-[10px] pt-1">
                        Aturan: {hoveredRecord.violationRules.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Point Detail / Inspection Modal */}
      {inspectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div
              className={`p-4 text-white flex items-center justify-between ${
                inspectedRecord.status === 'REJECT'
                  ? 'bg-rose-600'
                  : inspectedRecord.status === 'WARNING'
                  ? 'bg-amber-500'
                  : 'bg-teal-600'
              }`}
            >
              <div className="flex items-center gap-2">
                {inspectedRecord.status === 'REJECT' ? (
                  <XCircle className="w-5 h-5 text-white" />
                ) : inspectedRecord.status === 'WARNING' ? (
                  <AlertTriangle className="w-5 h-5 text-white" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                )}
                <div>
                  <h3 className="text-sm font-bold">Detail Titik Pemeriksaan QC</h3>
                  <p className="text-[11px] text-white/90">
                    Status:{' '}
                    <strong>
                      {inspectedRecord.status} ({inspectedRecord.zScore > 0 ? `+${inspectedRecord.zScore}` : inspectedRecord.zScore} SD)
                    </strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectedRecord(null)}
                className="text-white hover:text-white/80 text-xl font-bold leading-none p-1"
              >
                &times;
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal & Waktu:</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {inspectedRecord.date} {inspectedRecord.time}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Alat:</span>
                  <span className="text-slate-800 font-medium">{inspectedRecord.instrumentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Parameter:</span>
                  <span className="font-bold text-slate-900">{inspectedRecord.parameterName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Level & Lot:</span>
                  <span className="text-slate-800 font-mono">
                    {inspectedRecord.level} · Lot: {inspectedRecord.lotNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Petugas Ahli Teknologi Laboratorium Medik (ATLM):</span>
                  <span className="text-slate-800">{inspectedRecord.officerName}</span>
                </div>
              </div>

              {/* Numerical Analysis */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block font-medium">Hasil Aktual</span>
                  <span className="font-bold font-mono text-slate-900 text-sm">
                    {inspectedRecord.resultValue} {inspectedRecord.unit}
                  </span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block font-medium">Target Mean</span>
                  <span className="font-bold font-mono text-slate-700 text-sm">
                    {inspectedRecord.targetMean}
                  </span>
                </div>
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block font-medium">Deviasi SD</span>
                  <span
                    className={`font-bold font-mono text-sm ${
                      inspectedRecord.status === 'REJECT'
                        ? 'text-rose-600'
                        : inspectedRecord.status === 'WARNING'
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {inspectedRecord.zScore > 0 ? `+${inspectedRecord.zScore}` : inspectedRecord.zScore} SD
                  </span>
                </div>
              </div>

              {/* Westgard violations info */}
              {inspectedRecord.violationRules && inspectedRecord.violationRules.length > 0 ? (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-rose-900 text-xs">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Pelanggaran Aturan: {inspectedRecord.violationRules.join(', ')}</span>
                  </div>
                  <p className="text-[11px] text-rose-800 leading-relaxed">
                    {inspectedRecord.notes || inspectedRecord.violationDetails}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Pemeriksaan valid dan sesuai standar kendali mutu laboratorium.</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInspectedRecord(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                >
                  Tutup
                </button>

                {inspectedRecord.status !== 'PASS' && (
                  <button
                    type="button"
                    onClick={() => {
                      const rec = inspectedRecord;
                      setInspectedRecord(null);
                      onNavigateToCAPAWithData({
                        problemSource: 'Grafik Levey-Jennings',
                        instrumentName: rec.instrumentName,
                        parameterName: rec.parameterName,
                        violationType: rec.violationRules ? rec.violationRules.join(', ') : 'Hasil QC Deviasi',
                        qcRecordId: rec.id,
                        problemDescription: `Titik QC tanggal ${rec.date} ${rec.time} pada parameter ${rec.parameterName} (${rec.level}) menghasilkan Z-score ${rec.zScore} SD.`,
                      });
                    }}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
                  >
                    <span>Buat CAPA Terkait</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Print-only Signature Block */}
      <div className="hidden print:grid grid-cols-2 gap-8 pt-12 text-xs text-slate-900">
        <div className="text-center space-y-16">
          <p className="font-semibold">Analis Pemeriksa / ATLM</p>
          <div className="font-bold underline">Staf Laboratorium</div>
        </div>
        <div className="text-center space-y-16">
          <p className="font-semibold">Penanggung Jawab Laboratorium</p>
          <div className="font-bold underline">dr. Maya Andriani, Sp.PK</div>
          <div className="text-[10px] text-slate-600">NIP. 198407222010122001</div>
        </div>
      </div>

      {/* Print Preview Modal */}
      {isPrintPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">Pratinjau Cetak Grafik Levey-Jennings</h3>
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
                {/* Kop Surat */}
                <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Pemerintah Kabupaten Kayong Utara
                    </div>
                    <h1 className="text-sm font-black uppercase text-slate-900">
                      RSUD SULTAN MUHAMMAD JAMALUDIN I
                    </h1>
                    <p className="text-xs font-bold text-teal-800">
                      INSTALASI LABORATORIUM PATOLOGI KLINIK - QC LEVEY-JENNINGS
                    </p>
                  </div>
                  <div className="text-right text-[10px] text-slate-700">
                    <div>Tanggal: <strong className="font-mono">{new Date().toLocaleDateString('id-ID')}</strong></div>
                    <div>Alat: <strong>{selectedInstrument}</strong></div>
                    <div>Parameter: <strong>{selectedParameter} ({selectedLevel})</strong></div>
                  </div>
                </div>

                {/* Summary Info */}
                <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-lg border text-center font-mono">
                  <div>
                    <div className="text-[10px] text-slate-500">Target Mean</div>
                    <div className="font-bold text-slate-900">{targetMean}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Target SD</div>
                    <div className="font-bold text-slate-900">±{targetSd}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">CV%</div>
                    <div className="font-bold text-teal-700">{targetCv}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Total N</div>
                    <div className="font-bold text-slate-900">{actualStats.n}</div>
                  </div>
                </div>

                {/* Signature Block */}
                <div className="grid grid-cols-2 gap-8 pt-8 text-xs text-slate-900">
                  <div className="text-center space-y-12">
                    <p className="font-semibold">Analis Pemeriksa / ATLM</p>
                    <div className="font-bold underline">Staf Laboratorium</div>
                  </div>
                  <div className="text-center space-y-12">
                    <p className="font-semibold">Penanggung Jawab Laboratorium</p>
                    <div className="font-bold underline">dr. Maya Andriani, Sp.PK</div>
                    <div className="text-[10px] text-slate-600">NIP. 198407222010122001</div>
                  </div>
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
                onClick={handleDownloadImage}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Gambar (PNG)</span>
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
