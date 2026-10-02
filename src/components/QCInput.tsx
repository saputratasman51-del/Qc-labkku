import React, { useState, useMemo, useEffect } from 'react';
import {
  PlusCircle,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  TrendingUp,
  History,
  Info,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  ControlMaterial,
  Instrument,
  Parameter,
  QCRecord,
  QCTarget,
  User,
  WestgardViolation,
} from '../types/index.ts';
import { calculateZScore, evaluateWestgardRules } from '../services/westgardEngine.ts';
import { storage } from '../services/storage.ts';

interface QCInputProps {
  currentUser: User;
  instruments: Instrument[];
  parameters: Parameter[];
  controlMaterials: ControlMaterial[];
  qcTargets: QCTarget[];
  qcRecords: QCRecord[];
  onRecordAdded: (newRecord: QCRecord, violations: WestgardViolation[]) => void;
  onRecordUpdated: (updatedRecord: QCRecord) => void;
  onRecordDeleted: (id: string) => void;
  onNavigateToLJ: (instrumentName: string, parameterName: string, level: string) => void;
  onNavigateToCAPAWithData: (data: any) => void;
}

export const QCInput: React.FC<QCInputProps> = ({
  currentUser,
  instruments,
  parameters,
  controlMaterials,
  qcTargets,
  qcRecords,
  onRecordAdded,
  onRecordUpdated,
  onRecordDeleted,
  onNavigateToLJ,
  onNavigateToCAPAWithData,
}) => {
  // Form State
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [officerName, setOfficerName] = useState(currentUser.name);
  const [instrumentId, setInstrumentId] = useState(instruments[0]?.id || '');
  const [parameterId, setParameterId] = useState('');
  const [level, setLevel] = useState<'Level 1' | 'Level 2' | 'Level 3'>('Level 1');
  const [lotNumber, setLotNumber] = useState('');
  const [resultValue, setResultValue] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Post-submit modal notification state
  const [submittedAlert, setSubmittedAlert] = useState<{
    record: QCRecord;
    violations: WestgardViolation[];
  } | null>(null);

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState<QCRecord | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [editReason, setEditReason] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  // Table Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterInstrument, setFilterInstrument] = useState<string>('All');

  // Update officer name if current user changes
  useEffect(() => {
    setOfficerName(currentUser.name);
  }, [currentUser]);

  // Parameters filtered by selected instrument
  const availableParameters = useMemo(() => {
    return parameters.filter((p) => p.instrumentId === instrumentId);
  }, [parameters, instrumentId]);

  // Set default parameter if current is invalid
  useEffect(() => {
    if (availableParameters.length > 0) {
      if (!availableParameters.some((p) => p.id === parameterId)) {
        setParameterId(availableParameters[0].id);
      }
    } else {
      setParameterId('');
    }
  }, [availableParameters, parameterId]);

  // Matched target configuration from master data
  const currentTarget = useMemo(() => {
    if (!instrumentId || !parameterId) return null;
    return qcTargets.find(
      (t) =>
        t.instrumentId === instrumentId &&
        t.parameterId === parameterId &&
        t.level === level
    );
  }, [qcTargets, instrumentId, parameterId, level]);

  // Auto-fill lot number when target or control changes
  useEffect(() => {
    if (currentTarget?.lotNumber) {
      setLotNumber(currentTarget.lotNumber);
    } else {
      const matchedCtrl = controlMaterials.find((c) => c.level === level && c.status === 'Aktif');
      if (matchedCtrl) {
        setLotNumber(matchedCtrl.lotNumber);
      }
    }
  }, [currentTarget, level, controlMaterials]);

  // Active parameter object
  const selectedParameter = useMemo(
    () => parameters.find((p) => p.id === parameterId),
    [parameters, parameterId]
  );
  const selectedInstrument = useMemo(
    () => instruments.find((i) => i.id === instrumentId),
    [instruments, instrumentId]
  );

  // Live real-time calculations
  const liveCalc = useMemo(() => {
    const val = parseFloat(resultValue);
    if (isNaN(val) || !currentTarget || currentTarget.sd <= 0) {
      return null;
    }
    const z = calculateZScore(val, currentTarget.mean, currentTarget.sd);
    let status: 'PASS' | 'WARNING' | 'REJECT' = 'PASS';
    if (Math.abs(z) > 3.0) status = 'REJECT';
    else if (Math.abs(z) > 2.0) status = 'WARNING';

    // Position percentage on -4SD to +4SD scale
    // -4SD = 0%, 0 = 50%, +4SD = 100%
    const clampedZ = Math.max(-4, Math.min(4, z));
    const positionPct = ((clampedZ + 4) / 8) * 100;

    return {
      zScore: z,
      status,
      positionPct,
      mean: currentTarget.mean,
      sd: currentTarget.sd,
      cv: currentTarget.cv,
      diff: val - currentTarget.mean,
      min2SD: (currentTarget.mean - 2 * currentTarget.sd).toFixed(2),
      plus2SD: (currentTarget.mean + 2 * currentTarget.sd).toFixed(2),
      min3SD: (currentTarget.mean - 3 * currentTarget.sd).toFixed(2),
      plus3SD: (currentTarget.mean + 3 * currentTarget.sd).toFixed(2),
    };
  }, [resultValue, currentTarget]);

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedInstrument || !selectedParameter) {
      alert('Pilih alat dan parameter yang valid.');
      return;
    }

    if (!currentTarget) {
      alert(
        `Target QC belum ditentukan untuk alat "${selectedInstrument.name}", parameter "${selectedParameter.name}", dan level "${level}". Harap atur nilai target di Master Data terlebih dahulu.`
      );
      return;
    }

    const numericVal = parseFloat(resultValue);
    if (isNaN(numericVal)) {
      alert('Masukkan nilai hasil QC yang valid dalam bentuk angka.');
      return;
    }

    // Retrieve historical records for this specific parameter, instrument, and level
    const history = qcRecords.filter(
      (r) =>
        r.instrumentName === selectedInstrument.name &&
        r.parameterName === selectedParameter.name &&
        r.level === level
    );

    const recordId = `QC-${Date.now()}`;
    const activeRules = storage.getWestgardRules();

    // Evaluate Westgard Rules
    const evaluation = evaluateWestgardRules(
      {
        id: recordId,
        date,
        time,
        instrumentName: selectedInstrument.name,
        parameterName: selectedParameter.name,
        level,
        lotNumber: lotNumber || currentTarget.lotNumber,
        resultValue: numericVal,
        targetMean: currentTarget.mean,
        targetSd: currentTarget.sd,
      },
      history,
      activeRules
    );

    const newRecord: QCRecord = {
      id: recordId,
      date,
      time,
      officerId: currentUser.id,
      officerName,
      instrumentId: selectedInstrument.id,
      instrumentName: selectedInstrument.name,
      parameterId: selectedParameter.id,
      parameterName: selectedParameter.name,
      unit: selectedParameter.unit,
      level,
      lotNumber: lotNumber || currentTarget.lotNumber,
      resultValue: numericVal,
      targetMean: currentTarget.mean,
      targetSd: currentTarget.sd,
      targetCv: currentTarget.cv,
      zScore: evaluation.zScore,
      status: evaluation.status,
      notes: notes.trim() || (evaluation.status === 'PASS' ? 'Normal run' : evaluation.notesSummary),
      violationRules: evaluation.ruleIds.length > 0 ? evaluation.ruleIds : undefined,
      violationDetails: evaluation.violations.length > 0 ? evaluation.notesSummary : undefined,
      createdAt: new Date().toISOString(),
    };

    onRecordAdded(newRecord, evaluation.violations);

    // If violation or warning/reject, show alert modal
    if (evaluation.violations.length > 0 || evaluation.status !== 'PASS') {
      setSubmittedAlert({
        record: newRecord,
        violations: evaluation.violations,
      });
    }

    // Reset result input
    setResultValue('');
    setNotes('');
  };

  // Handle Edit submission with audit trail
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    const newNum = parseFloat(editValue);
    if (isNaN(newNum)) {
      alert('Masukkan angka yang valid.');
      return;
    }

    if (!editReason.trim()) {
      alert('Alasan perubahan wajib diisi untuk kepatuhan audit trail.');
      return;
    }

    const newZ = calculateZScore(newNum, editingRecord.targetMean, editingRecord.targetSd);
    let newStatus: 'PASS' | 'WARNING' | 'REJECT' = 'PASS';
    if (Math.abs(newZ) > 3.0) newStatus = 'REJECT';
    else if (Math.abs(newZ) > 2.0) newStatus = 'WARNING';

    const auditTrail = editingRecord.auditTrail || [];
    auditTrail.push({
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      modifiedBy: currentUser.name,
      oldValue: editingRecord.resultValue,
      newValue: newNum,
      reason: editReason.trim(),
    });

    const updated: QCRecord = {
      ...editingRecord,
      resultValue: newNum,
      zScore: newZ,
      status: newStatus,
      notes: editNotes.trim() || editingRecord.notes,
      auditTrail,
    };

    onRecordUpdated(updated);
    setEditingRecord(null);
  };

  // Filtered History Records
  const filteredHistory = useMemo(() => {
    return qcRecords.filter((r) => {
      const matchSearch =
        r.parameterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.instrumentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.officerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.lotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.date.includes(searchTerm);

      const matchLevel = filterLevel === 'All' || r.level === filterLevel;
      const matchStatus = filterStatus === 'All' || r.status === filterStatus;
      const matchInstrument = filterInstrument === 'All' || r.instrumentName === filterInstrument;

      return matchSearch && matchLevel && matchStatus && matchInstrument;
    });
  }, [qcRecords, searchTerm, filterLevel, filterStatus, filterInstrument]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Input Hasil QC Harian
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Pencatatan pemeriksaan kontrol kualitas analitis dengan evaluasi Westgard otomatis
          </p>
        </div>
      </div>

      {/* Main Grid: Form on Left (or Top) and Live Calculation Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Container */}
        <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <PlusCircle className="w-5 h-5 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">Formulir Pemeriksaan QC</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Row 1: Tanggal & Jam & Petugas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tanggal <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jam Pemeriksaan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Petugas Pemeriksa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={officerName}
                  onChange={(e) => setOfficerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-slate-800"
                />
              </div>
            </div>

            {/* Row 2: Alat & Parameter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Alat / Instrumen <span className="text-rose-500">*</span>
                </label>
                <select
                  value={instrumentId}
                  onChange={(e) => setInstrumentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-slate-800 bg-white"
                >
                  {instruments.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.brand})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Parameter Pemeriksaan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={parameterId}
                  onChange={(e) => setParameterId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-slate-800 bg-white"
                >
                  {availableParameters.length === 0 ? (
                    <option value="">Tidak ada parameter untuk alat ini</option>
                  ) : (
                    availableParameters.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} [{p.code}] - ({p.unit})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {/* Row 3: Level Kontrol, Lot Kontrol, Hasil QC */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Level Kontrol <span className="text-rose-500">*</span>
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-slate-800 bg-white"
                >
                  <option value="Level 1">Level 1 (Normal)</option>
                  <option value="Level 2">Level 2 (Abnormal High)</option>
                  <option value="Level 3">Level 3 (Abnormal Low)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor Lot Kontrol <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value)}
                  placeholder="Contoh: BIO-2401"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Hasil QC {selectedParameter ? `(${selectedParameter.unit})` : ''}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="Ketik nilai angka..."
                  value={resultValue}
                  onChange={(e) => setResultValue(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-teal-500/80 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-slate-900 font-mono font-bold text-sm bg-teal-50/20"
                />
              </div>
            </div>

            {/* Row 4: Keterangan */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Keterangan / Catatan Kondisi Ahli Teknologi Laboratorium Medik (ATLM) (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Misal: Lot reagen baru dibuka, kuvet baru dicuci, kontrol dihangatkan 30 menit..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-slate-800"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Semua data tersimpan otomatis dan memperbarui grafik Levey-Jennings
              </span>
              <button
                type="submit"
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Hasil QC</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Calculation & Status Preview Container */}
        <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">Kalkulasi & Evaluasi Z-Score</h3>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                Otomatis
              </span>
            </div>

            {!currentTarget ? (
              <div className="p-6 text-center text-slate-500 space-y-2">
                <Info className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="font-semibold text-slate-800">Target Belum Ditemukan</p>
                <p className="text-xs">
                  Belum ada master target QC untuk kombinasi alat, parameter, dan level ini. Silakan
                  isi target Mean & SD di Master Data.
                </p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Master Target Summary */}
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Nilai Acuan Master ({level} · Lot: {currentTarget.lotNumber})
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white p-2 rounded border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 block font-medium">Target Mean (X̄)</span>
                      <span className="text-sm font-bold text-slate-900 font-mono">
                        {currentTarget.mean}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 block font-medium">Standar Deviasi (SD)</span>
                      <span className="text-sm font-bold text-slate-900 font-mono">
                        ±{currentTarget.sd}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded border border-slate-200/60">
                      <span className="text-[10px] text-slate-400 block font-medium">Koefisien Variasi</span>
                      <span className="text-sm font-bold text-slate-900 font-mono">
                        {currentTarget.cv}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Result & Z-Score Result */}
                {liveCalc ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-white">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Z-Score Terhitung</span>
                        <div className="text-2xl font-black font-mono tracking-tight flex items-baseline gap-1">
                          <span
                            className={
                              liveCalc.status === 'REJECT'
                                ? 'text-rose-600'
                                : liveCalc.status === 'WARNING'
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }
                          >
                            {liveCalc.zScore > 0 ? `+${liveCalc.zScore}` : liveCalc.zScore}
                          </span>
                          <span className="text-xs text-slate-500 font-sans font-medium">SD</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-medium">Status Awal</span>
                        {liveCalc.status === 'PASS' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            PASS
                          </span>
                        )}
                        {liveCalc.status === 'WARNING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            WARNING
                          </span>
                        )}
                        {liveCalc.status === 'REJECT' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                            <XCircle className="w-3.5 h-3.5" />
                            REJECT
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Levey-Jennings Visual Bar Range Indicator */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>-3SD ({liveCalc.min3SD})</span>
                        <span className="font-semibold text-slate-700">Mean ({liveCalc.mean})</span>
                        <span>+3SD ({liveCalc.plus3SD})</span>
                      </div>

                      {/* Visual scale bar */}
                      <div className="relative h-6 bg-slate-100 rounded-md overflow-hidden border border-slate-200">
                        {/* Zones */}
                        {/* -3SD to -2SD: Danger */}
                        <div className="absolute top-0 bottom-0 left-[12.5%] right-[87.5%] bg-rose-200/50" />
                        {/* -2SD to -1SD: Warning */}
                        <div className="absolute top-0 bottom-0 left-[25%] right-[75%] bg-amber-200/50" />
                        {/* -1SD to +1SD: Safe */}
                        <div className="absolute top-0 bottom-0 left-[37.5%] right-[37.5%] bg-emerald-200/60" />
                        {/* +1SD to +2SD: Warning */}
                        <div className="absolute top-0 bottom-0 left-[62.5%] right-[25%] bg-amber-200/50" />
                        {/* +2SD to +3SD: Danger */}
                        <div className="absolute top-0 bottom-0 left-[75%] right-[12.5%] bg-rose-200/50" />

                        {/* Center line (Mean) */}
                        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-400" />

                        {/* Current Result Marker */}
                        <div
                          style={{ left: `${liveCalc.positionPct}%` }}
                          className="absolute top-0 bottom-0 w-2.5 -ml-1.25 bg-slate-900 rounded-sm shadow-md transition-all flex items-center justify-center"
                          title={`Z: ${liveCalc.zScore} SD`}
                        >
                          <div className="w-0.5 h-3 bg-white" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>-2SD: {liveCalc.min2SD}</span>
                        <span>+2SD: {liveCalc.plus2SD}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-lg text-center text-slate-400">
                    Ketik angka pada kolom <strong>Hasil QC</strong> untuk melihat Z-Score dan posisi titik
                    pada grafik secara seketika.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            <p>
              💡 <em>Multi-rule Westgard (1-2s, 1-3s, 2-2s, R-4s, 4-1s, 10x) dievaluasi otomatis terhadap run historis sebelum disimpan.</em>
            </p>
          </div>
        </div>
      </div>

      {/* History Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Riwayat Input Pemeriksaan QC
              </h3>
              <p className="text-xs text-slate-500">
                Total tersimpan: {qcRecords.length} pemeriksaan · Data dapat dicari, difilter, dan diedit
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search Box */}
              <div className="relative min-w-52">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari parameter, alat, tanggal..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>

              {/* Filter Alat */}
              <select
                value={filterInstrument}
                onChange={(e) => setFilterInstrument(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white outline-none"
              >
                <option value="All">Semua Alat</option>
                {instruments.map((i) => (
                  <option key={i.id} value={i.name}>
                    {i.name}
                  </option>
                ))}
              </select>

              {/* Filter Level */}
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white outline-none"
              >
                <option value="All">Semua Level</option>
                <option value="Level 1">Level 1</option>
                <option value="Level 2">Level 2</option>
                <option value="Level 3">Level 3</option>
              </select>

              {/* Filter Status */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white outline-none"
              >
                <option value="All">Semua Status</option>
                <option value="PASS">PASS</option>
                <option value="WARNING">WARNING</option>
                <option value="REJECT">REJECT</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Tanggal & Jam</th>
                <th className="py-3 px-4">Alat</th>
                <th className="py-3 px-4">Parameter</th>
                <th className="py-3 px-4">Level & Lot</th>
                <th className="py-3 px-4 text-right">Hasil QC</th>
                <th className="py-3 px-4 text-right">Target (Mean±SD)</th>
                <th className="py-3 px-4 text-center">Z-Score</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Petugas & Catatan</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Tidak ditemukan data QC yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredHistory.slice(0, 50).map((r) => {
                  const zColor =
                    Math.abs(r.zScore) > 3
                      ? 'text-rose-700 bg-rose-50 font-bold'
                      : Math.abs(r.zScore) > 2
                      ? 'text-amber-700 bg-amber-50 font-bold'
                      : 'text-slate-700 bg-slate-50';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{r.date}</div>
                        <div className="text-[10px] text-slate-400">{r.time}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700 whitespace-nowrap">
                        {r.instrumentName}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-900">{r.parameterName}</span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-slate-700 font-medium">{r.level}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">Lot: {r.lotNumber}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {r.resultValue}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">{r.unit}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600 whitespace-nowrap text-[11px]">
                        {r.targetMean} (±{r.targetSd})
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded font-mono text-[11px] ${zColor}`}>
                          {r.zScore > 0 ? `+${r.zScore}` : r.zScore}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {r.status === 'PASS' && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            PASS
                          </span>
                        )}
                        {r.status === 'WARNING' && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                            WARNING
                          </span>
                        )}
                        {r.status === 'REJECT' && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                            REJECT
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-medium text-slate-700 truncate">{r.officerName}</div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {r.violationRules ? (
                            <span className="text-rose-600 font-medium">{r.violationRules.join(', ')}: </span>
                          ) : null}
                          {r.notes}
                        </div>
                        {r.auditTrail && r.auditTrail.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 mt-0.5 font-medium">
                            <History className="w-3 h-3" />
                            Diedit ({r.auditTrail.length}x)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onNavigateToLJ(r.instrumentName, r.parameterName, r.level)}
                            title="Buka Grafik Levey-Jennings"
                            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingRecord(r);
                              setEditValue(String(r.resultValue));
                              setEditReason('');
                              setEditNotes(r.notes || '');
                            }}
                            title="Edit Data QC (Pencatatan Audit)"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onRecordDeleted(r.id)}
                            title="Hapus Data"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Post-Submit Westgard Alert Modal */}
      {submittedAlert && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div
              className={`p-5 text-white ${
                submittedAlert.record.status === 'REJECT' ? 'bg-rose-600' : 'bg-amber-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-7 h-7 text-white" />
                <div>
                  <h3 className="text-lg font-bold">
                    {submittedAlert.record.status === 'REJECT'
                      ? 'PERINGATAN KRITIS: HASIL QC REJECT'
                      : 'PERINGATAN: HASIL QC WARNING (1-2s)'}
                  </h3>
                  <p className="text-xs text-white/90">
                    Sistem mendeteksi deviasi analitis pada pemeriksaan yang baru disimpan
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Parameter:</span>
                  <span className="font-bold text-slate-900">{submittedAlert.record.parameterName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Alat:</span>
                  <span className="font-semibold text-slate-800">{submittedAlert.record.instrumentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Level & Lot:</span>
                  <span className="text-slate-800 font-mono">
                    {submittedAlert.record.level} · {submittedAlert.record.lotNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hasil & Z-Score:</span>
                  <span className="font-bold font-mono text-rose-600">
                    {submittedAlert.record.resultValue} {submittedAlert.record.unit} (Z: {submittedAlert.record.zScore > 0 ? `+${submittedAlert.record.zScore}` : submittedAlert.record.zScore} SD)
                  </span>
                </div>
              </div>

              {/* Violations details */}
              <div className="space-y-2">
                <div className="font-bold text-slate-900">Aturan Westgard yang Terlanggar:</div>
                {submittedAlert.violations.length > 0 ? (
                  submittedAlert.violations.map((v) => (
                    <div key={v.id} className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                      <div className="font-bold text-rose-900 mb-0.5">{v.ruleName}</div>
                      <p className="text-[11px] text-rose-800 font-medium leading-relaxed">
                        SOP: {v.sopRecommendation}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                    Nilai melampaui batas 2SD. Periksa kondisi reagen dan instrumen.
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    const viol = submittedAlert.violations[0];
                    const rec = submittedAlert.record;
                    setSubmittedAlert(null);
                    onNavigateToCAPAWithData({
                      problemSource: viol ? `Pelanggaran Westgard (${viol.ruleName})` : 'Hasil QC Reject',
                      instrumentName: rec.instrumentName,
                      parameterName: rec.parameterName,
                      violationType: viol ? viol.ruleName : 'Hasil QC Melebihi Batas Toleransi',
                      violationId: viol?.id,
                      qcRecordId: rec.id,
                      problemDescription: `Ditemukan hasil QC ${rec.parameterName} (${rec.level}) sebesar ${rec.resultValue} ${rec.unit} dengan Z-Score ${rec.zScore} SD pada tanggal ${rec.date}.`,
                    });
                  }}
                  className="w-full sm:w-auto flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Buat Tindakan Korektif (CAPA)</span>
                </button>

                <button
                  onClick={() => {
                    const rec = submittedAlert.record;
                    setSubmittedAlert(null);
                    onNavigateToLJ(rec.instrumentName, rec.parameterName, rec.level);
                  }}
                  className="w-full sm:w-auto py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                >
                  Lihat Grafik LJ
                </button>

                <button
                  onClick={() => setSubmittedAlert(null)}
                  className="w-full sm:w-auto py-2.5 px-3 text-slate-500 hover:text-slate-800 font-medium rounded-lg"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit QC Modal with Audit Trail */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Koreksi Data QC (Audit Trail)</h3>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Parameter:</span>
                  <span className="font-semibold text-slate-800">{editingRecord.parameterName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Alat:</span>
                  <span className="text-slate-700">{editingRecord.instrumentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal:</span>
                  <span className="text-slate-700 font-mono">{editingRecord.date} {editingRecord.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nilai Lama:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {editingRecord.resultValue} {editingRecord.unit} (Z: {editingRecord.zScore})
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nilai Hasil QC Baru <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Alasan Koreksi Perubahan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Misal: Salah ketik desimal dari printout alat Cobas..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
