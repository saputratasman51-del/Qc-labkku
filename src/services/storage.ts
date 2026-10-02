import {
  CAPARecord,
  ControlMaterial,
  Instrument,
  LabProfile,
  Parameter,
  QCRecord,
  QCTarget,
  User,
  WestgardRuleDefinition,
  WestgardViolation,
} from '../types/index.ts';
import { DEFAULT_WESTGARD_RULES } from './westgardEngine.ts';

const STORAGE_KEYS = {
  QC_RECORDS: 'labqc_records_v1',
  INSTRUMENTS: 'labqc_instruments_v1',
  PARAMETERS: 'labqc_parameters_v1',
  CONTROL_MATERIALS: 'labqc_controls_v1',
  QC_TARGETS: 'labqc_targets_v1',
  WESTGARD_VIOLATIONS: 'labqc_violations_v1',
  CAPA_RECORDS: 'labqc_capa_v1',
  WESTGARD_RULES: 'labqc_rules_v1',
  CURRENT_USER: 'labqc_user_v2',
  USERS: 'labqc_users_v2',
  AUTH_SESSION: 'labqc_session_v2',
  LAB_PROFILE: 'labqc_profile_v1',
};

export const INITIAL_USERS: User[] = [
  {
    id: 'USR-01',
    name: 'Rudi Kurniawan, A.Md.AK',
    username: 'rudi',
    password: 'password123',
    role: 'analis',
    roleLabel: 'Ahli Teknologi Laboratorium Medik (ATLM)',
    nip: '199203152015031002',
    status: 'Aktif',
    email: 'rudi.kurniawan@kayongutarakab.go.id',
    phone: '0812-3456-7890',
    createdAt: '2026-01-10',
  },
  {
    id: 'USR-02',
    name: 'dr. Maya Andriani, Sp.PK',
    username: 'maya',
    password: 'password123',
    role: 'sppk',
    roleLabel: 'Penanggung Jawab Lab / Sp.PK',
    nip: '198407222010122001',
    status: 'Aktif',
    email: 'dr.maya.sppk@kayongutarakab.go.id',
    phone: '0811-9876-5432',
    createdAt: '2026-01-10',
  },
  {
    id: 'USR-03',
    name: 'Siti Rahma, S.Kom',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    roleLabel: 'Administrator Sistem',
    nip: '199511042019022003',
    status: 'Aktif',
    email: 'admin.labsmj1@kayongutarakab.go.id',
    phone: '0857-1122-3344',
    createdAt: '2026-01-10',
  },
];

export const INITIAL_LAB_PROFILE: LabProfile = {
  name: 'Laboratorium Patologi Klinik',
  institution: 'RSUD Sultan Muhammad Jamaludin I',
  address: 'Jalan Provinsi, Sukadana',
  city: 'Kayong Utara, Kode Pos 78852',
  licenseNumber: 'No. 445/012-DINKES/SMJ1/2024',
  phone: '(0534) 771-0022 / Ext. 115',
  email: 'lab.rsudsmj1@kayongutarakab.go.id',
  headOfLab: 'dr. Maya Andriani, Sp.PK',
  headOfLabTitle: 'Dokter Spesialis Patologi Klinik',
};

export const INITIAL_INSTRUMENTS: Instrument[] = [
  {
    id: 'INST-01',
    name: 'Cobas c311',
    brand: 'Roche Diagnostics',
    model: 'c311 Clinical Chemistry Analyzer',
    serialNumber: 'COB-984210',
    location: 'Lab Kimia Klinik - Ruang 102',
    status: 'Aktif',
    createdAt: '2026-01-10',
  },
  {
    id: 'INST-02',
    name: 'Sysmex XN-550',
    brand: 'Sysmex Corporation',
    model: 'XN-550 5-Diff Hematology Analyzer',
    serialNumber: 'SYX-331045',
    location: 'Lab Hematologi - Ruang 104',
    status: 'Aktif',
    createdAt: '2026-01-10',
  },
  {
    id: 'INST-03',
    name: 'Mindray BS-240',
    brand: 'Mindray Medical',
    model: 'BS-240 Automatic Chemistry',
    serialNumber: 'MND-774912',
    location: 'Lab Kimia Klinik 2 - Ruang 103',
    status: 'Aktif',
    createdAt: '2026-02-01',
  },
  {
    id: 'INST-04',
    name: 'Alere Afinion 2',
    brand: 'Abbott Diagnostics',
    model: 'Afinion 2 Point of Care Analyzer',
    serialNumber: 'AFN-110294',
    location: 'Lab POC / Rawat Jalan',
    status: 'Aktif',
    createdAt: '2026-02-15',
  },
];

