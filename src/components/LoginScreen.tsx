import React, { useState } from 'react';
import {
  Lock,
  User as UserIcon,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { User } from '../types/index.ts';
import { storage, APP_LOGO_SRC } from '../services/storage.ts';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const user = storage.authenticate(username, password);
      if (user) {
        onLoginSuccess(user);
      } else {
        setErrorMessage('Username/NIP atau kata sandi tidak sesuai, atau akun Anda nonaktif.');
      }
      setIsLoading(false);
    }, 250);
  };

  const handleQuickLogin = (staffUsername: string, staffPass: string) => {
    setUsername(staffUsername);
    setPassword(staffPass);
    setErrorMessage('');
    const user = storage.authenticate(staffUsername, staffPass);
    if (user) {
      onLoginSuccess(user);
    }
  };

  const labProfile = storage.getLabProfile();

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-800 relative overflow-hidden font-sans">
      {/* Background Subtle Gradient & Glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Card */}
        <div className="bg-gradient-to-b from-teal-900 to-slate-900 p-6 sm:p-7 text-center text-white relative">
          <div className="flex flex-col items-center gap-3">
            <div className="h-20 w-20 bg-white rounded-2xl p-2 shadow-lg flex items-center justify-center border border-white/20">
              <img
                src={APP_LOGO_SRC}
                alt="Logo Kabupaten Kayong Utara"
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <span className="text-[10px] tracking-widest uppercase font-bold text-teal-300 block mb-1">
                Pemerintah Kabupaten Kayong Utara
              </span>
              <h1 className="text-base sm:text-lg font-black tracking-tight leading-tight uppercase text-white">
                {labProfile.institution}
              </h1>
              <p className="text-xs text-teal-100 font-semibold mt-0.5">
                {labProfile.name}
              </p>
            </div>
          </div>
        </div>

        {/* Login Form Body */}
        <div className="p-6 sm:p-8 space-y-5">
          <div className="text-center space-y-1">
            <h2 className="text-base font-bold text-slate-900">
              Masuk ke Sistem Kendali Mutu (QC)
            </h2>
            <p className="text-xs text-slate-500">
              Gunakan akun resmi analis atau dokter penanggung jawab laboratorium
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {/* Username / NIP */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Username atau NIP
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: rudi, maya, atau admin"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-slate-900 font-medium"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kata Sandi</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-xs"
            >
              {isLoading ? (
                <span>Memproses Verifikasi...</span>
              ) : (
                <>
                  <span>Masuk ke Aplikasi QC</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Card Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-500 space-y-0.5">
          <p className="font-medium text-slate-700">
            {labProfile.address}, {labProfile.city}
          </p>
          <p className="text-slate-400">
            Sistem Kendali Mutu Internal (PMI) Berbasis Standar CLSI C24 & ISO 15189
          </p>
        </div>
      </div>
    </div>
  );
};
