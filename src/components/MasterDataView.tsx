import React, { useState, useMemo, useEffect } from 'react';
import {
  Database,
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Layers,
  FlaskConical,
  Activity,
  Calendar,
  Sparkles,
  Info,
  Users,
  ShieldCheck,
  KeyRound,
  Building2,
} from 'lucide-react';
import {
  ControlMaterial,
  Instrument,
  Parameter,
  QCTarget,
  User,
  Role,
  LabProfile,
} from '../types/index.ts';

interface MasterDataViewProps {
  currentUser: User;
  instruments: Instrument[];
  parameters: Parameter[];
  controlMaterials: ControlMaterial[];
  qcTargets: QCTarget[];
  users: User[];
  labProfile: LabProfile;
  onSaveInstrument: (inst: Instrument) => void;
  onDeleteInstrument: (id: string) => void;
  onSaveParameter: (param: Parameter) => void;
  onDeleteParameter: (id: string) => void;
  onSaveControl: (ctrl: ControlMaterial) => void;
  onDeleteControl: (id: string) => void;
  onSaveTarget: (tgt: QCTarget) => void;
  onDeleteTarget: (id: string) => void;
  onSaveUser: (u: User) => void;
  onDeleteUser: (id: string) => void;
  onSaveProfile: (profile: LabProfile) => void;
}

type SubTab = 'instruments' | 'parameters' | 'controls' | 'targets' | 'users' | 'profile';