export const INITIAL_PARAMETERS: Parameter[] = [
  {
    id: 'PARAM-01',
    name: 'Glukosa Darah',
    code: 'GLU',
    unit: 'mg/dL',
    instrumentId: 'INST-01',
    instrumentName: 'Cobas c311',
    method: 'Enzymatic Hexokinase',
    clinicalSignificance: 'Diagnosis & pemantauan diabetes melitus',
  },
  {
    id: 'PARAM-02',
    name: 'Kolesterol Total',
    code: 'CHOL',
    unit: 'mg/dL',
    instrumentId: 'INST-01',
    instrumentName: 'Cobas c311',
    method: 'CHOD-PAP Enzymatic',
    clinicalSignificance: 'Penilaian risiko kardiovaskular & profil lipid',
  },
  {
    id: 'PARAM-03',
    name: 'Trigliserida',
    code: 'TG',
    unit: 'mg/dL',
    instrumentId: 'INST-01',
    instrumentName: 'Cobas c311',
    method: 'GPO-PAP Colorimetric',
    clinicalSignificance: 'Evaluasi metabolisme lemak',
  },
  {
    id: 'PARAM-04',
    name: 'SGOT (AST)',
    code: 'SGOT',
    unit: 'U/L',
    instrumentId: 'INST-01',
    instrumentName: 'Cobas c311',
    method: 'IFCC UV without P-5-P',
    clinicalSignificance: 'Pemeriksaan fungsi hepar & otot jantung',
  },
  {
    id: 'PARAM-05',
    name: 'SGPT (ALT)',
    code: 'SGPT',
    unit: 'U/L',
    instrumentId: 'INST-01',
    instrumentName: 'Cobas c311',
    method: 'IFCC UV without P-5-P',
    clinicalSignificance: 'Penanda spesifik kerusakan hepatoseluler',
  },
  {
    id: 'PARAM-06',
    name: 'Hemoglobin',
    code: 'HB',
    unit: 'g/dL',
    instrumentId: 'INST-02',
    instrumentName: 'Sysmex XN-550',
    method: 'SLS-Hemoglobin Detection',
    clinicalSignificance: 'Pemeriksaan anemia & polisitemia',
  },
  {
    id: 'PARAM-07',
    name: 'Leukosit (WBC)',
    code: 'WBC',
    unit: '10^3/uL',
    instrumentId: 'INST-02',
    instrumentName: 'Sysmex XN-550',
    method: 'Fluorescence Flow Cytometry',
    clinicalSignificance: 'Deteksi infeksi & inflamasi sistemik',
  },
  {
    id: 'PARAM-08',
    name: 'Trombosit (PLT)',
    code: 'PLT',
    unit: '10^3/uL',
    instrumentId: 'INST-02',
    instrumentName: 'Sysmex XN-550',
    method: 'Hydrodynamic Focusing DC',
    clinicalSignificance: 'Evaluasi hemostasis & risiko perdarahan',
  },
  {
    id: 'PARAM-09',
    name: 'HbA1c',
    code: 'HBA1C',
    unit: '%',
    instrumentId: 'INST-04',
    instrumentName: 'Alere Afinion 2',
    method: 'Boronate Affinity Chromatography',
    clinicalSignificance: 'Kontrol glikemik rata-rata 3 bulan',
  },
];

export const INITIAL_CONTROL_MATERIALS: ControlMaterial[] = [
  {
    id: 'CTRL-01',
    name: 'Bio-Rad Lyphochek Assayed Chemistry L1',
    manufacturer: 'Bio-Rad Laboratories',
    lotNumber: 'BIO-2401',
    level: 'Level 1',
    expirationDate: '2027-08-31',
    status: 'Aktif',
  },
  {
    id: 'CTRL-02',
    name: 'Bio-Rad Lyphochek Assayed Chemistry L2',
    manufacturer: 'Bio-Rad Laboratories',
    lotNumber: 'BIO-2402',
    level: 'Level 2',
    expirationDate: '2027-08-31',
    status: 'Aktif',
  },
  {
    id: 'CTRL-03',
    name: 'Sysmex e-CHECK Hematology L1',
    manufacturer: 'Streck / Sysmex',
    lotNumber: 'ECHK-911',
    level: 'Level 1',
    expirationDate: '2027-05-30',
    status: 'Aktif',
  },
  {
    id: 'CTRL-04',
    name: 'Sysmex e-CHECK Hematology L2',
    manufacturer: 'Streck / Sysmex',
    lotNumber: 'ECHK-912',
    level: 'Level 2',
    expirationDate: '2027-05-30',
    status: 'Aktif',
  },
  {
    id: 'CTRL-05',
    name: 'Afinion HbA1c Control Normal',
    manufacturer: 'Abbott Diagnostics',
    lotNumber: 'AFN-701',
    level: 'Level 1',
    expirationDate: '2027-10-15',
    status: 'Aktif',
  },
];

