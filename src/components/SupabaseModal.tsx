import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  ExternalLink,
  X,
  KeyRound,
  Globe,
  ShieldCheck,
} from 'lucide-react';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataSynced?: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onDataSynced,
}) => {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [status, setStatus] = useState<{
    connected: boolean;
    configured: boolean;
    url: string | null;
    message: string;
  }>({
    connected: false,
    configured: false,
    url: null,
    message: 'Memuat status...',
  });
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
  }>({ type: null, message: '' });

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/supabase/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.fullUrl) {
          setSupabaseUrl(data.fullUrl);
        }
      }
    } catch {
      setStatus({
        connected: false,
        configured: false,
        url: null,
        message: 'Gagal menghubungi server.',
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setFeedback({ type: null, message: '' });
    }
  }, [isOpen]);

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl.trim() || !anonKey.trim()) {
      setFeedback({
        type: 'error',
        message: 'Harap isi Project URL dan Anon Key Supabase Anda.',
      });
      return;
    }

    setIsLoading(true);
    setFeedback({ type: 'info', message: 'Menguji koneksi ke database Supabase...' });

    try {
      const res = await fetch('/api/supabase/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: supabaseUrl.trim(),
          anonKey: anonKey.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          message: 'Berhasil terhubung ke database Supabase! Kredensial tersimpan.',
        });
        fetchStatus();
      } else {
        setFeedback({
          type: 'error',
          message: data.message || 'Gagal terhubung. Pastikan URL dan Anon Key sudah benar.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Terjadi kesalahan jaringan: ${err.message || err}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncPush = async () => {
    if (!status.connected) {
      setFeedback({
        type: 'error',
        message: 'Hubungkan Supabase terlebih dahulu sebelum menyinkronkan data.',
      });
      return;
    }

    setIsSyncing(true);
    setFeedback({ type: 'info', message: 'Mengirim seluruh data lokal ke Supabase...' });

    try {
      const res = await fetch('/api/supabase/sync-push', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          message: `Berhasil sinkronisasi ke Supabase: ${data.pushed.records} data QC, ${data.pushed.instruments} alat, ${data.pushed.targets} target.`,
        });
        if (onDataSynced) onDataSynced();
      } else {
        setFeedback({
          type: 'error',
          message: data.message || 'Gagal mengirim data ke Supabase.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Sinkronisasi gagal: ${err.message || err}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncPull = async () => {
    if (!status.connected) {
      setFeedback({
        type: 'error',
        message: 'Hubungkan Supabase terlebih dahulu sebelum menyinkronkan data.',
      });
      return;
    }

    setIsSyncing(true);
    setFeedback({ type: 'info', message: 'Menarik data terbaru dari database Supabase...' });

    try {
      const res = await fetch('/api/supabase/sync-pull', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          message: `Berhasil menarik data dari Supabase: ${data.pulled.records} data QC terimpor ke sistem lokal.`,
        });
        if (onDataSynced) onDataSynced();
      } else {
        setFeedback({
          type: 'error',
          message: data.message || 'Gagal menarik data dari Supabase.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: `Sinkronisasi gagal: ${err.message || err}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Koneksi Database Supabase
              </h2>
              <p className="text-xs text-slate-500">
                Integrasi real-time QC RSUD Sultan Muhammad Jamaludin I
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Status Indicator Card */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3.5 transition-colors ${
              status.connected
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/80 border-amber-200 text-amber-900'
            }`}
          >
            {status.connected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="text-xs space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold">
                  Status Database:{' '}
                  {status.connected ? 'Terhubung ke Supabase' : 'Belum Terhubung'}
                </span>
                <button
                  type="button"
                  onClick={fetchStatus}
                  className="text-slate-500 hover:text-slate-700 flex items-center gap-1 font-medium"
                >
                  <RefreshCw className="w-3 h-3" /> Cek Ulang
                </button>
              </div>
              <p className="opacity-90">{status.message}</p>
              {status.url && (
                <p className="font-mono text-[11px] text-slate-600 truncate">
                  Endpoint: {status.url}
                </p>
              )}
            </div>
          </div>

          {/* Feedback Alert */}
          {feedback.message && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-100 text-emerald-800'
                  : feedback.type === 'error'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-blue-100 text-blue-800'
              }`}
            >
              {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
              {feedback.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
              {feedback.type === 'info' && <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Form Credentials */}
          <form onSubmit={handleTestAndSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-teal-600" />
                  Project URL Supabase
                </span>
                <span className="text-[10px] text-slate-400">Contoh: https://xyzcompany.supabase.co</span>
              </label>
              <input
                type="url"
                required
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3.5 py-2 text-xs font-mono border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-teal-600" />
                  Supabase Anon Key (Public Key)
                </span>
                <span className="text-[10px] text-slate-400">Project Settings → API</span>
              </label>
              <input
                type="password"
                required
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3.5 py-2 text-xs font-mono border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            {/* Helper link */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Cara Mendapatkan URL & Key Supabase:
              </div>
              <p>
                1. Buka dashboard proyek di{' '}
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 font-semibold underline inline-flex items-center gap-0.5"
                >
                  supabase.com <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </p>
              <p>2. Masuk ke <strong>Project Settings (ikon roda gigi) → API</strong>.</p>
              <p>3. Salin <strong>Project URL</strong> dan <strong>anon / public key</strong> ke kolom di atas.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Tutup
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Menguji & Menyimpan...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Uji & Hubungkan Supabase
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Sync Actions (Active when connected) */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <h3 className="text-xs font-bold text-slate-800">
              Sinkronisasi Data Dua Arah
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleSyncPush}
                disabled={!status.connected || isSyncing}
                className="p-3 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 rounded-xl text-left transition-all disabled:opacity-50 flex items-center gap-3"
              >
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Kirim ke Supabase</div>
                  <div className="text-[10px] text-slate-500">Upload data lokal ke cloud</div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleSyncPull}
                disabled={!status.connected || isSyncing}
                className="p-3 border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 rounded-xl text-left transition-all disabled:opacity-50 flex items-center gap-3"
              >
                <div className="p-2 bg-teal-100 text-teal-700 rounded-lg shrink-0">
                  <DownloadCloud className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Tarik dari Supabase</div>
                  <div className="text-[10px] text-slate-500">Perbarui data dari cloud</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
