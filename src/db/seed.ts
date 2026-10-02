import {
  dbGetUsers,
  dbSaveUser,
  dbGetInstruments,
  dbSaveInstrument,
  dbGetParameters,
  dbSaveParameter,
  dbGetControlMaterials,
  dbSaveControlMaterial,
  dbGetQCTargets,
  dbSaveQCTarget,
  dbGetQCRecords,
  dbSaveQCRecord,
  dbGetWestgardViolations,
  dbSaveWestgardViolation,
  dbGetCAPARecords,
  dbSaveCAPARecord,
  dbGetLabProfile,
  dbSaveLabProfile,
} from './queries.ts';

export async function seedDatabaseIfEmpty() {
  try {
    const existingUsers = await dbGetUsers();
    if (existingUsers.length > 0) {
      console.log('Database already initialized with', existingUsers.length, 'users.');
      return;
    }

    console.log('Seeding initial data for RSUD Sultan Muhammad Jamaludin I...');

    // 1. Lab Profile
    await dbSaveLabProfile({
      id: 'LAB-SMJ1',
      name: 'Laboratorium Patologi Klinik',
      institution: 'RSUD Sultan Muhammad Jamaludin I',
      address: 'Jalan Provinsi, Sukadana',
      city: 'Kayong Utara, Kode Pos 78852',
      licenseNumber: 'No. 445/012-DINKES/SMJ1/2024',
      phone: '(0534) 771-0022 / Ext. 115',
      email: 'lab.rsudsmj1@kayongutarakab.go.id',
      headOfLab: 'dr. Maya Andriani, Sp.PK',
      headOfLabTitle: 'Dokter Spesialis Patologi Klinik',
    });

    // 2. Users (ATLM, Sp.PK, Admin)
    await dbSaveUser({
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
    });

    await dbSaveUser({
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
    });

    await dbSaveUser({
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
    });

    // 3. Instruments
    await dbSaveInstrument({
      id: 'INST-01',
      name: 'Cobas c311',
      brand: 'Roche Diagnostics',
      model: 'c311 Clinical Chemistry Analyzer',
      serialNumber: 'COB-984210',
      location: 'Lab Kimia Klinik - Ruang 102',
      status: 'Aktif',
      createdAt: '2026-01-10',
    });

    await dbSaveInstrument({
      id: 'INST-02',
      name: 'Sysmex XN-550',
      brand: 'Sysmex Corporation',
      model: 'XN-550 5-Diff Hematology Analyzer',
      serialNumber: 'SYX-331045',
      location: 'Lab Hematologi - Ruang 104',
      status: 'Aktif',
      createdAt: '2026-01-10',
    });

    await dbSaveInstrument({
      id: 'INST-03',
      name: 'Mindray BS-240',
      brand: 'Mindray Medical',
      model: 'BS-240 Automatic Chemistry',
      serialNumber: 'MND-774912',
      location: 'Lab Kimia Klinik 2 - Ruang 103',
      status: 'Aktif',
      createdAt: '2026-02-01',
    });

    await dbSaveInstrument({
      id: 'INST-04',
      name: 'Alere Afinion 2',
      brand: 'Abbott Diagnostics',
      model: 'Afinion 2 Point of Care Analyzer',
      serialNumber: 'AFN-110294',
      location: 'Lab POC / Rawat Jalan',
      status: 'Aktif',
      createdAt: '2026-02-15',
    });

    // 4. Parameters
    await dbSaveParameter({
      id: 'PARAM-01',
      name: 'Glukosa Darah',
      code: 'GLU',
      unit: 'mg/dL',
      instrumentId: 'INST-01',
      instrumentName: 'Cobas c311',
      method: 'Enzymatic Hexokinase',
      clinicalSignificance: 'Diagnosis & pemantauan diabetes melitus',
    });

    await dbSaveParameter({
      id: 'PARAM-02',
      name: 'Kolesterol Total',
      code: 'CHOL',
      unit: 'mg/dL',
      instrumentId: 'INST-01',
      instrumentName: 'Cobas c311',
      method: 'CHOD-PAP Enzymatic',
      clinicalSignificance: 'Penilaian risiko kardiovaskular & profil lipid',
    });

    await dbSaveParameter({
      id: 'PARAM-03',
      name: 'Trigliserida',
      code: 'TG',
      unit: 'mg/dL',
      instrumentId: 'INST-01',
      instrumentName: 'Cobas c311',
      method: 'GPO-PAP Colorimetric',
      clinicalSignificance: 'Evaluasi metabolisme lemak',
    });

    await dbSaveParameter({
      id: 'PARAM-04',
      name: 'SGOT (AST)',
      code: 'SGOT',
      unit: 'U/L',
      instrumentId: 'INST-01',
      instrumentName: 'Cobas c311',
      method: 'IFCC without pyridoxal phosphate',
      clinicalSignificance: 'Evaluasi fungsi hati dan nekrosis sel hepatoseluler',
    });

    await dbSaveParameter({
      id: 'PARAM-05',
      name: 'SGPT (ALT)',
      code: 'SGPT',
      unit: 'U/L',
      instrumentId: 'INST-01',
      instrumentName: 'Cobas c311',
      method: 'IFCC without pyridoxal phosphate',
      clinicalSignificance: 'Indikator spesifik peradangan hepar akut & kronis',
    });

    await dbSaveParameter({
      id: 'PARAM-06',
      name: 'Ureum',
      code: 'UREA',
      unit: 'mg/dL',
      instrumentId: 'INST-01',
      instrumentName: 'Cobas c311',
      method: 'Urease GLDH UV Kinetic',
      clinicalSignificance: 'Pemeriksaan fungsi ginjal & metabolisme protein',
    });

    await dbSaveParameter({
      id: 'PARAM-07',
      name: 'Kreatinin',
      code: 'CREA',
      unit: 'mg/dL',
      instrumentId: 'INST-01',
      instrumentName: 'Cobas c311',
      method: 'Jaffe rate-blanked and compensated',
      clinicalSignificance: 'Penanda laju filtrasi glomerulus (eGFR)',
    });

    await dbSaveParameter({
      id: 'PARAM-08',
      name: 'Hemoglobin (Hb)',
      code: 'HGB',
      unit: 'g/dL',
      instrumentId: 'INST-02',
      instrumentName: 'Sysmex XN-550',
      method: 'SLS-Hemoglobin (Cyanide-free)',
      clinicalSignificance: 'Diagnosis anemia, polisitemia, dan evaluasi perdarahan',
    });

    await dbSaveParameter({
      id: 'PARAM-09',
      name: 'Leukosit (WBC)',
      code: 'WBC',
      unit: '10^3/µL',
      instrumentId: 'INST-02',
      instrumentName: 'Sysmex XN-550',
      method: 'Flow Cytometry Semiconductor Laser',
      clinicalSignificance: 'Deteksi infeksi, inflamasi, dan leukemia',
    });

    await dbSaveParameter({
      id: 'PARAM-10',
      name: 'Trombosit (PLT)',
      code: 'PLT',
      unit: '10^3/µL',
      instrumentId: 'INST-02',
      instrumentName: 'Sysmex XN-550',
      method: 'Hydrodynamic Focusing DC Detection',
      clinicalSignificance: 'Penilaian hemostasis primer, DHF, dan trombositopenia',
    });

    await dbSaveParameter({
      id: 'PARAM-11',
      name: 'HbA1c',
      code: 'HBA1C',
      unit: '%',
      instrumentId: 'INST-04',
      instrumentName: 'Alere Afinion 2',
      method: 'Boronate Affinity Chromatography',
      clinicalSignificance: 'Kendali glikemik jangka panjang pasien diabetes',
    });

    // 5. Control Materials
    await dbSaveControlMaterial({
      id: 'CTRL-01',
      name: 'Lyphochek Assayed Chemistry Control Level 1',
      manufacturer: 'Bio-Rad Laboratories',
      lotNumber: 'BIO-2401',
      level: 'Level 1',
      expirationDate: '2026-12-31',
      status: 'Aktif',
    });

    await dbSaveControlMaterial({
      id: 'CTRL-02',
      name: 'Lyphochek Assayed Chemistry Control Level 2',
      manufacturer: 'Bio-Rad Laboratories',
      lotNumber: 'BIO-2402',
      level: 'Level 2',
      expirationDate: '2026-12-31',
      status: 'Aktif',
    });

    await dbSaveControlMaterial({
      id: 'CTRL-03',
      name: 'Eightcheck-3WP Hematology Control Level 1 (Low)',
      manufacturer: 'Sysmex Corporation',
      lotNumber: 'SYX-801L',
      level: 'Level 1',
      expirationDate: '2026-06-30',
      status: 'Aktif',
    });

    await dbSaveControlMaterial({
      id: 'CTRL-04',
      name: 'Eightcheck-3WP Hematology Control Level 2 (Normal)',
      manufacturer: 'Sysmex Corporation',
      lotNumber: 'SYX-802N',
      level: 'Level 2',
      expirationDate: '2026-06-30',
      status: 'Aktif',
    });

    // 6. QC Targets
    const targets = [
      {
        id: 'TGT-01',
        instrumentId: 'INST-01',
        instrumentName: 'Cobas c311',
        parameterId: 'PARAM-01',
        parameterName: 'Glukosa Darah',
        level: 'Level 1' as const,
        lotNumber: 'BIO-2401',
        mean: 95.0,
        sd: 2.8,
        cv: 2.95,
        effectiveDate: '2026-01-01',
      },
      {
        id: 'TGT-02',
        instrumentId: 'INST-01',
        instrumentName: 'Cobas c311',
        parameterId: 'PARAM-01',
        parameterName: 'Glukosa Darah',
        level: 'Level 2' as const,
        lotNumber: 'BIO-2402',
        mean: 240.0,
        sd: 6.2,
        cv: 2.58,
        effectiveDate: '2026-01-01',
      },
      {
        id: 'TGT-03',
        instrumentId: 'INST-01',
        instrumentName: 'Cobas c311',
        parameterId: 'PARAM-02',
        parameterName: 'Kolesterol Total',
        level: 'Level 1' as const,
        lotNumber: 'BIO-2401',
        mean: 150.0,
        sd: 4.2,
        cv: 2.8,
        effectiveDate: '2026-01-01',
      },
      {
        id: 'TGT-04',
        instrumentId: 'INST-01',
        instrumentName: 'Cobas c311',
        parameterId: 'PARAM-02',
        parameterName: 'Kolesterol Total',
        level: 'Level 2' as const,
        lotNumber: 'BIO-2402',
        mean: 260.0,
        sd: 7.5,
        cv: 2.88,
        effectiveDate: '2026-01-01',
      },
      {
        id: 'TGT-05',
        instrumentId: 'INST-02',
        instrumentName: 'Sysmex XN-550',
        parameterId: 'PARAM-08',
        parameterName: 'Hemoglobin (Hb)',
        level: 'Level 1' as const,
        lotNumber: 'SYX-801L',
        mean: 8.5,
        sd: 0.25,
        cv: 2.94,
        effectiveDate: '2026-01-01',
      },
      {
        id: 'TGT-06',
        instrumentId: 'INST-02',
        instrumentName: 'Sysmex XN-550',
        parameterId: 'PARAM-08',
        parameterName: 'Hemoglobin (Hb)',
        level: 'Level 2' as const,
        lotNumber: 'SYX-802N',
        mean: 13.8,
        sd: 0.35,
        cv: 2.54,
        effectiveDate: '2026-01-01',
      },
      {
        id: 'TGT-07',
        instrumentId: 'INST-02',
        instrumentName: 'Sysmex XN-550',
        parameterId: 'PARAM-10',
        parameterName: 'Trombosit (PLT)',
        level: 'Level 1' as const,
        lotNumber: 'SYX-801L',
        mean: 65.0,
        sd: 4.0,
        cv: 6.15,
        effectiveDate: '2026-01-01',
      },
      {
        id: 'TGT-08',
        instrumentId: 'INST-02',
        instrumentName: 'Sysmex XN-550',
        parameterId: 'PARAM-10',
        parameterName: 'Trombosit (PLT)',
        level: 'Level 2' as const,
        lotNumber: 'SYX-802N',
        mean: 220.0,
        sd: 9.5,
        cv: 4.32,
        effectiveDate: '2026-01-01',
      },
    ];

    for (const tgt of targets) {
      await dbSaveQCTarget(tgt);
    }

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error during seedDatabaseIfEmpty:', error);
  }
}
