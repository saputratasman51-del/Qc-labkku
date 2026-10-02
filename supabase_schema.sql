-- ==============================================================================
-- SISTEM KONTROL MUTU LABORATORIUM (QC & WESTGARD RULES)
-- RSUD SULTAN MUHAMMAD JAMALUDIN I - KABUPATEN KAYONG UTARA
-- Supabase PostgreSQL Complete Migration & Schema DDL Script
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TRIGGER FUNCTION: UPDATED_AT TIMESTAMP
-- ==============================================================================
CREATE OR REPLACE FUNCTION set_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 3. TABLES DDL
-- ==============================================================================

-- 3.1 Profil Laboratorium
CREATE TABLE IF NOT EXISTS public.lab_profile (
    id TEXT PRIMARY KEY DEFAULT 'LAB-SMJ1',
    name TEXT NOT NULL DEFAULT 'Laboratorium Patologi Klinik',
    institution TEXT NOT NULL DEFAULT 'RSUD Sultan Muhammad Jamaludin I',
    address TEXT NOT NULL DEFAULT 'Jalan Provinsi, Sukadana',
    city TEXT NOT NULL DEFAULT 'Kayong Utara, Kode Pos 78852',
    license_number TEXT NOT NULL DEFAULT 'No. 445/012-DINKES/SMJ1/2024',
    phone TEXT NOT NULL DEFAULT '(0534) 771-0022 / Ext. 115',
    email TEXT NOT NULL DEFAULT 'lab.rsudsmj1@kayongutarakab.go.id',
    head_of_lab TEXT NOT NULL DEFAULT 'dr. Maya Andriani, Sp.PK',
    head_of_lab_title TEXT NOT NULL DEFAULT 'Dokter Spesialis Patologi Klinik',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 Pengguna & Hak Akses (ATLM, Sp.PK, Admin, Supervisor)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY DEFAULT 'USR-' || substr(md5(random()::text), 1, 8),
    uid UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    role TEXT NOT NULL CHECK (role IN ('analis', 'sppk', 'admin', 'supervisor')),
    role_label TEXT NOT NULL DEFAULT 'Ahli Teknologi Laboratorium Medik (ATLM)',
    nip TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Nonaktif')),
    email TEXT,
    phone TEXT,
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.3 Master Alat Laboratorium (Instruments)
CREATE TABLE IF NOT EXISTS public.instruments (
    id TEXT PRIMARY KEY DEFAULT 'INST-' || substr(md5(random()::text), 1, 8),
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    serial_number TEXT NOT NULL,
    location TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Maintenance', 'Nonaktif')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.4 Master Parameter Pemeriksaan
CREATE TABLE IF NOT EXISTS public.parameters (
    id TEXT PRIMARY KEY DEFAULT 'PARAM-' || substr(md5(random()::text), 1, 8),
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    unit TEXT NOT NULL,
    instrument_id TEXT REFERENCES public.instruments(id) ON DELETE CASCADE,
    instrument_name TEXT NOT NULL,
    method TEXT NOT NULL,
    clinical_significance TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.5 Master Bahan Kontrol (Control Materials)
CREATE TABLE IF NOT EXISTS public.control_materials (
    id TEXT PRIMARY KEY DEFAULT 'CTRL-' || substr(md5(random()::text), 1, 8),
    name TEXT NOT NULL,
    manufacturer TEXT NOT NULL,
    lot_number TEXT NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('Level 1', 'Level 2', 'Level 3')),
    expiration_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Kedaluwarsa')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.6 Master Nilai Target QC (Mean, SD, CV%)
CREATE TABLE IF NOT EXISTS public.qc_targets (
    id TEXT PRIMARY KEY DEFAULT 'TGT-' || substr(md5(random()::text), 1, 8),
    instrument_id TEXT REFERENCES public.instruments(id) ON DELETE CASCADE,
    instrument_name TEXT NOT NULL,
    parameter_id TEXT REFERENCES public.parameters(id) ON DELETE CASCADE,
    parameter_name TEXT NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('Level 1', 'Level 2', 'Level 3')),
    lot_number TEXT NOT NULL,
    mean DOUBLE PRECISION NOT NULL,
    sd DOUBLE PRECISION NOT NULL,
    cv DOUBLE PRECISION NOT NULL,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.7 Aturan Westgard (Westgard Rules Definition)
CREATE TABLE IF NOT EXISTS public.westgard_rules (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    error_type TEXT NOT NULL CHECK (error_type IN ('Random', 'Systematic', 'Warning')),
    severity TEXT NOT NULL CHECK (severity IN ('WARNING', 'REJECT')),
    sop_recommendation TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.8 Riwayat Pemeriksaan QC Harian (QC Records)
CREATE TABLE IF NOT EXISTS public.qc_records (
    id TEXT PRIMARY KEY DEFAULT 'QC-' || to_char(NOW(), 'YYYYMMDD') || '-' || substr(md5(random()::text), 1, 6),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time TEXT NOT NULL DEFAULT to_char(NOW(), 'HH24:MI'),
    officer_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    officer_name TEXT NOT NULL,
    instrument_id TEXT REFERENCES public.instruments(id) ON DELETE CASCADE,
    instrument_name TEXT NOT NULL,
    parameter_id TEXT REFERENCES public.parameters(id) ON DELETE CASCADE,
    parameter_name TEXT NOT NULL,
    unit TEXT NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('Level 1', 'Level 2', 'Level 3')),
    lot_number TEXT NOT NULL,
    result_value DOUBLE PRECISION NOT NULL,
    target_mean DOUBLE PRECISION NOT NULL,
    target_sd DOUBLE PRECISION NOT NULL,
    target_cv DOUBLE PRECISION NOT NULL,
    z_score DOUBLE PRECISION NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PASS', 'WARNING', 'REJECT')),
    notes TEXT,
    violation_rules JSONB DEFAULT '[]'::jsonb,
    violation_details TEXT,
    is_demo BOOLEAN DEFAULT false,
    audit_trail JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.9 Pelanggaran Aturan Westgard (Westgard Violations)
CREATE TABLE IF NOT EXISTS public.westgard_violations (
    id TEXT PRIMARY KEY DEFAULT 'VIOL-' || substr(md5(random()::text), 1, 8),
    qc_record_id TEXT REFERENCES public.qc_records(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    instrument_name TEXT NOT NULL,
    parameter_name TEXT NOT NULL,
    level TEXT NOT NULL,
    lot_number TEXT NOT NULL,
    result_value DOUBLE PRECISION NOT NULL,
    z_score DOUBLE PRECISION NOT NULL,
    target_mean DOUBLE PRECISION NOT NULL,
    target_sd DOUBLE PRECISION NOT NULL,
    rule_id TEXT NOT NULL,
    rule_name TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('WARNING', 'REJECT')),
    error_type TEXT NOT NULL CHECK (error_type IN ('Random', 'Systematic')),
    sop_recommendation TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Belum Ditindaklanjuti' CHECK (status IN ('Belum Ditindaklanjuti', 'Dalam CAPA', 'Selesai')),
    linked_capa_id TEXT,
    action_notes TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.10 Tindakan Korektif dan Pencegahan (CAPA Records)
CREATE TABLE IF NOT EXISTS public.capa_records (
    id TEXT PRIMARY KEY DEFAULT 'CAPA-' || to_char(NOW(), 'YYYY') || '-' || substr(md5(random()::text), 1, 6),
    capa_number TEXT NOT NULL UNIQUE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    problem_source TEXT NOT NULL,
    instrument_name TEXT NOT NULL,
    parameter_name TEXT NOT NULL,
    violation_type TEXT NOT NULL,
    violation_id TEXT REFERENCES public.westgard_violations(id) ON DELETE SET NULL,
    qc_record_id TEXT REFERENCES public.qc_records(id) ON DELETE SET NULL,
    problem_description TEXT NOT NULL,
    root_cause_analysis TEXT NOT NULL,
    corrective_action TEXT NOT NULL,
    preventive_action TEXT NOT NULL,
    pic TEXT NOT NULL,
    target_date DATE NOT NULL,
    verification_result TEXT,
    verified_by TEXT,
    verified_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Dalam Proses', 'Menunggu Verifikasi', 'Closed')),
    is_overdue BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. TRIGGERS UNTUK UPDATED_AT
-- ==============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_lab_profile') THEN
        CREATE TRIGGER set_updated_at_lab_profile BEFORE UPDATE ON public.lab_profile FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_users') THEN
        CREATE TRIGGER set_updated_at_users BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_instruments') THEN
        CREATE TRIGGER set_updated_at_instruments BEFORE UPDATE ON public.instruments FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_parameters') THEN
        CREATE TRIGGER set_updated_at_parameters BEFORE UPDATE ON public.parameters FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_control_materials') THEN
        CREATE TRIGGER set_updated_at_control_materials BEFORE UPDATE ON public.control_materials FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_qc_targets') THEN
        CREATE TRIGGER set_updated_at_qc_targets BEFORE UPDATE ON public.qc_targets FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_qc_records') THEN
        CREATE TRIGGER set_updated_at_qc_records BEFORE UPDATE ON public.qc_records FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_westgard_violations') THEN
        CREATE TRIGGER set_updated_at_westgard_violations BEFORE UPDATE ON public.westgard_violations FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_capa_records') THEN
        CREATE TRIGGER set_updated_at_capa_records BEFORE UPDATE ON public.capa_records FOR EACH ROW EXECUTE FUNCTION set_updated_at_column();
    END IF;
END $$;

-- ==============================================================================
-- 5. INDEXES UNTUK PERFORMA QUERY CEPAT
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_qc_records_date ON public.qc_records (date DESC);
CREATE INDEX IF NOT EXISTS idx_qc_records_param_date ON public.qc_records (parameter_id, date);
CREATE INDEX IF NOT EXISTS idx_qc_records_inst_date ON public.qc_records (instrument_id, date);
CREATE INDEX IF NOT EXISTS idx_qc_records_status ON public.qc_records (status);
CREATE INDEX IF NOT EXISTS idx_violations_status ON public.westgard_violations (status);
CREATE INDEX IF NOT EXISTS idx_capa_status ON public.capa_records (status);
CREATE INDEX IF NOT EXISTS idx_capa_target_date ON public.capa_records (target_date);

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.lab_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.control_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qc_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.westgard_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qc_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.westgard_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capa_records ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses Penuh untuk Pengguna Terotentikasi & Anon (Aplikasi Terhubung)
CREATE POLICY "Allow public read access to lab_profile" ON public.lab_profile FOR SELECT USING (true);
CREATE POLICY "Allow write access to lab_profile" ON public.lab_profile FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access to users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow write access to users" ON public.users FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access to instruments" ON public.instruments FOR SELECT USING (true);
CREATE POLICY "Allow write access to instruments" ON public.instruments FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access to parameters" ON public.parameters FOR SELECT USING (true);
CREATE POLICY "Allow write access to parameters" ON public.parameters FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access to control_materials" ON public.control_materials FOR SELECT USING (true);
CREATE POLICY "Allow write access to control_materials" ON public.control_materials FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access to qc_targets" ON public.qc_targets FOR SELECT USING (true);
CREATE POLICY "Allow write access to qc_targets" ON public.qc_targets FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access to westgard_rules" ON public.westgard_rules FOR SELECT USING (true);
CREATE POLICY "Allow write access to westgard_rules" ON public.westgard_rules FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access to qc_records" ON public.qc_records FOR SELECT USING (true);
CREATE POLICY "Allow write access to qc_records" ON public.qc_records FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access to westgard_violations" ON public.westgard_violations FOR SELECT USING (true);
CREATE POLICY "Allow write access to westgard_violations" ON public.westgard_violations FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access to capa_records" ON public.capa_records FOR SELECT USING (true);
CREATE POLICY "Allow write access to capa_records" ON public.capa_records FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 7. SEED DATA LENGKAP: RSUD SULTAN MUHAMMAD JAMALUDIN I
-- ==============================================================================

-- 7.1 Profil Laboratorium
INSERT INTO public.lab_profile (id, name, institution, address, city, license_number, phone, email, head_of_lab, head_of_lab_title)
VALUES (
    'LAB-SMJ1',
    'Laboratorium Patologi Klinik',
    'RSUD Sultan Muhammad Jamaludin I',
    'Jalan Provinsi, Sukadana',
    'Kayong Utara, Kode Pos 78852',
    'No. 445/012-DINKES/SMJ1/2024',
    '(0534) 771-0022 / Ext. 115',
    'lab.rsudsmj1@kayongutarakab.go.id',
    'dr. Maya Andriani, Sp.PK',
    'Dokter Spesialis Patologi Klinik'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    institution = EXCLUDED.institution,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    license_number = EXCLUDED.license_number,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    head_of_lab = EXCLUDED.head_of_lab,
    head_of_lab_title = EXCLUDED.head_of_lab_title;

-- 7.2 Pengguna Awal (ATLM, Sp.PK, Admin)
INSERT INTO public.users (id, name, username, password_hash, role, role_label, nip, status, email, phone)
VALUES
(
    'USR-01',
    'Rudi Kurniawan, A.Md.AK',
    'rudi',
    'password123',
    'analis',
    'Ahli Teknologi Laboratorium Medik (ATLM)',
    '199203152015031002',
    'Aktif',
    'rudi.kurniawan@kayongutarakab.go.id',
    '0812-3456-7890'
),
(
    'USR-02',
    'dr. Maya Andriani, Sp.PK',
    'maya',
    'password123',
    'sppk',
    'Penanggung Jawab Lab / Sp.PK',
    '198407222010122001',
    'Aktif',
    'dr.maya.sppk@kayongutarakab.go.id',
    '0811-9876-5432'
),
(
    'USR-03',
    'Siti Rahma, S.Kom',
    'admin',
    'admin123',
    'admin',
    'Administrator Sistem',
    '199511042019022003',
    'Aktif',
    'admin.labsmj1@kayongutarakab.go.id',
    '0857-1122-3344'
)
ON CONFLICT (username) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    role_label = EXCLUDED.role_label,
    nip = EXCLUDED.nip,
    status = EXCLUDED.status,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone;

-- 7.3 Master Alat Laboratorium
INSERT INTO public.instruments (id, name, brand, model, serial_number, location, status)
VALUES
(
    'INST-01',
    'Cobas c311',
    'Roche Diagnostics',
    'c311 Clinical Chemistry Analyzer',
    'COB-984210',
    'Lab Kimia Klinik - Ruang 102',
    'Aktif'
),
(
    'INST-02',
    'Sysmex XN-550',
    'Sysmex Corporation',
    'XN-550 5-Diff Hematology Analyzer',
    'SYX-331045',
    'Lab Hematologi - Ruang 104',
    'Aktif'
),
(
    'INST-03',
    'Mindray BS-240',
    'Mindray Medical',
    'BS-240 Automatic Chemistry',
    'MND-774912',
    'Lab Kimia Klinik 2 - Ruang 103',
    'Aktif'
),
(
    'INST-04',
    'Alere Afinion 2',
    'Abbott Diagnostics',
    'Afinion 2 Point of Care Analyzer',
    'AFN-110294',
    'Lab POC / Rawat Jalan',
    'Aktif'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    brand = EXCLUDED.brand,
    model = EXCLUDED.model,
    serial_number = EXCLUDED.serial_number,
    location = EXCLUDED.location,
    status = EXCLUDED.status;

-- 7.4 Master Parameter Pemeriksaan
INSERT INTO public.parameters (id, name, code, unit, instrument_id, instrument_name, method, clinical_significance)
VALUES
(
    'PARAM-01',
    'Glukosa Darah',
    'GLU',
    'mg/dL',
    'INST-01',
    'Cobas c311',
    'Enzymatic Hexokinase',
    'Diagnosis & pemantauan diabetes melitus'
),
(
    'PARAM-02',
    'Kolesterol Total',
    'CHOL',
    'mg/dL',
    'INST-01',
    'Cobas c311',
    'CHOD-PAP Enzymatic',
    'Penilaian risiko kardiovaskular & profil lipid'
),
(
    'PARAM-03',
    'Trigliserida',
    'TG',
    'mg/dL',
    'INST-01',
    'Cobas c311',
    'GPO-PAP Colorimetric',
    'Evaluasi metabolisme lemak'
),
(
    'PARAM-04',
    'SGOT (AST)',
    'SGOT',
    'U/L',
    'INST-01',
    'Cobas c311',
    'IFCC without pyridoxal phosphate',
    'Evaluasi fungsi hati dan nekrosis sel hepatoseluler'
),
(
    'PARAM-05',
    'SGPT (ALT)',
    'SGPT',
    'U/L',
    'INST-01',
    'Cobas c311',
    'IFCC without pyridoxal phosphate',
    'Indikator spesifik peradangan hepar akut & kronis'
),
(
    'PARAM-06',
    'Ureum',
    'UREA',
    'mg/dL',
    'INST-01',
    'Cobas c311',
    'Urease GLDH UV Kinetic',
    'Pemeriksaan fungsi ginjal & metabolisme protein'
),
(
    'PARAM-07',
    'Kreatinin',
    'CREA',
    'mg/dL',
    'INST-01',
    'Cobas c311',
    'Jaffe rate-blanked and compensated',
    'Penanda laju filtrasi glomerulus (eGFR)'
),
(
    'PARAM-08',
    'Hemoglobin (Hb)',
    'HGB',
    'g/dL',
    'INST-02',
    'Sysmex XN-550',
    'SLS-Hemoglobin (Cyanide-free)',
    'Diagnosis anemia, polisitemia, dan evaluasi perdarahan'
),
(
    'PARAM-09',
    'Leukosit (WBC)',
    'WBC',
    '10^3/µL',
    'INST-02',
    'Sysmex XN-550',
    'Flow Cytometry Semiconductor Laser',
    'Deteksi infeksi, inflamasi, dan leukemia'
),
(
    'PARAM-10',
    'Trombosit (PLT)',
    'PLT',
    '10^3/µL',
    'INST-02',
    'Sysmex XN-550',
    'Hydrodynamic Focusing DC Detection',
    'Penilaian hemostasis primer, DHF, dan trombositopenia'
),
(
    'PARAM-11',
    'HbA1c',
    'HBA1C',
    '%',
    'INST-04',
    'Alere Afinion 2',
    'Boronate Affinity Chromatography',
    'Kendali glikemik jangka panjang pasien diabetes'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    code = EXCLUDED.code,
    unit = EXCLUDED.unit,
    instrument_id = EXCLUDED.instrument_id,
    instrument_name = EXCLUDED.instrument_name,
    method = EXCLUDED.method,
    clinical_significance = EXCLUDED.clinical_significance;

-- 7.5 Master Bahan Kontrol
INSERT INTO public.control_materials (id, name, manufacturer, lot_number, level, expiration_date, status)
VALUES
(
    'CTRL-01',
    'Lyphochek Assayed Chemistry Control Level 1',
    'Bio-Rad Laboratories',
    'BIO-2401',
    'Level 1',
    '2026-12-31',
    'Aktif'
),
(
    'CTRL-02',
    'Lyphochek Assayed Chemistry Control Level 2',
    'Bio-Rad Laboratories',
    'BIO-2402',
    'Level 2',
    '2026-12-31',
    'Aktif'
),
(
    'CTRL-03',
    'Eightcheck-3WP Hematology Control Level 1 (Low)',
    'Sysmex Corporation',
    'SYX-801L',
    'Level 1',
    '2026-06-30',
    'Aktif'
),
(
    'CTRL-04',
    'Eightcheck-3WP Hematology Control Level 2 (Normal)',
    'Sysmex Corporation',
    'SYX-802N',
    'Level 2',
    '2026-06-30',
    'Aktif'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    manufacturer = EXCLUDED.manufacturer,
    lot_number = EXCLUDED.lot_number,
    level = EXCLUDED.level,
    expiration_date = EXCLUDED.expiration_date,
    status = EXCLUDED.status;

-- 7.6 Nilai Target QC (Mean, SD, CV%)
INSERT INTO public.qc_targets (id, instrument_id, instrument_name, parameter_id, parameter_name, level, lot_number, mean, sd, cv, effective_date)
VALUES
(
    'TGT-01',
    'INST-01',
    'Cobas c311',
    'PARAM-01',
    'Glukosa Darah',
    'Level 1',
    'BIO-2401',
    95.0,
    2.8,
    2.95,
    '2026-01-01'
),
(
    'TGT-02',
    'INST-01',
    'Cobas c311',
    'PARAM-01',
    'Glukosa Darah',
    'Level 2',
    'BIO-2402',
    240.0,
    6.2,
    2.58,
    '2026-01-01'
),
(
    'TGT-03',
    'INST-01',
    'Cobas c311',
    'PARAM-02',
    'Kolesterol Total',
    'Level 1',
    'BIO-2401',
    150.0,
    4.2,
    2.8,
    '2026-01-01'
),
(
    'TGT-04',
    'INST-01',
    'Cobas c311',
    'PARAM-02',
    'Kolesterol Total',
    'Level 2',
    'BIO-2402',
    260.0,
    7.5,
    2.88,
    '2026-01-01'
),
(
    'TGT-05',
    'INST-02',
    'Sysmex XN-550',
    'PARAM-08',
    'Hemoglobin (Hb)',
    'Level 1',
    'SYX-801L',
    8.5,
    0.25,
    2.94,
    '2026-01-01'
),
(
    'TGT-06',
    'INST-02',
    'Sysmex XN-550',
    'PARAM-08',
    'Hemoglobin (Hb)',
    'Level 2',
    'SYX-802N',
    13.8,
    0.35,
    2.54,
    '2026-01-01'
),
(
    'TGT-07',
    'INST-02',
    'Sysmex XN-550',
    'PARAM-10',
    'Trombosit (PLT)',
    'Level 1',
    'SYX-801L',
    65.0,
    4.0,
    6.15,
    '2026-01-01'
),
(
    'TGT-08',
    'INST-02',
    'Sysmex XN-550',
    'PARAM-10',
    'Trombosit (PLT)',
    'Level 2',
    'SYX-802N',
    220.0,
    9.5,
    4.32,
    '2026-01-01'
)
ON CONFLICT (id) DO UPDATE SET
    mean = EXCLUDED.mean,
    sd = EXCLUDED.sd,
    cv = EXCLUDED.cv,
    effective_date = EXCLUDED.effective_date;

-- 7.7 Definisi Aturan Westgard
INSERT INTO public.westgard_rules (id, name, description, error_type, severity, sop_recommendation, is_active)
VALUES
(
    '1-2s',
    'Aturan 1:2s',
    'Satu nilai kontrol berada di luar rentang Mean ± 2 SD. Ini adalah aturan peringatan (Warning Rule).',
    'Warning',
    'WARNING',
    'Periksa hasil kontrol sebelumnya. Jika tidak ada aturan lain yang dilanggar, hasil pasien dapat dikeluarkan dengan pemantauan ketat.',
    true
),
(
    '1-3s',
    'Aturan 1:3s',
    'Satu nilai kontrol berada di luar rentang Mean ± 3 SD. Menunjukkan adanya kesalahan acak (Random Error) yang signifikan.',
    'Random',
    'REJECT',
    'Tolak run analitik. Jangan keluarkan hasil pasien. Ulangi pemeriksaan kontrol dari vial baru dan periksa gelembung udara, pipet, atau reagen.',
    true
),
(
    '2-2s',
    'Aturan 2:2s',
    'Dua nilai kontrol berturut-turut pada sisi yang sama berada di luar rentang Mean ± 2 SD. Menunjukkan kesalahan sistematik.',
    'Systematic',
    'REJECT',
    'Tolak run analitik. Jangan keluarkan hasil pasien. Lakukan kalibrasi ulang parameter terkait, periksa lot reagen baru, atau suhu inkubator.',
    true
),
(
    'R-4s',
    'Aturan R:4s',
    'Perbedaan antara dua nilai kontrol dalam run yang sama melebihi 4 SD (misalnya satu kontrol > +2 SD dan kontrol lain < -2 SD).',
    'Random',
    'REJECT',
    'Tolak run analitik. Menunjukkan kesalahan acak. Periksa stabilitas kontrol, presisi pipet, dan pemeliharaan alat.',
    true
),
(
    '4-1s',
    'Aturan 4:1s',
    'Empat nilai kontrol berturut-turut berada di luar Mean ± 1 SD pada sisi kurva yang sama. Menunjukkan pergeseran sistematik kecil.',
    'Systematic',
    'REJECT',
    'Lakukan pemeliharaan instrumen, periksa masa simpan reagen terbuka, dan lakukan rekalibrasi jika diperlukan.',
    true
),
(
    '10x',
    'Aturan 10x',
    'Sepuluh nilai kontrol berturut-turut berada pada satu sisi nilai Mean yang sama. Menunjukkan pergeseran bias sistematik.',
    'Systematic',
    'REJECT',
    'Lakukan kalibrasi ulang segera. Periksa keakuratan fotometer, sumber cahaya lampu, atau penurunan kualitas kalibrator.',
    true
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    error_type = EXCLUDED.error_type,
    severity = EXCLUDED.severity,
    sop_recommendation = EXCLUDED.sop_recommendation,
    is_active = EXCLUDED.is_active;

-- ==============================================================================
-- 8. VIEW BANTUAN ANALITIK (VIEWS)
-- ==============================================================================
CREATE OR REPLACE VIEW public.v_qc_summary_per_parameter AS
SELECT 
    p.id AS parameter_id,
    p.name AS parameter_name,
    p.code AS parameter_code,
    i.name AS instrument_name,
    t.level,
    t.mean AS target_mean,
    t.sd AS target_sd,
    COUNT(r.id) AS total_tests,
    ROUND(AVG(r.result_value)::numeric, 2) AS current_mean,
    ROUND(STDDEV_POP(r.result_value)::numeric, 3) AS current_sd,
    ROUND((STDDEV_POP(r.result_value) / NULLIF(AVG(r.result_value), 0) * 100)::numeric, 2) AS current_cv,
    COUNT(CASE WHEN r.status = 'PASS' THEN 1 END) AS pass_count,
    COUNT(CASE WHEN r.status = 'WARNING' THEN 1 END) AS warning_count,
    COUNT(CASE WHEN r.status = 'REJECT' THEN 1 END) AS reject_count
FROM public.parameters p
JOIN public.instruments i ON p.instrument_id = i.id
LEFT JOIN public.qc_targets t ON t.parameter_id = p.id
LEFT JOIN public.qc_records r ON r.parameter_id = p.id AND r.level = t.level
GROUP BY p.id, p.name, p.code, i.name, t.level, t.mean, t.sd;