export const INITIAL_QC_TARGETS: QCTarget[] = [
  {
    id: 'TGT-01',
    instrumentId: 'INST-01',
    instrumentName: 'Cobas c311',
    parameterId: 'PARAM-01',
    parameterName: 'Glukosa Darah',
    level: 'Level 1',
    lotNumber: 'BIO-2401',
    mean: 95.0,
    sd: 2.5,
    cv: 2.63,
    effectiveDate: '2026-01-01',
  },
  {
    id: 'TGT-02',
    instrumentId: 'INST-01',
    instrumentName: 'Cobas c311',
    parameterId: 'PARAM-01',
    parameterName: 'Glukosa Darah',
    level: 'Level 2',
    lotNumber: 'BIO-2402',
    mean: 245.0,
    sd: 6.0,
    cv: 2.45,
    effectiveDate: '2026-01-01',
  },
  {
    id: 'TGT-03',
    instrumentId: 'INST-01',
    instrumentName: 'Cobas c311',
    parameterId: 'PARAM-02',
    parameterName: 'Kolesterol Total',
    level: 'Level 1',
    lotNumber: 'BIO-2401',
    mean: 152.0,
    sd: 4.5,
    cv: 2.96,
    effectiveDate: '2026-01-01',
  },
  {
    id: 'TGT-04',
    instrumentId: 'INST-01',
    instrumentName: 'Cobas c311',
    parameterId: 'PARAM-02',
    parameterName: 'Kolesterol Total',
    level: 'Level 2',
    lotNumber: 'BIO-2402',
    mean: 260.0,
    sd: 7.2,
    cv: 2.77,
    effectiveDate: '2026-01-01',
  },
  {
    id: 'TGT-05',
    instrumentId: 'INST-01',
    instrumentName: 'Cobas c311',
    parameterId: 'PARAM-04',
    parameterName: 'SGOT (AST)',
    level: 'Level 1',
    lotNumber: 'BIO-2401',
    mean: 34.0,
    sd: 1.6,
    cv: 4.71,
    effectiveDate: '2026-01-01',
  },
  {
    id: 'TGT-06',
    instrumentId: 'INST-02',
    instrumentName: 'Sysmex XN-550',
    parameterId: 'PARAM-06',
    parameterName: 'Hemoglobin',
    level: 'Level 1',
    lotNumber: 'ECHK-911',
    mean: 12.4,
    sd: 0.3,
    cv: 2.42,
    effectiveDate: '2026-01-01',
  },
  {
    id: 'TGT-07',
    instrumentId: 'INST-02',
    instrumentName: 'Sysmex XN-550',
    parameterId: 'PARAM-06',
    parameterName: 'Hemoglobin',
    level: 'Level 2',
    lotNumber: 'ECHK-912',
    mean: 16.3,
    sd: 0.4,
    cv: 2.45,
    effectiveDate: '2026-01-01',
  },
  {
    id: 'TGT-08',
    instrumentId: 'INST-04',
    instrumentName: 'Alere Afinion 2',
    parameterId: 'PARAM-09',
    parameterName: 'HbA1c',
    level: 'Level 1',
    lotNumber: 'AFN-701',
    mean: 5.6,
    sd: 0.15,
    cv: 2.68,
    effectiveDate: '2026-01-01',
  },
];

// Initial QC records (starts clean in production connected to database)
export function generateSeedQCRecords(): { records: QCRecord[]; violations: WestgardViolation[] } {
  return { records: [], violations: [] };
}

export const INITIAL_CAPA_RECORDS: CAPARecord[] = [];

export const APP_LOGO_SRC = '/src/assets/images/kayong_utara_logo_1790922384330.jpg';