export const MasterDataView: React.FC<MasterDataViewProps> = ({
  currentUser,
  instruments,
  parameters,
  controlMaterials,
  qcTargets,
  users,
  labProfile,
  onSaveInstrument,
  onDeleteInstrument,
  onSaveParameter,
  onDeleteParameter,
  onSaveControl,
  onDeleteControl,
  onSaveTarget,
  onDeleteTarget,
  onSaveUser,
  onDeleteUser,
  onSaveProfile,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('instruments');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal States
  const [modalType, setModalType] = useState<SubTab | null>(null);
  const [editItem, setEditItem] = useState<any>(null);

  // Form states for Instruments
  const [instName, setInstName] = useState('');
  const [instBrand, setInstBrand] = useState('');
  const [instModel, setInstModel] = useState('');
  const [instSerial, setInstSerial] = useState('');
  const [instLocation, setInstLocation] = useState('');
  const [instStatus, setInstStatus] = useState<'Aktif' | 'Maintenance' | 'Nonaktif'>('Aktif');

  // Form states for Parameters
  const [paramName, setParamName] = useState('');
  const [paramCode, setParamCode] = useState('');
  const [paramUnit, setParamUnit] = useState('');
  const [paramInstId, setParamInstId] = useState(instruments[0]?.id || '');
  const [paramMethod, setParamMethod] = useState('');

  // Form states for Control Materials
  const [ctrlName, setCtrlName] = useState('');
  const [ctrlManufacturer, setCtrlManufacturer] = useState('');
  const [ctrlLot, setCtrlLot] = useState('');
  const [ctrlLevel, setCtrlLevel] = useState<'Level 1' | 'Level 2' | 'Level 3'>('Level 1');
  const [ctrlExpDate, setCtrlExpDate] = useState('');
  const [ctrlStatus, setCtrlStatus] = useState<'Aktif' | 'Kedaluwarsa'>('Aktif');

  // Form states for Targets
  const [targetInstId, setTargetInstId] = useState(instruments[0]?.id || '');
  const [targetParamId, setTargetParamId] = useState(parameters[0]?.id || '');
  const [targetLevel, setTargetLevel] = useState<'Level 1' | 'Level 2' | 'Level 3'>('Level 1');
  const [targetLot, setTargetLot] = useState('');
  const [targetMean, setTargetMean] = useState('');
  const [targetSd, setTargetSd] = useState('');

  // Form states for Users
  const [userName, setUserName] = useState('');
  const [userUsername, setUserUsername] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState<Role>('analis');
  const [userNip, setUserNip] = useState('');
  const [userStatus, setUserStatus] = useState<'Aktif' | 'Nonaktif'>('Aktif');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');

  // Form states for Lab Profile
  const [profileName, setProfileName] = useState(labProfile?.name || 'Laboratorium Patologi Klinik');
  const [profileInstitution, setProfileInstitution] = useState(labProfile?.institution || 'RSUD Sultan Muhammad Jamaludin I');
  const [profileAddress, setProfileAddress] = useState(labProfile?.address || 'Jalan Provinsi, Sukadana');
  const [profileCity, setProfileCity] = useState(labProfile?.city || 'Kayong Utara, Kode Pos 78852');
  const [profileLicense, setProfileLicense] = useState(labProfile?.licenseNumber || 'No. 445/012-DINKES/SMJ1/2024');
  const [profilePhone, setProfilePhone] = useState(labProfile?.phone || '(0534) 771-0022 / Ext. 115');
  const [profileEmail, setProfileEmail] = useState(labProfile?.email || 'lab.rsudsmj1@kayongutarakab.go.id');
  const [profileHead, setProfileHead] = useState(labProfile?.headOfLab || 'dr. Maya Andriani, Sp.PK');
  const [profileHeadTitle, setProfileHeadTitle] = useState(labProfile?.headOfLabTitle || 'Dokter Spesialis Patologi Klinik');
  const [profileSavedToast, setProfileSavedToast] = useState(false);

  useEffect(() => {
    if (labProfile) {
      setProfileName(labProfile.name);
      setProfileInstitution(labProfile.institution);
      setProfileAddress(labProfile.address);
      setProfileCity(labProfile.city);
      setProfileLicense(labProfile.licenseNumber);
      setProfilePhone(labProfile.phone);
      setProfileEmail(labProfile.email);
      setProfileHead(labProfile.headOfLab);
      setProfileHeadTitle(labProfile.headOfLabTitle);
    }
  }, [labProfile]);

  const handleSaveLabProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: LabProfile = {
      ...labProfile,
      name: profileName.trim(),
      institution: profileInstitution.trim(),
      address: profileAddress.trim(),
      city: profileCity.trim(),
      licenseNumber: profileLicense.trim(),
      phone: profilePhone.trim(),
      email: profileEmail.trim(),
      headOfLab: profileHead.trim(),
      headOfLabTitle: profileHeadTitle.trim(),
    };
    onSaveProfile(updated);
    setProfileSavedToast(true);
    setTimeout(() => setProfileSavedToast(false), 3000);
  };

  // Calculated CV% on the fly for Target Modal
  const calculatedCV = useMemo(() => {
    const m = parseFloat(targetMean);
    const s = parseFloat(targetSd);
    if (!isNaN(m) && !isNaN(s) && m > 0) {
      return Number(((s / m) * 100).toFixed(2));
    }
    return 0;
  }, [targetMean, targetSd]);

  // Open Add Modal
  const handleOpenAdd = (type: SubTab) => {
    setEditItem(null);
    setModalType(type);

    if (type === 'instruments') {
      setInstName('');
      setInstBrand('');
      setInstModel('');
      setInstSerial('');
      setInstLocation('Laboratorium Kimia Klinik');
      setInstStatus('Aktif');
    } else if (type === 'parameters') {
      setParamName('');
      setParamCode('');
      setParamUnit('mg/dL');
      setParamInstId(instruments[0]?.id || '');
      setParamMethod('');
    } else if (type === 'controls') {
      setCtrlName('');
      setCtrlManufacturer('Bio-Rad Laboratories');
      setCtrlLot('');
      setCtrlLevel('Level 1');
      const d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      setCtrlExpDate(d.toISOString().split('T')[0]);
      setCtrlStatus('Aktif');
    } else if (type === 'targets') {
      setTargetInstId(instruments[0]?.id || '');
      setTargetParamId(parameters[0]?.id || '');
      setTargetLevel('Level 1');
      setTargetLot('');
      setTargetMean('');
      setTargetSd('');
    } else if (type === 'users') {
      setUserName('');
      setUserUsername('');
      setUserPassword('');
      setUserRole('analis');
      setUserNip('');
      setUserStatus('Aktif');
      setUserEmail('');
      setUserPhone('');
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (type: SubTab, item: any) => {
    setEditItem(item);
    setModalType(type);

    if (type === 'instruments') {
      setInstName(item.name);
      setInstBrand(item.brand);
      setInstModel(item.model);
      setInstSerial(item.serialNumber);
      setInstLocation(item.location);
      setInstStatus(item.status);
    } else if (type === 'parameters') {
      setParamName(item.name);
      setParamCode(item.code);
      setParamUnit(item.unit);
      setParamInstId(item.instrumentId);
      setParamMethod(item.method);
    } else if (type === 'controls') {
      setCtrlName(item.name);
      setCtrlManufacturer(item.manufacturer);
      setCtrlLot(item.lotNumber);
      setCtrlLevel(item.level);
      setCtrlExpDate(item.expirationDate);
      setCtrlStatus(item.status);
    } else if (type === 'targets') {
      setTargetInstId(item.instrumentId);
      setTargetParamId(item.parameterId);
      setTargetLevel(item.level);
      setTargetLot(item.lotNumber);
      setTargetMean(String(item.mean));
      setTargetSd(String(item.sd));
    } else if (type === 'users') {
      setUserName(item.name);
      setUserUsername(item.username || '');
      setUserPassword(item.password || '');
      setUserRole(item.role);
      setUserNip(item.nip);
      setUserStatus(item.status || 'Aktif');
      setUserEmail(item.email || '');
      setUserPhone(item.phone || '');
    }
  };

  // Submit User
  const handleSubmitUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!userName.trim() || !userUsername.trim()) {
      alert('Nama lengkap dan username wajib diisi.');
      return;
    }

    // Check duplicate username if new
    const existing = users.find(
      (u) => u.username?.toLowerCase() === userUsername.trim().toLowerCase() && u.id !== editItem?.id
    );
    if (existing) {
      alert(`Username "${userUsername}" sudah digunakan oleh pengguna lain. Silakan pilih username lain.`);
      return;
    }

    const roleLabels: Record<Role, string> = {
      analis: 'Ahli Teknologi Laboratorium Medik (ATLM)',
      sppk: 'Penanggung Jawab Lab / Sp.PK',
      admin: 'Administrator Sistem',
      supervisor: 'Supervisor Laboratorium',
    };

    const userObj: User = {
      id: editItem ? editItem.id : `USR-${Date.now()}`,
      name: userName.trim(),
      username: userUsername.trim().toLowerCase(),
      password: userPassword.trim() || (editItem?.password || 'password123'),
      role: userRole,
      roleLabel: roleLabels[userRole] || 'Petugas Laboratorium',
      nip: userNip.trim() || '-',
      status: userStatus,
      email: userEmail.trim() || '',
      phone: userPhone.trim() || '',
      createdAt: editItem ? editItem.createdAt : new Date().toISOString().split('T')[0],
    };

    onSaveUser(userObj);
    setModalType(null);
  };

  // Submit Instrument
  const handleSubmitInstrument = (e: React.FormEvent) => {
    e.preventDefault();
    const inst: Instrument = {
      id: editItem ? editItem.id : `INST-${Date.now()}`,
      name: instName,
      brand: instBrand,
      model: instModel,
      serialNumber: instSerial,
      location: instLocation,
      status: instStatus,
      createdAt: editItem ? editItem.createdAt : new Date().toISOString().split('T')[0],
    };
    onSaveInstrument(inst);
    setModalType(null);
  };

  // Submit Parameter
  const handleSubmitParameter = (e: React.FormEvent) => {
    e.preventDefault();
    const inst = instruments.find((i) => i.id === paramInstId);
    const param: Parameter = {
      id: editItem ? editItem.id : `PARAM-${Date.now()}`,
      name: paramName,
      code: paramCode.toUpperCase(),
      unit: paramUnit,
      instrumentId: paramInstId,
      instrumentName: inst ? inst.name : '',
      method: paramMethod,
    };
    onSaveParameter(param);
    setModalType(null);
  };

  // Submit Control Material
  const handleSubmitControl = (e: React.FormEvent) => {
    e.preventDefault();
    const ctrl: ControlMaterial = {
      id: editItem ? editItem.id : `CTRL-${Date.now()}`,
      name: ctrlName,
      manufacturer: ctrlManufacturer,
      lotNumber: ctrlLot,
      level: ctrlLevel,
      expirationDate: ctrlExpDate,
      status: ctrlStatus,
    };
    onSaveControl(ctrl);
    setModalType(null);
  };

  // Submit Target
  const handleSubmitTarget = (e: React.FormEvent) => {
    e.preventDefault();
    const m = parseFloat(targetMean);
    const s = parseFloat(targetSd);
    if (isNaN(m) || isNaN(s) || m <= 0 || s <= 0) {
      alert('Mean dan SD harus berupa angka positif.');
      return;
    }

    const inst = instruments.find((i) => i.id === targetInstId);
    const param = parameters.find((p) => p.id === targetParamId);

    const tgt: QCTarget = {
      id: editItem ? editItem.id : `TGT-${Date.now()}`,
      instrumentId: targetInstId,
      instrumentName: inst ? inst.name : '',
      parameterId: targetParamId,
      parameterName: param ? param.name : '',
      level: targetLevel,
      lotNumber: targetLot,
      mean: m,
      sd: s,
      cv: calculatedCV,
      effectiveDate: editItem ? editItem.effectiveDate : new Date().toISOString().split('T')[0],
    };
    onSaveTarget(tgt);
    setModalType(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Master Data Laboratorium
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Pengelolaan data instrumen, parameter pemeriksaan, bahan kontrol, dan nilai target acuan QC
          </p>
        </div>

        <button
          onClick={() => handleOpenAdd(activeSubTab)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>
            {activeSubTab === 'instruments' && 'Tambah Alat Baru'}
            {activeSubTab === 'parameters' && 'Tambah Parameter Baru'}
            {activeSubTab === 'controls' && 'Tambah Bahan Kontrol'}
            {activeSubTab === 'targets' && 'Tambah Nilai Target QC'}
            {activeSubTab === 'users' && 'Tambah Pengguna Baru'}
          </span>
        </button>
      </div>

      {/* Info notice about historical preservation */}
      <div className="bg-sky-50 border border-sky-200 p-3.5 rounded-xl text-xs text-sky-800 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-sky-600 mt-0.5 shrink-0" />
        <div>
          <strong className="font-semibold">Integritas Data Historis Terjamin:</strong> Perubahan
          nilai target Mean atau SD pada Master Data tidak akan merubah nilai target maupun Z-score
          pada rekaman QC masa lalu yang telah tersimpan. Data historis terkunci secara permanen.
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl text-xs font-semibold">
        <button
          onClick={() => {
            setActiveSubTab('instruments');
            setSearchTerm('');
          }}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            activeSubTab === 'instruments'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FlaskConical className="w-4 h-4 text-teal-600" />
          <span>A. Master Alat ({instruments.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('parameters');
            setSearchTerm('');
          }}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            activeSubTab === 'parameters'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4 text-blue-600" />
          <span>B. Master Parameter ({parameters.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('controls');
            setSearchTerm('');
          }}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            activeSubTab === 'controls'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-purple-600" />
          <span>C. Master Bahan Kontrol ({controlMaterials.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('targets');
            setSearchTerm('');
          }}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            activeSubTab === 'targets'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>D. Master Nilai Target QC ({qcTargets.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('users');
            setSearchTerm('');
          }}
          className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            activeSubTab === 'users'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-600" />
          <span>E. Hak Akses Pengguna ({users.length})</span>
        </button>
      </div>

      {/* Tab A: Master Alat */}
      {activeSubTab === 'instruments' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Nama Alat</th>
                  <th className="py-3 px-4">Merek</th>
                  <th className="py-3 px-4">Model & Seri</th>
                  <th className="py-3 px-4">Lokasi Laboratorium</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {instruments.map((inst) => (
                  <tr key={inst.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {inst.name}
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{inst.brand}</td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      <div>{inst.model}</div>
                      <div className="text-[10px] text-slate-400 font-mono">SN: {inst.serialNumber}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{inst.location}</td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                          inst.status === 'Aktif'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inst.status === 'Maintenance'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {inst.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit('instruments', inst)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteInstrument(inst.id)}
                          title="Hapus Alat"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab B: Master Parameter */}
      {activeSubTab === 'parameters' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Nama Parameter</th>
                  <th className="py-3 px-4">Kode</th>
                  <th className="py-3 px-4">Satuan</th>
                  <th className="py-3 px-4">Alat Terkait</th>
                  <th className="py-3 px-4">Metode Pemeriksaan</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parameters.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">{p.name}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-700">
                        {p.code}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap font-medium">{p.unit}</td>
                    <td className="py-3 px-4 text-slate-800 whitespace-nowrap font-semibold">
                      {p.instrumentName}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{p.method}</td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit('parameters', p)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteParameter(p.id)}
                          title="Hapus Parameter"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab C: Master Bahan Kontrol */}
      {activeSubTab === 'controls' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Nama Bahan Kontrol</th>
                  <th className="py-3 px-4">Produsen</th>
                  <th className="py-3 px-4">Nomor Lot</th>
                  <th className="py-3 px-4">Level</th>
                  <th className="py-3 px-4">Kedaluwarsa</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {controlMaterials.map((ctrl) => (
                  <tr key={ctrl.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">{ctrl.name}</td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{ctrl.manufacturer}</td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-teal-800">
                      {ctrl.lotNumber}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-800">{ctrl.level}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-700">
                      {ctrl.expirationDate}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                          ctrl.status === 'Aktif'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {ctrl.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit('controls', ctrl)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteControl(ctrl.id)}
                          title="Hapus Kontrol"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab D: Master Nilai Target QC */}
      {activeSubTab === 'targets' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Alat</th>
                  <th className="py-3 px-4">Parameter</th>
                  <th className="py-3 px-4">Level & Lot</th>
                  <th className="py-3 px-4 text-right">Target Mean (X̄)</th>
                  <th className="py-3 px-4 text-right">Target SD (±1SD)</th>
                  <th className="py-3 px-4 text-right">CV%</th>
                  <th className="py-3 px-4 text-center">Rentang Toleransi (±2SD)</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {qcTargets.map((tgt) => {
                  const min2SD = (tgt.mean - 2 * tgt.sd).toFixed(2);
                  const plus2SD = (tgt.mean + 2 * tgt.sd).toFixed(2);
                  return (
                    <tr key={tgt.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                        {tgt.instrumentName}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {tgt.parameterName}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">{tgt.level}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          Lot: {tgt.lotNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {tgt.mean}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700 whitespace-nowrap">
                        ±{tgt.sd}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-teal-700 whitespace-nowrap">
                        {tgt.cv}%
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap font-mono text-[11px] text-slate-600">
                        {min2SD} — {plus2SD}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit('targets', tgt)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteTarget(tgt.id)}
                            title="Hapus Target"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab E: Master Pengguna & Hak Akses */}
      {activeSubTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Daftar Petugas & Pengaturan Hak Akses
              </h3>
              <p className="text-xs text-slate-500">
                Kelola kredensial akun, NIP, serta peran kewenangan di laboratorium RSUD S.M. Jamaludin I
              </p>
            </div>
            <button
              onClick={() => handleOpenAdd('users')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Tambah Petugas Baru</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Nama Petugas & NIP</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Peran / Hak Akses</th>
                  <th className="py-3 px-4">Kontak (Email / Telepon)</th>
                  <th className="py-3 px-4 text-center">Status Akun</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal-50 text-teal-700 border border-teal-200">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">NIP: {u.nip}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono font-semibold text-slate-800">
                        @{u.username}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : u.role === 'sppk'
                              ? 'bg-teal-100 text-teal-800'
                              : u.role === 'supervisor'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          <span>{u.roleLabel}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap text-[11px]">
                        <div>{u.email || '-'}</div>
                        <div className="text-[10px] text-slate-400">{u.phone || '-'}</div>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                            u.status === 'Aktif'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit('users', u)}
                            title="Edit Data Pengguna"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            disabled={isCurrent}
                            onClick={() => {
                              if (isCurrent) {
                                alert('Anda tidak dapat menghapus akun yang sedang aktif digunakan.');
                                return;
                              }
                              onDeleteUser(u.id);
                            }}
                            title={isCurrent ? 'Tidak dapat menghapus akun aktif' : 'Hapus Pengguna'}
                            className={`p-1.5 rounded ${
                              isCurrent
                                ? 'text-slate-200 cursor-not-allowed'
                                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Master Alat */}
      {modalType === 'instruments' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editItem ? 'Edit Data Alat' : 'Tambah Alat Baru'}
              </h3>
              <button
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitInstrument} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Alat</label>
                <input
                  type="text"
                  required
                  value={instName}
                  onChange={(e) => setInstName(e.target.value)}
                  placeholder="Misal: Cobas c311"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Merek / Pabrikan</label>
                <input
                  type="text"
                  required
                  value={instBrand}
                  onChange={(e) => setInstBrand(e.target.value)}
                  placeholder="Misal: Roche Diagnostics"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Model Alat</label>
                <input
                  type="text"
                  required
                  value={instModel}
                  onChange={(e) => setInstModel(e.target.value)}
                  placeholder="Misal: Clinical Chemistry Analyzer"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor Seri</label>
                <input
                  type="text"
                  required
                  value={instSerial}
                  onChange={(e) => setInstSerial(e.target.value)}
                  placeholder="Contoh: COB-984210"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lokasi Laboratorium</label>
                <input
                  type="text"
                  required
                  value={instLocation}
                  onChange={(e) => setInstLocation(e.target.value)}
                  placeholder="Misal: Lab Kimia Klinik Ruang 102"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status Operasional</label>
                <select
                  value={instStatus}
                  onChange={(e) => setInstStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-white focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Simpan Alat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Master Parameter */}
      {modalType === 'parameters' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editItem ? 'Edit Parameter Pemeriksaan' : 'Tambah Parameter Baru'}
              </h3>
              <button
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitParameter} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Parameter</label>
                <input
                  type="text"
                  required
                  value={paramName}
                  onChange={(e) => setParamName(e.target.value)}
                  placeholder="Misal: Glukosa Darah"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Parameter</label>
                  <input
                    type="text"
                    required
                    value={paramCode}
                    onChange={(e) => setParamCode(e.target.value)}
                    placeholder="GLU"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    required
                    value={paramUnit}
                    onChange={(e) => setParamUnit(e.target.value)}
                    placeholder="mg/dL"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alat Terkait</label>
                <select
                  value={paramInstId}
                  onChange={(e) => setParamInstId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-white focus:ring-2 focus:ring-teal-500"
                >
                  {instruments.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.brand})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Metode Pemeriksaan</label>
                <input
                  type="text"
                  required
                  value={paramMethod}
                  onChange={(e) => setParamMethod(e.target.value)}
                  placeholder="Misal: Enzymatic Hexokinase"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Simpan Parameter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Master Bahan Kontrol */}
      {modalType === 'controls' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editItem ? 'Edit Bahan Kontrol' : 'Tambah Bahan Kontrol Baru'}
              </h3>
              <button
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitControl} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Bahan Kontrol</label>
                <input
                  type="text"
                  required
                  value={ctrlName}
                  onChange={(e) => setCtrlName(e.target.value)}
                  placeholder="Misal: Lyphochek Assayed Chemistry L1"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Produsen</label>
                <input
                  type="text"
                  required
                  value={ctrlManufacturer}
                  onChange={(e) => setCtrlManufacturer(e.target.value)}
                  placeholder="Misal: Bio-Rad Laboratories"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Lot</label>
                  <input
                    type="text"
                    required
                    value={ctrlLot}
                    onChange={(e) => setCtrlLot(e.target.value)}
                    placeholder="BIO-2401"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Level</label>
                  <select
                    value={ctrlLevel}
                    onChange={(e) => setCtrlLevel(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-white focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Level 1">Level 1</option>
                    <option value="Level 2">Level 2</option>
                    <option value="Level 3">Level 3</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tanggal Kedaluwarsa</label>
                  <input
                    type="date"
                    required
                    value={ctrlExpDate}
                    onChange={(e) => setCtrlExpDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={ctrlStatus}
                    onChange={(e) => setCtrlStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-white focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Kedaluwarsa">Kedaluwarsa</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Simpan Bahan Kontrol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Master Target QC */}
      {modalType === 'targets' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editItem ? 'Edit Target Nilai Acuan QC' : 'Tambah Target Nilai Acuan QC'}
              </h3>
              <button
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitTarget} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Alat</label>
                <select
                  value={targetInstId}
                  onChange={(e) => setTargetInstId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-white focus:ring-2 focus:ring-teal-500"
                >
                  {instruments.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Parameter Uji</label>
                <select
                  value={targetParamId}
                  onChange={(e) => setTargetParamId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-white focus:ring-2 focus:ring-teal-500"
                >
                  {parameters.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} [{p.code}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Level Kontrol</label>
                  <select
                    value={targetLevel}
                    onChange={(e) => setTargetLevel(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-white focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Level 1">Level 1</option>
                    <option value="Level 2">Level 2</option>
                    <option value="Level 3">Level 3</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Lot</label>
                  <input
                    type="text"
                    required
                    value={targetLot}
                    onChange={(e) => setTargetLot(e.target.value)}
                    placeholder="BIO-2401"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Mean (X̄)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={targetMean}
                    onChange={(e) => setTargetMean(e.target.value)}
                    placeholder="Contoh: 95.0"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target SD (±1SD)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={targetSd}
                    onChange={(e) => setTargetSd(e.target.value)}
                    placeholder="Contoh: 2.5"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Automatic CV Calculation Preview */}
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-teal-900 block">
                    Koefisien Variasi (CV% Otomatis):
                  </span>
                  <span className="text-[10px] text-teal-700 font-mono">
                    Rumus: (SD / Mean) × 100%
                  </span>
                </div>
                <div className="text-lg font-black font-mono text-teal-800">
                  {calculatedCV}%
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Simpan Target QC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Master Pengguna & Hak Akses */}
      {modalType === 'users' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editItem ? 'Edit Hak Akses Pengguna' : 'Tambah Pengguna & Petugas Baru'}
                </h3>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitUser} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Contoh: dr. Bambang Irawan, Sp.PK atau Diana, A.Md.AK"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Username Login <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={userUsername}
                    onChange={(e) => setUserUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="misal: bambang"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-400">Digunakan untuk masuk sistem</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kata Sandi {editItem ? '(Kosongkan jika tidak diubah)' : <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type="text"
                    required={!editItem}
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    placeholder={editItem ? 'Biarkan kata sandi lama' : 'Minimal 6 karakter'}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Hak Akses / Peran <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value as Role)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-white focus:ring-2 focus:ring-teal-500 font-semibold"
                  >
                    <option value="analis">Ahli Teknologi Laboratorium Medik (ATLM) - Pelaksana</option>
                    <option value="sppk">Penanggung Jawab Lab / Sp.PK (Validator)</option>
                    <option value="supervisor">Supervisor Laboratorium</option>
                    <option value="admin">Administrator Sistem (Full Access)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status Akun</label>
                  <select
                    value={userStatus}
                    onChange={(e) => setUserStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none bg-white focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Aktif">Aktif (Dapat Login)</option>
                    <option value="Nonaktif">Nonaktif (Diblokir)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIP / ID Pegawai</label>
                  <input
                    type="text"
                    value={userNip}
                    onChange={(e) => setUserNip(e.target.value)}
                    placeholder="Contoh: 198801122014021001"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nomor Telepon / WA</label>
                  <input
                    type="text"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="Contoh: 0812-3456-7890"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Resmi (Opsional)</label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="atlm@kayongutarakab.go.id"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Roles helper info */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500 space-y-1">
                <span className="font-semibold text-slate-700 block">Keterangan Hak Akses:</span>
                <p>• <strong>ATLM:</strong> Melakukan pencatatan QC harian, melihat grafik LJ, dan mencetak laporan.</p>
                <p>• <strong>Sp.PK:</strong> Melakukan verifikasi penutupan CAPA, evaluasi Westgard, dan pengesahan dokumen.</p>
                <p>• <strong>Administrator:</strong> Mengelola data master, akun pengguna, dan konfigurasi sistem.</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
