import { pgTable, text, boolean, doublePrecision } from 'drizzle-orm/pg-core';

// Users / Hak Akses Pengguna
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  uid: text('uid').unique(),
  name: text('name').notNull(),
  username: text('username').notNull().unique(),
  password: text('password'),
  role: text('role').notNull(), // 'analis' | 'sppk' | 'admin' | 'supervisor'
  roleLabel: text('role_label').notNull(),
  nip: text('nip').notNull(),
  status: text('status').notNull().default('Aktif'), // 'Aktif' | 'Nonaktif'
  email: text('email'),
  phone: text('phone'),
  avatar: text('avatar'),
  createdAt: text('created_at'),
});

// Instruments / Master Alat
export const instruments = pgTable('instruments', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  brand: text('brand').notNull(),
  model: text('model').notNull(),
  serialNumber: text('serial_number').notNull(),
  location: text('location').notNull(),
  status: text('status').notNull().default('Aktif'), // 'Aktif' | 'Maintenance' | 'Nonaktif'
  createdAt: text('created_at'),
});

// Parameters / Master Parameter
export const parameters = pgTable('parameters', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  unit: text('unit').notNull(),
  instrumentId: text('instrument_id').notNull(),
  instrumentName: text('instrument_name').notNull(),
  method: text('method').notNull(),
  clinicalSignificance: text('clinical_significance'),
});

// Control Materials / Master Bahan Kontrol
export const controlMaterials = pgTable('control_materials', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  manufacturer: text('manufacturer').notNull(),
  lotNumber: text('lot_number').notNull(),
  level: text('level').notNull(), // 'Level 1' | 'Level 2' | 'Level 3'
  expirationDate: text('expiration_date').notNull(),
  status: text('status').notNull().default('Aktif'), // 'Aktif' | 'Kedaluwarsa'
});

// QC Targets / Master Nilai Target QC
export const qcTargets = pgTable('qc_targets', {
  id: text('id').primaryKey(),
  instrumentId: text('instrument_id').notNull(),
  instrumentName: text('instrument_name').notNull(),
  parameterId: text('parameter_id').notNull(),
  parameterName: text('parameter_name').notNull(),
  level: text('level').notNull(), // 'Level 1' | 'Level 2' | 'Level 3'
  lotNumber: text('lot_number').notNull(),
  mean: doublePrecision('mean').notNull(),
  sd: doublePrecision('sd').notNull(),
  cv: doublePrecision('cv').notNull(),
  effectiveDate: text('effective_date').notNull(),
});

// QC Records / Riwayat Pemeriksaan QC Harian
export const qcRecords = pgTable('qc_records', {
  id: text('id').primaryKey(),
  date: text('date').notNull(), // YYYY-MM-DD
  time: text('time').notNull(), // HH:mm
  officerId: text('officer_id').notNull(),
  officerName: text('officer_name').notNull(),
  instrumentId: text('instrument_id').notNull(),
  instrumentName: text('instrument_name').notNull(),
  parameterId: text('parameter_id').notNull(),
  parameterName: text('parameter_name').notNull(),
  unit: text('unit').notNull(),
  level: text('level').notNull(),
  lotNumber: text('lot_number').notNull(),
  resultValue: doublePrecision('result_value').notNull(),
  targetMean: doublePrecision('target_mean').notNull(),
  targetSd: doublePrecision('target_sd').notNull(),
  targetCv: doublePrecision('target_cv').notNull(),
  zScore: doublePrecision('z_score').notNull(),
  status: text('status').notNull(), // 'PASS' | 'WARNING' | 'REJECT'
  notes: text('notes'),
  violationRules: text('violation_rules'), // JSON string array
  violationDetails: text('violation_details'),
  isDemo: boolean('is_demo').default(false),
  auditTrail: text('audit_trail'), // JSON string of QCAuditLog[]
  createdAt: text('created_at'),
});

// Westgard Violations / Pelanggaran Westgard
export const westgardViolations = pgTable('westgard_violations', {
  id: text('id').primaryKey(),
  qcRecordId: text('qc_record_id').notNull(),
  date: text('date').notNull(),
  time: text('time').notNull(),
  instrumentName: text('instrument_name').notNull(),
  parameterName: text('parameter_name').notNull(),
  level: text('level').notNull(),
  lotNumber: text('lot_number').notNull(),
  resultValue: doublePrecision('result_value').notNull(),
  zScore: doublePrecision('z_score').notNull(),
  targetMean: doublePrecision('target_mean').notNull(),
  targetSd: doublePrecision('target_sd').notNull(),
  ruleId: text('rule_id').notNull(),
  ruleName: text('rule_name').notNull(),
  severity: text('severity').notNull(), // 'WARNING' | 'REJECT'
  errorType: text('error_type').notNull(), // 'Random' | 'Systematic'
  sopRecommendation: text('sop_recommendation').notNull(),
  status: text('status').notNull().default('Belum Ditindaklanjuti'), // 'Belum Ditindaklanjuti' | 'Dalam CAPA' | 'Selesai'
  linkedCapaId: text('linked_capa_id'),
  actionNotes: text('action_notes'),
  resolvedAt: text('resolved_at'),
  resolvedBy: text('resolved_by'),
});

// CAPA Records / Tindakan Korektif & Pencegahan
export const capaRecords = pgTable('capa_records', {
  id: text('id').primaryKey(),
  capaNumber: text('capa_number').notNull(),
  date: text('date').notNull(),
  problemSource: text('problem_source').notNull(),
  instrumentName: text('instrument_name').notNull(),
  parameterName: text('parameter_name').notNull(),
  violationType: text('violation_type').notNull(),
  violationId: text('violation_id'),
  qcRecordId: text('qc_record_id'),
  problemDescription: text('problem_description').notNull(),
  rootCauseAnalysis: text('root_cause_analysis').notNull(),
  correctiveAction: text('corrective_action').notNull(),
  preventiveAction: text('preventive_action').notNull(),
  pic: text('pic').notNull(),
  targetDate: text('target_date').notNull(),
  verificationResult: text('verification_result'),
  verifiedBy: text('verified_by'),
  verifiedAt: text('verified_at'),
  status: text('status').notNull().default('Open'), // 'Open' | 'Dalam Proses' | 'Menunggu Verifikasi' | 'Closed'
  isOverdue: boolean('is_overdue').default(false),
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
});

// Lab Profile / Profil Laboratorium RSUD Sultan Muhammad Jamaludin I
export const labProfile = pgTable('lab_profile', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  institution: text('institution').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  licenseNumber: text('license_number').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  headOfLab: text('head_of_lab').notNull(),
  headOfLabTitle: text('head_of_lab_title').notNull(),
});