class StorageService {
  private isBrowser = typeof window !== 'undefined';

  constructor() {
    this.init();
  }

  public init() {
    if (!this.isBrowser) return;

    if (!localStorage.getItem(STORAGE_KEYS.INSTRUMENTS)) {
      localStorage.setItem(STORAGE_KEYS.INSTRUMENTS, JSON.stringify(INITIAL_INSTRUMENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PARAMETERS)) {
      localStorage.setItem(STORAGE_KEYS.PARAMETERS, JSON.stringify(INITIAL_PARAMETERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CONTROL_MATERIALS)) {
      localStorage.setItem(STORAGE_KEYS.CONTROL_MATERIALS, JSON.stringify(INITIAL_CONTROL_MATERIALS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.QC_TARGETS)) {
      localStorage.setItem(STORAGE_KEYS.QC_TARGETS, JSON.stringify(INITIAL_QC_TARGETS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.WESTGARD_RULES)) {
      localStorage.setItem(STORAGE_KEYS.WESTGARD_RULES, JSON.stringify(DEFAULT_WESTGARD_RULES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_USERS[0]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUTH_SESSION)) {
      localStorage.setItem(
        STORAGE_KEYS.AUTH_SESSION,
        JSON.stringify({ isLoggedIn: true, user: INITIAL_USERS[0] })
      );
    }
    const currentProfile = localStorage.getItem(STORAGE_KEYS.LAB_PROFILE);
    if (!currentProfile || currentProfile.includes('Medika')) {
      localStorage.setItem(STORAGE_KEYS.LAB_PROFILE, JSON.stringify(INITIAL_LAB_PROFILE));
    }

    // Clean legacy demo records if any exist in local cache
    const rawQC = localStorage.getItem(STORAGE_KEYS.QC_RECORDS);
    if (!rawQC) {
      localStorage.setItem(STORAGE_KEYS.QC_RECORDS, JSON.stringify([]));
    } else {
      try {
        const records: QCRecord[] = JSON.parse(rawQC);
        const cleanRecords = records.filter((r) => !r.isDemo && !r.id.includes('DEMO'));
        localStorage.setItem(STORAGE_KEYS.QC_RECORDS, JSON.stringify(cleanRecords));
      } catch {
        localStorage.setItem(STORAGE_KEYS.QC_RECORDS, JSON.stringify([]));
      }
    }

    const rawVio = localStorage.getItem(STORAGE_KEYS.WESTGARD_VIOLATIONS);
    if (!rawVio) {
      localStorage.setItem(STORAGE_KEYS.WESTGARD_VIOLATIONS, JSON.stringify([]));
    } else {
      try {
        const violations: WestgardViolation[] = JSON.parse(rawVio);
        const cleanViolations = violations.filter((v) => !v.id.includes('DEMO'));
        localStorage.setItem(STORAGE_KEYS.WESTGARD_VIOLATIONS, JSON.stringify(cleanViolations));
      } catch {
        localStorage.setItem(STORAGE_KEYS.WESTGARD_VIOLATIONS, JSON.stringify([]));
      }
    }

    const rawCapa = localStorage.getItem(STORAGE_KEYS.CAPA_RECORDS);
    if (!rawCapa) {
      localStorage.setItem(STORAGE_KEYS.CAPA_RECORDS, JSON.stringify([]));
    } else {
      try {
        const capa: CAPARecord[] = JSON.parse(rawCapa);
        const cleanCapa = capa.filter((c) => !c.id.includes('DEMO'));
        localStorage.setItem(STORAGE_KEYS.CAPA_RECORDS, JSON.stringify(cleanCapa));
      } catch {
        localStorage.setItem(STORAGE_KEYS.CAPA_RECORDS, JSON.stringify([]));
      }
    }

    this.syncWithDatabase();
  }

  private async syncToApi(endpoint: string, method: string, data?: any) {
    if (!this.isBrowser) return;
    try {
      await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : undefined,
      });
    } catch {
      // offline / deferred
    }
  }

  public async syncWithDatabase(): Promise<void> {
    if (!this.isBrowser) return;
    try {
      const res = await fetch('/api/bootstrap');
      if (res.ok) {
        const data = await res.json();
        if (data.users?.length) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
        if (data.instruments?.length) localStorage.setItem(STORAGE_KEYS.INSTRUMENTS, JSON.stringify(data.instruments));
        if (data.parameters?.length) localStorage.setItem(STORAGE_KEYS.PARAMETERS, JSON.stringify(data.parameters));
        if (data.controlMaterials?.length) localStorage.setItem(STORAGE_KEYS.CONTROL_MATERIALS, JSON.stringify(data.controlMaterials));
        if (data.qcTargets?.length) localStorage.setItem(STORAGE_KEYS.QC_TARGETS, JSON.stringify(data.qcTargets));
        if (Array.isArray(data.qcRecords)) localStorage.setItem(STORAGE_KEYS.QC_RECORDS, JSON.stringify(data.qcRecords));
        if (Array.isArray(data.westgardViolations)) localStorage.setItem(STORAGE_KEYS.WESTGARD_VIOLATIONS, JSON.stringify(data.westgardViolations));
        if (Array.isArray(data.capaRecords)) localStorage.setItem(STORAGE_KEYS.CAPA_RECORDS, JSON.stringify(data.capaRecords));
        if (data.labProfile) localStorage.setItem(STORAGE_KEYS.LAB_PROFILE, JSON.stringify(data.labProfile));
      }
    } catch {
      // deferred
    }
  }

  // QC Records
  public getQCRecords(): QCRecord[] {
    if (!this.isBrowser) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QC_RECORDS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveQCRecord(record: QCRecord): void {
    const list = this.getQCRecords();
    list.unshift(record);
    localStorage.setItem(STORAGE_KEYS.QC_RECORDS, JSON.stringify(list));
    this.syncToApi('/api/qc-records', 'POST', record);
  }

  public updateQCRecord(updated: QCRecord): void {
    const list = this.getQCRecords().map((r) => (r.id === updated.id ? updated : r));
    localStorage.setItem(STORAGE_KEYS.QC_RECORDS, JSON.stringify(list));
    this.syncToApi('/api/qc-records', 'POST', updated);
  }

  public deleteQCRecord(id: string): void {
    const list = this.getQCRecords().filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.QC_RECORDS, JSON.stringify(list));
    this.syncToApi(`/api/qc-records/${id}`, 'DELETE');
  }

  // Westgard Violations
  public getWestgardViolations(): WestgardViolation[] {
    if (!this.isBrowser) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WESTGARD_VIOLATIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveWestgardViolation(violation: WestgardViolation): void {
    const list = this.getWestgardViolations();
    list.unshift(violation);
    localStorage.setItem(STORAGE_KEYS.WESTGARD_VIOLATIONS, JSON.stringify(list));
    this.syncToApi('/api/violations', 'POST', violation);
  }

  public updateWestgardViolation(updated: WestgardViolation): void {
    const list = this.getWestgardViolations().map((v) => (v.id === updated.id ? updated : v));
    localStorage.setItem(STORAGE_KEYS.WESTGARD_VIOLATIONS, JSON.stringify(list));
    this.syncToApi('/api/violations', 'POST', updated);
  }

  public deleteWestgardViolation(id: string): void {
    const list = this.getWestgardViolations().filter((v) => v.id !== id);
    localStorage.setItem(STORAGE_KEYS.WESTGARD_VIOLATIONS, JSON.stringify(list));
    this.syncToApi(`/api/violations/${id}`, 'DELETE');
  }

  // CAPA Records
  public getCAPARecords(): CAPARecord[] {
    if (!this.isBrowser) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CAPA_RECORDS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveCAPARecord(capa: CAPARecord): void {
    const list = this.getCAPARecords();
    list.unshift(capa);
    localStorage.setItem(STORAGE_KEYS.CAPA_RECORDS, JSON.stringify(list));
    this.syncToApi('/api/capa', 'POST', capa);
  }

  public updateCAPARecord(updated: CAPARecord): void {
    const list = this.getCAPARecords().map((c) => (c.id === updated.id ? updated : c));
    localStorage.setItem(STORAGE_KEYS.CAPA_RECORDS, JSON.stringify(list));
    this.syncToApi('/api/capa', 'POST', updated);
  }

  public deleteCAPARecord(id: string): void {
    const list = this.getCAPARecords().filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CAPA_RECORDS, JSON.stringify(list));
    this.syncToApi(`/api/capa/${id}`, 'DELETE');
  }

  // Master Instruments
  public getInstruments(): Instrument[] {
    if (!this.isBrowser) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INSTRUMENTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveInstrument(inst: Instrument): void {
    const list = this.getInstruments();
    const existingIdx = list.findIndex((i) => i.id === inst.id);
    if (existingIdx >= 0) {
      list[existingIdx] = inst;
    } else {
      list.push(inst);
    }
    localStorage.setItem(STORAGE_KEYS.INSTRUMENTS, JSON.stringify(list));
    this.syncToApi('/api/instruments', 'POST', inst);
  }

  public deleteInstrument(id: string): void {
    const list = this.getInstruments().filter((i) => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.INSTRUMENTS, JSON.stringify(list));
    this.syncToApi(`/api/instruments/${id}`, 'DELETE');
  }

  // Master Parameters
  public getParameters(): Parameter[] {
    if (!this.isBrowser) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PARAMETERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveParameter(param: Parameter): void {
    const list = this.getParameters();
    const existingIdx = list.findIndex((p) => p.id === param.id);
    if (existingIdx >= 0) {
      list[existingIdx] = param;
    } else {
      list.push(param);
    }
    localStorage.setItem(STORAGE_KEYS.PARAMETERS, JSON.stringify(list));
    this.syncToApi('/api/parameters', 'POST', param);
  }

  public deleteParameter(id: string): void {
    const list = this.getParameters().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.PARAMETERS, JSON.stringify(list));
    this.syncToApi(`/api/parameters/${id}`, 'DELETE');
  }

  // Master Control Materials
  public getControlMaterials(): ControlMaterial[] {
    if (!this.isBrowser) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONTROL_MATERIALS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveControlMaterial(ctrl: ControlMaterial): void {
    const list = this.getControlMaterials();
    const existingIdx = list.findIndex((c) => c.id === ctrl.id);
    if (existingIdx >= 0) {
      list[existingIdx] = ctrl;
    } else {
      list.push(ctrl);
    }
    localStorage.setItem(STORAGE_KEYS.CONTROL_MATERIALS, JSON.stringify(list));
    this.syncToApi('/api/controls', 'POST', ctrl);
  }

  public deleteControlMaterial(id: string): void {
    const list = this.getControlMaterials().filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CONTROL_MATERIALS, JSON.stringify(list));
    this.syncToApi(`/api/controls/${id}`, 'DELETE');
  }

  // Master QC Targets
  public getQCTargets(): QCTarget[] {
    if (!this.isBrowser) return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QC_TARGETS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public saveQCTarget(tgt: QCTarget): void {
    const list = this.getQCTargets();
    const existingIdx = list.findIndex((t) => t.id === tgt.id);
    if (existingIdx >= 0) {
      list[existingIdx] = tgt;
    } else {
      list.push(tgt);
    }
    localStorage.setItem(STORAGE_KEYS.QC_TARGETS, JSON.stringify(list));
    this.syncToApi('/api/targets', 'POST', tgt);
  }

  public deleteQCTarget(id: string): void {
    const list = this.getQCTargets().filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.QC_TARGETS, JSON.stringify(list));
    this.syncToApi(`/api/targets/${id}`, 'DELETE');
  }

  // Westgard Rules Config
  public getWestgardRules(): WestgardRuleDefinition[] {
    if (!this.isBrowser) return DEFAULT_WESTGARD_RULES;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WESTGARD_RULES);
      return data ? JSON.parse(data) : DEFAULT_WESTGARD_RULES;
    } catch {
      return DEFAULT_WESTGARD_RULES;
    }
  }

  public saveWestgardRules(rules: WestgardRuleDefinition[]): void {
    localStorage.setItem(STORAGE_KEYS.WESTGARD_RULES, JSON.stringify(rules));
  }

  // User Management
  public getUsers(): User[] {
    if (!this.isBrowser) return INITIAL_USERS;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      return data ? JSON.parse(data) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  }

  public saveUser(user: User): void {
    const list = this.getUsers();
    const idx = list.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      list[idx] = user;
    } else {
      list.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(list));
    this.syncToApi('/api/users', 'POST', user);

    // If updating currently logged in user, synchronize session
    const current = this.getCurrentUser();
    if (current && current.id === user.id) {
      this.setCurrentUser(user);
    }
  }

  public deleteUser(id: string): void {
    const list = this.getUsers().filter((u) => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(list));
    this.syncToApi(`/api/users/${id}`, 'DELETE');
  }

  // Authentication
  public authenticate(username: string, password: string): User | null {
    const list = this.getUsers();
    const user = list.find(
      (u) =>
        (u.username.toLowerCase() === username.trim().toLowerCase() || u.nip === username.trim()) &&
        u.password === password
    );
    if (user && user.status === 'Aktif') {
      this.login(user);
      return user;
    }
    return null;
  }

  public login(user: User): void {
    if (!this.isBrowser) return;
    localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify({ isLoggedIn: true, user }));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }

  public logout(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  public isLoggedIn(): boolean {
    if (!this.isBrowser) return true;
    try {
      const session = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      if (!session) return false;
      const parsed = JSON.parse(session);
      return Boolean(parsed.isLoggedIn && parsed.user);
    } catch {
      return false;
    }
  }

  // Current User
  public getCurrentUser(): User {
    if (!this.isBrowser) return INITIAL_USERS[0];
    try {
      const session = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed.user) return parsed.user;
      }
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : INITIAL_USERS[0];
    } catch {
      return INITIAL_USERS[0];
    }
  }

