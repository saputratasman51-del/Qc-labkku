import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldAlert,
  PlusCircle,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  Printer,
  Edit2,
  Trash2,
  FileText,
  UserCheck,
  Building,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { CAPARecord, CAPAStatus, Instrument, Parameter, User } from '../types/index.ts';
import { APP_LOGO_SRC } from '../services/storage.ts';

interface CAPAViewProps {
  currentUser: User;
  capaRecords: CAPARecord[];
  instruments: Instrument[];
  parameters: Parameter[];
  onCapaSaved: (capa: CAPARecord) => void;
  onCapaUpdated: (capa: CAPARecord) => void;
  onCapaDeleted: (id: string) => void;
  prefillData?: Partial<CAPARecord> | null;
  onClearPrefill?: () => void;
}

export const CAPAView: React.FC<CAPAViewProps> = ({
  currentUser,
  capaRecords,
  instruments,
  parameters,
  onCapaSaved,
  onCapaUpdated,
  onCapaDeleted,
  prefillData,
  onClearPrefill,
}) => {
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCapa, setEditingCapa] = useState<CAPARecord | null>(null);

  // Print/Detail View Modal
  const [printCapa, setPrintCapa] = useState<CAPARecord | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Form Fields
  const [capaNumber, setCapaNumber] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [problemSource, setProblemSource] = useState('Pelanggaran Westgard');
  const [instrumentName, setInstrumentName] = useState(instruments[0]?.name || 'Cobas c311');
  const [parameterName, setParameterName] = useState(parameters[0]?.name || 'Glukosa Darah');
  const [violationType, setViolationType] = useState('Aturan 1-3s (Reject)');
  const [problemDescription, setProblemDescription] = useState('');
  const [rootCauseAnalysis, setRootCauseAnalysis] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [preventiveAction, setPreventiveAction] = useState('');
  const [pic, setPic] = useState(currentUser.name);
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [verificationResult, setVerificationResult] = useState('');
  const [status, setStatus] = useState<CAPAStatus>('Open');

  // Handle prefill data from Westgard or QC input
  useEffect(() => {
    if (prefillData) {
      setEditingCapa(null);
      setCapaNumber(`CAPA-2026-${String(capaRecords.length + 1).padStart(3, '0')}`);
      setDate(prefillData.date || new Date().toISOString().split('T')[0]);
      setProblemSource(prefillData.problemSource || 'Pelanggaran Westgard');
      setInstrumentName(prefillData.instrumentName || instruments[0]?.name || '');
      setParameterName(prefillData.parameterName || parameters[0]?.name || '');
      setViolationType(prefillData.violationType || 'Pelanggaran QC');
      setProblemDescription(prefillData.problemDescription || '');
      setRootCauseAnalysis(
        'Investigasi 4M (Man, Machine, Method, Material):\n- Material: Periksa kondisi vial kontrol & reagen.\n- Machine: Periksa suhu alat & kebersihan probe kuvet.'
      );
      setCorrectiveAction('Tahan hasil pasien. Ulangi kontrol dengan vial baru.');
      setPreventiveAction('Perketat pemantauan aliquot kontrol beku.');
      setPic(currentUser.name);
      setStatus('Open');
      setIsModalOpen(true);
      if (onClearPrefill) onClearPrefill();
    }
  }, [prefillData]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingCapa(null);
    setCapaNumber(`CAPA-2026-${String(capaRecords.length + 1).padStart(3, '0')}`);
    setDate(new Date().toISOString().split('T')[0]);
    setProblemSource('Pelanggaran Westgard');
    setInstrumentName(instruments[0]?.name || '');
    setParameterName(parameters[0]?.name || '');
    setViolationType('Pelanggaran 1-3s');
    setProblemDescription('');
    setRootCauseAnalysis('');
    setCorrectiveAction('');
    setPreventiveAction('');
    setPic(currentUser.name);
    const d = new Date();
    d.setDate(d.getDate() + 3);
    setTargetDate(d.toISOString().split('T')[0]);
    setVerificationResult('');
    setStatus('Open');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (capa: CAPARecord) => {
    setEditingCapa(capa);
    setCapaNumber(capa.capaNumber);
    setDate(capa.date);
    setProblemSource(capa.problemSource);
    setInstrumentName(capa.instrumentName);
    setParameterName(capa.parameterName);
    setViolationType(capa.violationType);
    setProblemDescription(capa.problemDescription);
    setRootCauseAnalysis(capa.rootCauseAnalysis);
    setCorrectiveAction(capa.correctiveAction);
    setPreventiveAction(capa.preventiveAction);
    setPic(capa.pic);
    setTargetDate(capa.targetDate);
    setVerificationResult(capa.verificationResult || '');
    setStatus(capa.status);
    setIsModalOpen(true);
  };

  // Save / Update CAPA
  const handleSaveCapa = (e: React.FormEvent) => {
    e.preventDefault();

    if (!problemDescription.trim() || !correctiveAction.trim()) {
      alert('Deskripsi masalah dan tindakan korektif wajib diisi.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const isOverdue = targetDate < todayStr && status !== 'Closed';

    if (editingCapa) {
      const updated: CAPARecord = {
        ...editingCapa,
        problemSource,
        instrumentName,
        parameterName,
        violationType,
        problemDescription,
        rootCauseAnalysis,
        correctiveAction,
        preventiveAction,
        pic,
        targetDate,
        verificationResult,
        status,
        isOverdue,
        verifiedBy: status === 'Closed' ? currentUser.name : editingCapa.verifiedBy,
        verifiedAt:
          status === 'Closed' && !editingCapa.verifiedAt
            ? new Date().toISOString().replace('T', ' ').slice(0, 16)
            : editingCapa.verifiedAt,
        updatedAt: new Date().toISOString(),
      };
      onCapaUpdated(updated);
    } else {
      const newCapa: CAPARecord = {
        id: `CAPA-${Date.now()}`,
        capaNumber,
        date,
        problemSource,
        instrumentName,
        parameterName,
        violationType,
        problemDescription,
        rootCauseAnalysis,
        correctiveAction,
        preventiveAction,
        pic,
        targetDate,
        verificationResult,
        status,
        isOverdue,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onCapaSaved(newCapa);
    }

    setIsModalOpen(false);
  };

  // Check Overdue Status for records
  const processedRecords = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return capaRecords.map((c) => ({
      ...c,
      isOverdue: c.targetDate < todayStr && c.status !== 'Closed',
    }));
  }, [capaRecords]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return processedRecords.filter((c) => {
      const matchSearch =
        c.capaNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.parameterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.instrumentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.pic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.problemDescription.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'All' || c.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [processedRecords, searchTerm, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = processedRecords.length;
    const openCount = processedRecords.filter((c) => c.status === 'Open').length;
    const inProgressCount = processedRecords.filter((c) => c.status === 'Dalam Proses').length;
    const waitingCount = processedRecords.filter((c) => c.status === 'Menunggu Verifikasi').length;
    const closedCount = processedRecords.filter((c) => c.status === 'Closed').length;
    const overdueCount = processedRecords.filter((c) => c.isOverdue).length;

    return { total, openCount, inProgressCount, waitingCount, closedCount, overdueCount };
  }, [processedRecords]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Tindakan Korektif & Pencegahan (CAPA)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Siklus manajemen mutu: Corrective and Preventive Action terintegrasi dengan hasil QC
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Buat CAPA Baru</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total CAPA */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Total Kasus
          </span>
          <div className="text-xl font-bold text-slate-900 mt-1">{stats.total}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Semua rekaman</p>
        </div>

        {/* Open */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider block">
            Open (Baru)
          </span>
          <div className="text-xl font-bold text-rose-700 mt-1">{stats.openCount}</div>
          <p className="text-[10px] text-rose-600/70 mt-0.5">Belum ditangani</p>
        </div>

        {/* Dalam Proses */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">
            Dalam Proses
          </span>
          <div className="text-xl font-bold text-amber-700 mt-1">{stats.inProgressCount}</div>
          <p className="text-[10px] text-amber-600/70 mt-0.5">Sedang investigasi</p>
        </div>

        {/* Menunggu Verifikasi */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider block">
            Verifikasi
          </span>
          <div className="text-xl font-bold text-blue-700 mt-1">{stats.waitingCount}</div>
          <p className="text-[10px] text-blue-600/70 mt-0.5">Menunggu Sp.PK</p>
        </div>

        {/* Closed */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
            Closed (Selesai)
          </span>
          <div className="text-xl font-bold text-emerald-700 mt-1">{stats.closedCount}</div>
          <p className="text-[10px] text-emerald-600/70 mt-0.5">Efektif & ditutup</p>
        </div>

        {/* Terlambat (Overdue) */}
        <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-xs bg-rose-50/20">
          <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block">
            Terlambat
          </span>
          <div className="text-xl font-bold text-rose-800 mt-1">{stats.overdueCount}</div>
          <p className="text-[10px] text-rose-600 mt-0.5">Melewati batas target</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nomor CAPA, masalah, PIC..."
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-slate-500 font-semibold hidden sm:inline">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white outline-none"
            >
              <option value="All">Semua Status</option>
              <option value="Open">Open</option>
              <option value="Dalam Proses">Dalam Proses</option>
              <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* CAPA Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Nomor CAPA</th>
                <th className="py-3 px-4">Tanggal Kejadian</th>
                <th className="py-3 px-4">Alat & Parameter</th>
                <th className="py-3 px-4">Sumber & Masalah</th>
                <th className="py-3 px-4">Penanggung Jawab (PIC)</th>
                <th className="py-3 px-4">Target Selesai</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ditemukan rekaman CAPA yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((capa) => {
                  return (
                    <tr key={capa.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-teal-700">{capa.capaNumber}</span>
                        {capa.isOverdue && (
                          <span className="block text-[9px] font-bold text-rose-600 uppercase">
                            Overdue
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                        {capa.date}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{capa.parameterName}</div>
                        <div className="text-[11px] text-slate-500">{capa.instrumentName}</div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-800 truncate" title={capa.violationType}>
                          {capa.problemSource}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1" title={capa.problemDescription}>
                          {capa.problemDescription}
                        </p>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-medium">
                        {capa.pic}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{capa.targetDate}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {capa.status === 'Open' && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                            Open
                          </span>
                        )}
                        {capa.status === 'Dalam Proses' && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                            Dalam Proses
                          </span>
                        )}
                        {capa.status === 'Menunggu Verifikasi' && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">
                            Verifikasi
                          </span>
                        )}
                        {capa.status === 'Closed' && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            Closed
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Cetak Formulir */}
                          <button
                            onClick={() => setPrintCapa(capa)}
                            title="Lihat / Cetak Dokumen CAPA"
                            className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEditModal(capa)}
                            title="Edit Rekaman CAPA"
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => onCapaDeleted(capa.id)}
                            title="Hapus CAPA"
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

      {/* Create / Edit CAPA Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-teal-50/50">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-teal-700" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingCapa ? 'Edit Formulir Tindakan Korektif (CAPA)' : 'Buat Formulir CAPA Baru'}
                  </h3>
                  <span className="text-[11px] text-teal-700 font-mono font-semibold">
                    {capaNumber}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveCapa} className="p-5 sm:p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              {/* Row 1: Nomor, Tanggal, Sumber Masalah */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor CAPA</label>
                  <input
                    type="text"
                    disabled
                    value={capaNumber}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Kejadian <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Sumber Masalah <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={problemSource}
                    onChange={(e) => setProblemSource(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Pelanggaran Westgard">Pelanggaran Westgard</option>
                    <option value="Hasil QC Reject">Hasil QC Reject</option>
                    <option value="Kalibrasi Gagal">Kalibrasi Gagal</option>
                    <option value="Reagen Rusak / Expired">Reagen Rusak / Expired</option>
                    <option value="Kerusakan Alat / Maintenance">Kerusakan Alat / Maintenance</option>
                    <option value="Penyimpangan Audit Eksternal">Penyimpangan Audit Eksternal</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Alat & Parameter & Jenis Pelanggaran */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nama Alat</label>
                  <select
                    value={instrumentName}
                    onChange={(e) => setInstrumentName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {instruments.map((i) => (
                      <option key={i.id} value={i.name}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Parameter Uji</label>
                  <input
                    type="text"
                    required
                    value={parameterName}
                    onChange={(e) => setParameterName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Pelanggaran</label>
                  <input
                    type="text"
                    required
                    value={violationType}
                    onChange={(e) => setViolationType(e.target.value)}
                    placeholder="Misal: Aturan 1-3s, 2-2s..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>

              {/* Deskripsi Masalah */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Deskripsi Masalah & Fakta Kejadian <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="Jelaskan secara lengkap temuan masalah, nilai hasil pemeriksaan QC, waktu kejadian, dan dampak terhadap hasil pasien..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              {/* Analisis Akar Masalah (Root Cause Analysis) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Analisis Akar Penyebab Masalah (Root Cause Analysis / 5-Whys / 4M) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={rootCauseAnalysis}
                  onChange={(e) => setRootCauseAnalysis(e.target.value)}
                  placeholder="Analisis penyebab utama: apakah faktor Man (Ahli Teknologi Laboratorium Medik (ATLM)), Machine (alat), Method (SOP), atau Material (reagen/kontrol)..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              {/* Tindakan Korektif (Corrective Action) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tindakan Korektif (Penanganan Segera / Corrective Action) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={correctiveAction}
                  onChange={(e) => setCorrectiveAction(e.target.value)}
                  placeholder="Langkah perbaikan langsung: ulangi kontrol vial baru, kalibrasi ulang, cuci probe, tahan hasil pasien..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              {/* Tindakan Pencegahan (Preventive Action) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tindakan Pencegahan (Preventive Action)
                </label>
                <textarea
                  rows={2}
                  value={preventiveAction}
                  onChange={(e) => setPreventiveAction(e.target.value)}
                  placeholder="Langkah agar tidak terulang: modifikasi SOP, pelatihan personel, jadwal maintenance lebih ketat..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              {/* PIC, Target Tanggal, Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Penanggung Jawab (PIC) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={pic}
                    onChange={(e) => setPic(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Target Tanggal Selesai <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Status CAPA <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  >
                    <option value="Open">Open</option>
                    <option value="Dalam Proses">Dalam Proses</option>
                    <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              {/* Hasil Verifikasi Efektivitas (Khusus Sp.PK / Status Closed) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Hasil Evaluasi Efektivitas Tindakan & Verifikasi (Sp.PK / Validator)
                </label>
                <textarea
                  rows={2}
                  value={verificationResult}
                  onChange={(e) => setVerificationResult(e.target.value)}
                  placeholder="Hasil evaluasi setelah tindakan: nilai QC kembali normal 3 hari berturut-turut, tidak ada deviasi berulang..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Simpan Formulir CAPA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Printable CAPA Document Modal */}
      {printCapa && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-slate-800 text-xs">
                Dokumen Resmi Formulir CAPA Mutu Laboratorium
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Dokumen</span>
                </button>
                <button
                  onClick={() => setPrintCapa(null)}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none p-1"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Official Form Document Body */}
            <div className="p-8 space-y-6 text-xs text-slate-800">
              {/* Header Kop */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={APP_LOGO_SRC}
                    alt="Logo Kabupaten Kayong Utara"
                    referrerPolicy="no-referrer"
                    className="h-16 w-16 object-contain shrink-0"
                  />
                  <div>
                    <div className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                      Pemerintah Kabupaten Kayong Utara
                    </div>
                    <div className="text-sm font-black text-slate-900 uppercase">
                      RSUD SULTAN MUHAMMAD JAMALUDIN I
                    </div>
                    <div className="text-xs font-bold text-teal-800">
                      INSTALASI LABORATORIUM PATOLOGI KLINIK
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Jalan Provinsi, Sukadana - Kayong Utara (78852)
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <h1 className="text-xs sm:text-sm font-extrabold tracking-wide uppercase text-slate-900">
                    FORMULIR CAPA MUTU
                  </h1>
                  <p className="text-[10px] text-slate-500 font-mono">
                    ISO 15189 / CLSI C24-A3
                  </p>
                </div>
              </div>

              {/* Metadata Table */}
              <table className="w-full border border-slate-300 text-xs">
                <tbody>
                  <tr className="border-b border-slate-300">
                    <td className="w-1/4 p-2 bg-slate-50 font-bold border-r border-slate-300">
                      Nomor CAPA:
                    </td>
                    <td className="w-1/4 p-2 font-mono font-bold text-teal-800 border-r border-slate-300">
                      {printCapa.capaNumber}
                    </td>
                    <td className="w-1/4 p-2 bg-slate-50 font-bold border-r border-slate-300">
                      Tanggal Lapor:
                    </td>
                    <td className="w-1/4 p-2 font-mono">{printCapa.date}</td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="p-2 bg-slate-50 font-bold border-r border-slate-300">
                      Nama Alat:
                    </td>
                    <td className="p-2 border-r border-slate-300">{printCapa.instrumentName}</td>
                    <td className="p-2 bg-slate-50 font-bold border-r border-slate-300">
                      Parameter Uji:
                    </td>
                    <td className="p-2 font-semibold">{printCapa.parameterName}</td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="p-2 bg-slate-50 font-bold border-r border-slate-300">
                      Sumber Masalah:
                    </td>
                    <td className="p-2 border-r border-slate-300">{printCapa.problemSource}</td>
                    <td className="p-2 bg-slate-50 font-bold border-r border-slate-300">
                      Status Saat Ini:
                    </td>
                    <td className="p-2 font-bold">{printCapa.status}</td>
                  </tr>
                  <tr>
                    <td className="p-2 bg-slate-50 font-bold border-r border-slate-300">
                      Penanggung Jawab:
                    </td>
                    <td className="p-2 border-r border-slate-300 font-medium">{printCapa.pic}</td>
                    <td className="p-2 bg-slate-50 font-bold border-r border-slate-300">
                      Target Selesai:
                    </td>
                    <td className="p-2 font-mono">{printCapa.targetDate}</td>
                  </tr>
                </tbody>
              </table>

              {/* Sections */}
              <div className="space-y-4">
                <div className="border border-slate-300 rounded-lg p-3">
                  <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">
                    1. Deskripsi Ketidaksesuaian / Masalah:
                  </div>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {printCapa.problemDescription}
                  </p>
                </div>

                <div className="border border-slate-300 rounded-lg p-3">
                  <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">
                    2. Analisis Akar Penyebab Masalah (Root Cause Analysis):
                  </div>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {printCapa.rootCauseAnalysis || 'Sedang dalam pengumpulan data investigasi.'}
                  </p>
                </div>

                <div className="border border-slate-300 rounded-lg p-3">
                  <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">
                    3. Tindakan Korektif (Immediate Action):
                  </div>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {printCapa.correctiveAction}
                  </p>
                </div>

                <div className="border border-slate-300 rounded-lg p-3">
                  <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">
                    4. Tindakan Pencegahan (Preventive Action):
                  </div>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {printCapa.preventiveAction || 'Peningkatan supervisi berkala terhadap SOP.'}
                  </p>
                </div>

                <div className="border border-slate-300 rounded-lg p-3 bg-slate-50/50">
                  <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 mb-2">
                    5. Verifikasi Efektivitas Tindakan:
                  </div>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {printCapa.verificationResult || 'Menunggu verifikasi hasil QC run berikutnya.'}
                  </p>
                  {printCapa.verifiedBy && (
                    <div className="text-[11px] text-slate-500 mt-2">
                      Diverifikasi oleh: <strong>{printCapa.verifiedBy}</strong> pada {printCapa.verifiedAt}
                    </div>
                  )}
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-300 text-center">
                <div>
                  <p className="text-slate-500 text-[11px]">Penanggung Jawab Tindakan (PIC)</p>
                  <div className="h-16 flex items-end justify-center font-bold text-slate-800">
                    {printCapa.pic}
                  </div>
                  <p className="text-[10px] text-slate-400">Ahli Teknologi Laboratorium Medik (ATLM) / Staf Laboratorium</p>
                </div>

                <div>
                  <p className="text-slate-500 text-[11px]">Penanggung Jawab Lab / Dokter Sp.PK</p>
                  <div className="h-16 flex items-end justify-center font-bold text-slate-800">
                    dr. Maya Andriani, Sp.PK
                  </div>
                  <p className="text-[10px] text-slate-400">Dokter Spesialis Patologi Klinik</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
