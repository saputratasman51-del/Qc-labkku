import { getSupabaseClient } from './supabase.ts';
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
} from '../db/queries.ts';

/**
 * Upload local records to Supabase tables
 */
export async function pushAllToSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client tidak aktif / kredensial belum diatur.');
  }

  const [
    profile,
    usersList,
    instrumentsList,
    parametersList,
    controlsList,
    targetsList,
    recordsList,
    violationsList,
    capaList,
  ] = await Promise.all([
    dbGetLabProfile(),
    dbGetUsers(),
    dbGetInstruments(),
    dbGetParameters(),
    dbGetControlMaterials(),
    dbGetQCTargets(),
    dbGetQCRecords(),
    dbGetWestgardViolations(),
    dbGetCAPARecords(),
  ]);

  if (profile) {
    await supabase.from('lab_profile').upsert({
      id: profile.id || 'LAB-SMJ1',
      name: profile.name,
      institution: profile.institution,
      address: profile.address,
      city: profile.city,
      license_number: profile.licenseNumber || 'No. 445/012-DINKES/SMJ1/2024',
      phone: profile.phone,
      email: profile.email,
      head_of_lab: profile.headOfLab,
      head_of_lab_title: profile.headOfLabTitle,
    });
  }

  if (usersList.length > 0) {
    await supabase.from('users').upsert(
      usersList.map((u) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        role: u.role,
        role_label: u.roleLabel,
        nip: u.nip,
        status: u.status,
        email: u.email,
        phone: u.phone,
      }))
    );
  }

  if (instrumentsList.length > 0) {
    await supabase.from('instruments').upsert(
      instrumentsList.map((i) => ({
        id: i.id,
        name: i.name,
        brand: i.brand,
        model: i.model,
        serial_number: i.serialNumber,
        location: i.location,
        status: i.status,
      }))
    );
  }

  if (parametersList.length > 0) {
    await supabase.from('parameters').upsert(
      parametersList.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        unit: p.unit,
        instrument_id: p.instrumentId,
        instrument_name: p.instrumentName,
        method: p.method,
        clinical_significance: p.clinicalSignificance,
      }))
    );
  }

  if (controlsList.length > 0) {
    await supabase.from('control_materials').upsert(
      controlsList.map((c) => ({
        id: c.id,
        name: c.name,
        manufacturer: c.manufacturer,
        lot_number: c.lotNumber,
        level: c.level,
        expiration_date: c.expirationDate,
        status: c.status,
      }))
    );
  }

  if (targetsList.length > 0) {
    await supabase.from('qc_targets').upsert(
      targetsList.map((t) => ({
        id: t.id,
        instrument_id: t.instrumentId,
        instrument_name: t.instrumentName,
        parameter_id: t.parameterId,
        parameter_name: t.parameterName,
        level: t.level,
        lot_number: t.lotNumber,
        mean: t.mean,
        sd: t.sd,
        cv: t.cv,
        effective_date: t.effectiveDate,
      }))
    );
  }

  if (recordsList.length > 0) {
    await supabase.from('qc_records').upsert(
      recordsList.map((r) => ({
        id: r.id,
        date: r.date,
        time: r.time,
        officer_id: r.officerId,
        officer_name: r.officerName,
        instrument_id: r.instrumentId,
        instrument_name: r.instrumentName,
        parameter_id: r.parameterId,
        parameter_name: r.parameterName,
        unit: r.unit,
        level: r.level,
        lot_number: r.lotNumber,
        result_value: r.resultValue,
        target_mean: r.targetMean,
        target_sd: r.targetSd,
        target_cv: r.targetCv,
        z_score: r.zScore,
        status: r.status,
        notes: r.notes,
      }))
    );
  }

  if (violationsList.length > 0) {
    await supabase.from('westgard_violations').upsert(
      violationsList.map((v) => ({
        id: v.id,
        qc_record_id: v.qcRecordId,
        date: v.date,
        time: v.time,
        instrument_name: v.instrumentName,
        parameter_name: v.parameterName,
        level: v.level,
        lot_number: v.lotNumber,
        result_value: v.resultValue,
        z_score: v.zScore,
        target_mean: v.targetMean,
        target_sd: v.targetSd,
        rule_id: v.ruleId,
        rule_name: v.ruleName,
        severity: v.severity,
        error_type: v.errorType,
        sop_recommendation: v.sopRecommendation,
        status: v.status,
        linked_capa_id: v.linkedCapaId,
        action_notes: v.actionNotes,
      }))
    );
  }

  if (capaList.length > 0) {
    await supabase.from('capa_records').upsert(
      capaList.map((c) => ({
        id: c.id,
        capa_number: c.capaNumber,
        date: c.date,
        problem_source: c.problemSource,
        instrument_name: c.instrumentName,
        parameter_name: c.parameterName,
        violation_type: c.violationType,
        violation_id: c.violationId,
        qc_record_id: c.qcRecordId,
        problem_description: c.problemDescription,
        root_cause_analysis: c.rootCauseAnalysis,
        corrective_action: c.correctiveAction,
        preventive_action: c.preventiveAction,
        pic: c.pic,
        target_date: c.targetDate,
        verification_result: c.verificationResult,
        status: c.status,
      }))
    );
  }

  return {
    success: true,
    pushed: {
      users: usersList.length,
      instruments: instrumentsList.length,
      parameters: parametersList.length,
      controls: controlsList.length,
      targets: targetsList.length,
      records: recordsList.length,
      violations: violationsList.length,
      capa: capaList.length,
    },
  };
}