  public setCurrentUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify({ isLoggedIn: true, user }));
    }
  }

  // Lab Profile
  public getLabProfile(): LabProfile {
    if (!this.isBrowser) return INITIAL_LAB_PROFILE;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LAB_PROFILE);
      return data ? JSON.parse(data) : INITIAL_LAB_PROFILE;
    } catch {
      return INITIAL_LAB_PROFILE;
    }
  }

  public saveLabProfile(profile: LabProfile): void {
    localStorage.setItem(STORAGE_KEYS.LAB_PROFILE, JSON.stringify(profile));
    this.syncToApi('/api/profile', 'POST', profile);
  }

  // Bersihkan Cache Lokal & Sinkronkan Ulang dari Database
  public resetToDemo(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(STORAGE_KEYS.QC_RECORDS);
    localStorage.removeItem(STORAGE_KEYS.WESTGARD_VIOLATIONS);
    localStorage.removeItem(STORAGE_KEYS.CAPA_RECORDS);
    this.init();
    this.syncWithDatabase();
  }

  public clearLocalCacheAndResync(): Promise<void> {
    if (!this.isBrowser) return Promise.resolve();
    localStorage.removeItem(STORAGE_KEYS.QC_RECORDS);
    localStorage.removeItem(STORAGE_KEYS.WESTGARD_VIOLATIONS);
    localStorage.removeItem(STORAGE_KEYS.CAPA_RECORDS);
    this.init();
    return this.syncWithDatabase();
  }

  public exportBackup(): string {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      instruments: this.getInstruments(),
      parameters: this.getParameters(),
      controlMaterials: this.getControlMaterials(),
      qcTargets: this.getQCTargets(),
      qcRecords: this.getQCRecords(),
      westgardViolations: this.getWestgardViolations(),
      capaRecords: this.getCAPARecords(),
      westgardRules: this.getWestgardRules(),
      labProfile: this.getLabProfile(),
    };
    return JSON.stringify(backup, null, 2);
  }

  public importBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.qcRecords) localStorage.setItem(STORAGE_KEYS.QC_RECORDS, JSON.stringify(data.qcRecords));
      if (data.instruments) localStorage.setItem(STORAGE_KEYS.INSTRUMENTS, JSON.stringify(data.instruments));
      if (data.parameters) localStorage.setItem(STORAGE_KEYS.PARAMETERS, JSON.stringify(data.parameters));
      if (data.controlMaterials) localStorage.setItem(STORAGE_KEYS.CONTROL_MATERIALS, JSON.stringify(data.controlMaterials));
      if (data.qcTargets) localStorage.setItem(STORAGE_KEYS.QC_TARGETS, JSON.stringify(data.qcTargets));
      if (data.westgardViolations) localStorage.setItem(STORAGE_KEYS.WESTGARD_VIOLATIONS, JSON.stringify(data.westgardViolations));
      if (data.capaRecords) localStorage.setItem(STORAGE_KEYS.CAPA_RECORDS, JSON.stringify(data.capaRecords));
      if (data.westgardRules) localStorage.setItem(STORAGE_KEYS.WESTGARD_RULES, JSON.stringify(data.westgardRules));
      if (data.labProfile) localStorage.setItem(STORAGE_KEYS.LAB_PROFILE, JSON.stringify(data.labProfile));
      return true;
    } catch (e) {
      console.error('Import error', e);
      return false;
    }
  }
}

export const storage = new StorageService();
