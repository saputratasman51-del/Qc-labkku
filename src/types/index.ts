export type Role = 'analis' | 'sppk' | 'admin' | 'supervisor';

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: Role;
  roleLabel: string;
  nip: string;
  status: 'Aktif' | 'Nonaktif';
  avatar?: string;
  email?: string;
  phone?: string;
  createdAt?: string;
}

export interface Instrument {
  id: string;
  name: string;
  brand: string;
  model: string;
  serialNumber: string;
  location: string;
  status: 'Aktif' | 'Maintenance' | 'Nonaktif';
  createdAt: string;
}

export interface Parameter {
  id: string;
  name: string;
  code: string;
  unit: string;
  instrumentId: string;
  instrumentName: string;
  method: string;
  clinicalSignificance?: string;
}

export interface ControlMaterial {
  id: string;
  name: string;
  manufacturer: string;
  lotNumber: string;
  level: 'Level 1' | 'Level 2' | 'Level 3';
  expirationDate: string;
  status: 'Aktif' | 'Kedaluwarsa';
}

export interface QCTarget {
  id: string;
  instrumentId: string;
  instrumentName: string;
  parameterId: string;
  parameterName: string;
  level: 'Level 1' | 'Level 2' | 'Level 3';
  lotNumber: string;
  mean: number;
  sd: number;
  cv: number; // CV% = (sd / mean) * 100
  effectiveDate: string;
}

export type QCStatus = 'PASS' | 'WARNING' | 'REJECT';

export interface QCAuditLog {
  timestamp: string;
  modifiedBy: string;
  oldValue: number;
  newValue: number;
  reason: string;
}

export interface QCRecord {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  officerId: string;
  officerName: string;
  instrumentId: string;
  instrumentName: string;
  parameterId: string;
  parameterName: string;
  unit: string;
  level: 'Level 1' | 'Level 2' | 'Level 3';
  lotNumber: string;
  resultValue: number;
  targetMean: number;
  targetSd: number;
  targetCv: number;
  zScore: number;
  status: QCStatus;
  notes: string;
  violationRules?: string[];
  violationDetails?: string;
  isDemo?: boolean;
  auditTrail?: QCAuditLog[];
  createdAt: string;
}

export interface WestgardRuleDefinition {
  id: string; // '1-2s' | '1-3s' | '2-2s' | 'R-4s' | '4-1s' | '10x'
  name: string;
  description: string;
  severity: 'WARNING' | 'REJECT';
  errorType: 'Random' | 'Systematic';
  sopRecommendation: string;
  enabled: boolean;
}

export interface WestgardViolation {
  id: string;
  qcRecordId: string;
  date: string;
  time: string;
  instrumentName: string;
  parameterName: string;
  level: 'Level 1' | 'Level 2' | 'Level 3';
  lotNumber: string;
  resultValue: number;
  zScore: number;
  targetMean: number;
  targetSd: number;
  ruleId: string;
  ruleName: string;
  severity: 'WARNING' | 'REJECT';
  errorType: 'Random' | 'Systematic';
  sopRecommendation: string;
  status: 'Belum Ditindaklanjuti' | 'Dalam CAPA' | 'Selesai';
  linkedCapaId?: string;
  actionNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export type CAPAStatus = 'Open' | 'Dalam Proses' | 'Menunggu Verifikasi' | 'Closed';

export interface CAPARecord {
  id: string;
  capaNumber: string; // e.g. CAPA-2026-001
  date: string; // YYYY-MM-DD
  problemSource: string; // Pelanggaran Westgard, Kalibrasi Gagal, Reagen Rusak, dll
  instrumentName: string;
  parameterName: string;
  violationType: string;
  violationId?: string;
  qcRecordId?: string;
  problemDescription: string;
  rootCauseAnalysis: string; // 5 Whys / Man, Machine, Method, Material
  correctiveAction: string; // Tindakan penanggulangan langsung
  preventiveAction: string; // Tindakan pencegahan agar tidak berulang
  pic: string; // Person In Charge
  targetDate: string; // Due date
  verificationResult?: string; // Hasil evaluasi efektivitas
  verifiedBy?: string;
  verifiedAt?: string;
  status: CAPAStatus;
  isOverdue?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LabProfile {
  name: string;
  institution: string;
  address: string;
  city: string;
  licenseNumber: string;
  phone: string;
  email: string;
  headOfLab: string;
  headOfLabTitle: string;
}