/**
 * Pull all data from Supabase and synchronize to local database
 */
export async function pullAllFromSupabase() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client tidak aktif / kredensial belum diatur.');
  }

  const [
    profileRes,
    usersRes,
    instrumentsRes,
    parametersRes,
    controlsRes,
    targetsRes,
    recordsRes,
    violationsRes,
    capaRes,
  ] = await Promise.all([
    supabase.from('lab_profile').select('*').limit(1),
    supabase.from('users').select('*'),
    supabase.from('instruments').select('*'),
    supabase.from('parameters').select('*'),
    supabase.from('control_materials').select('*'),
    supabase.from('qc_targets').select('*'),
    supabase.from('qc_records').select('*'),
    supabase.from('westgard_violations').select('*'),
    supabase.from('capa_records').select('*'),
  ]);

  if (profileRes.data && profileRes.data.length > 0) {
    const p = profileRes.data[0];
    await dbSaveLabProfile({
      id: p.id || 'LAB-SMJ1',
      name: p.name || 'Laboratorium Patologi Klinik',
      institution: p.institution || 'RSUD Sultan Muhammad Jamaludin I',
      address: p.address || 'Jalan Provinsi, Sukadana',
      city: p.city || 'Kayong Utara, Kode Pos 78852',
      licenseNumber: p.license_number || p.licenseNumber || 'No. 445/012-DINKES/SMJ1/2024',
      phone: p.phone || '(0534) 771-0022 / Ext. 115',
      email: p.email || 'lab.rsudsmj1@kayongutarakab.go.id',
      headOfLab: p.head_of_lab || p.headOfLab || 'dr. Maya Andriani, Sp.PK',
      headOfLabTitle: p.head_of_lab_title || p.headOfLabTitle || 'Dokter Spesialis Patologi Klinik',
    });
  }

  if (usersRes.data) {
    for (const u of usersRes.data) {
      await dbSaveUser({
        id: u.id,
        name: u.name,
        username: u.username,
        password: u.password_hash || u.password || 'password123',
        role: u.role,
        roleLabel: u.role_label || 'Ahli Teknologi Laboratorium Medik (ATLM)',
        nip: u.nip,
        status: u.status,
        email: u.email,
        phone: u.phone,
      });
    }
  }

  if (instrumentsRes.data) {
    for (const i of instrumentsRes.data) {
      await dbSaveInstrument({
        id: i.id,
        name: i.name,
        brand: i.brand,
        model: i.model,
        serialNumber: i.serial_number,
        location: i.location,
        status: i.status,
      });
    }
  }

  if (parametersRes.data) {
    for (const p of parametersRes.data) {
      await dbSaveParameter({
        id: p.id,
        name: p.name,
        code: p.code,
        unit: p.unit,
        instrumentId: p.instrument_id,
        instrumentName: p.instrument_name,
        method: p.method,
        clinicalSignificance: p.clinical_significance,
      });
    }
  }

  if (controlsRes.data) {
    for (const c of controlsRes.data) {
      await dbSaveControlMaterial({
        id: c.id,
        name: c.name,
        manufacturer: c.manufacturer,
        lotNumber: c.lot_number,
        level: c.level,
        expirationDate: c.expiration_date,
        status: c.status,
      });
    }
  }

  if (targetsRes.data) {
    for (const t of targetsRes.data) {
      await dbSaveQCTarget({
        id: t.id,
        instrumentId: t.instrument_id,
        instrumentName: t.instrument_name,
        parameterId: t.parameter_id,
        parameterName: t.parameter_name,
        level: t.level,
        lotNumber: t.lot_number,
        mean: t.mean,
        sd: t.sd,
        cv: t.cv,
        effectiveDate: t.effective_date,
      });
    }
  }

  if (recordsRes.data) {
    for (const r of recordsRes.data) {
      await dbSaveQCRecord({
        id: r.id,
        date: r.date,
        time: r.time,
        officerId: r.officer_id || '',
        officerName: r.officer_name || '',
        instrumentId: r.instrument_id,
        instrumentName: r.instrument_name,
        parameterId: r.parameter_id,
        parameterName: r.parameter_name,
        unit: r.unit,
        level: r.level,
        lotNumber: r.lot_number,
        resultValue: r.result_value,
        targetMean: r.target_mean,
        targetSd: r.target_sd,
        targetCv: r.target_cv,
        zScore: r.z_score,
        status: r.status,
        notes: r.notes,
      });
    }
  }

  if (violationsRes.data) {
    for (const v of violationsRes.data) {
      await dbSaveWestgardViolation({
        id: v.id,
        qcRecordId: v.qc_record_id,
        date: v.date,
        time: v.time,
        instrumentName: v.instrument_name,
        parameterName: v.parameter_name,
        level: v.level,
        lotNumber: v.lot_number,
        resultValue: v.result_value,
        zScore: v.z_score,
        targetMean: v.target_mean,
        targetSd: v.target_sd,
        ruleId: v.rule_id,
        ruleName: v.rule_name,
        severity: v.severity,
        errorType: v.error_type,
        sopRecommendation: v.sop_recommendation,
        status: v.status,
        linkedCapaId: v.linked_capa_id,
        actionNotes: v.action_notes,
      });
    }
  }

  if (capaRes.data) {
    for (const c of capaRes.data) {
      await dbSaveCAPARecord({
        id: c.id,
        capaNumber: c.capa_number,
        date: c.date,
        problemSource: c.problem_source,
        instrumentName: c.instrument_name,
        parameterName: c.parameter_name,
        violationType: c.violation_type,
        violationId: c.violation_id,
        qcRecordId: c.qc_record_id,
        problemDescription: c.problem_description,
        rootCauseAnalysis: c.root_cause_analysis,
        correctiveAction: c.corrective_action,
        preventiveAction: c.preventive_action,
        pic: c.pic,
        targetDate: c.target_date,
        verificationResult: c.verification_result,
        status: c.status,
      });
    }
  }

  return {
    success: true,
    pulled: {
      users: usersRes.data?.length || 0,
      instruments: instrumentsRes.data?.length || 0,
      parameters: parametersRes.data?.length || 0,
      controls: controlsRes.data?.length || 0,
      targets: targetsRes.data?.length || 0,
      records: recordsRes.data?.length || 0,
      violations: violationsRes.data?.length || 0,
      capa: capaRes.data?.length || 0,
    },
  };
}
