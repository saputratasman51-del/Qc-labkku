import { eq, desc } from 'drizzle-orm';
import { db } from './index.ts';
import {
  users,
  instruments,
  parameters,
  controlMaterials,
  qcTargets,
  qcRecords,
  westgardViolations,
  capaRecords,
  labProfile,
} from './schema.ts';

// -------------------------------------------------------------
// Users
// -------------------------------------------------------------
export async function dbGetUsers() {
  try {
    return await db.select().from(users);
  } catch (error) {
    console.error('dbGetUsers failed:', error);
    throw new Error('Gagal mengambil data pengguna dari database', { cause: error });
  }
}

export async function dbSaveUser(data: typeof users.$inferInsert) {
  try {
    return await db
      .insert(users)
      .values(data)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          name: data.name,
          username: data.username,
          password: data.password,
          role: data.role,
          roleLabel: data.roleLabel,
          nip: data.nip,
          status: data.status,
          email: data.email,
          phone: data.phone,
        },
      })
      .returning();
  } catch (error) {
    console.error('dbSaveUser failed:', error);
    throw new Error('Gagal menyimpan data pengguna', { cause: error });
  }
}

export async function dbDeleteUser(id: string) {
  try {
    return await db.delete(users).where(eq(users.id, id));
  } catch (error) {
    console.error('dbDeleteUser failed:', error);
    throw new Error('Gagal menghapus pengguna', { cause: error });
  }
}

// -------------------------------------------------------------
// Instruments
// -------------------------------------------------------------
export async function dbGetInstruments() {
  try {
    return await db.select().from(instruments);
  } catch (error) {
    console.error('dbGetInstruments failed:', error);
    throw new Error('Gagal mengambil data alat', { cause: error });
  }
}

export async function dbSaveInstrument(data: typeof instruments.$inferInsert) {
  try {
    return await db
      .insert(instruments)
      .values(data)
      .onConflictDoUpdate({
        target: instruments.id,
        set: {
          name: data.name,
          brand: data.brand,
          model: data.model,
          serialNumber: data.serialNumber,
          location: data.location,
          status: data.status,
        },
      })
      .returning();
  } catch (error) {
    console.error('dbSaveInstrument failed:', error);
    throw new Error('Gagal menyimpan data alat', { cause: error });
  }
}

export async function dbDeleteInstrument(id: string) {
  try {
    return await db.delete(instruments).where(eq(instruments.id, id));
  } catch (error) {
    console.error('dbDeleteInstrument failed:', error);
    throw new Error('Gagal menghapus alat', { cause: error });
  }
}

// -------------------------------------------------------------
// Parameters
// -------------------------------------------------------------
export async function dbGetParameters() {
  try {
    return await db.select().from(parameters);
  } catch (error) {
    console.error('dbGetParameters failed:', error);
    throw new Error('Gagal mengambil data parameter', { cause: error });
  }
}

export async function dbSaveParameter(data: typeof parameters.$inferInsert) {
  try {
    return await db
      .insert(parameters)
      .values(data)
      .onConflictDoUpdate({
        target: parameters.id,
        set: {
          name: data.name,
          code: data.code,
          unit: data.unit,
          instrumentId: data.instrumentId,
          instrumentName: data.instrumentName,
          method: data.method,
          clinicalSignificance: data.clinicalSignificance,
        },
      })
      .returning();
  } catch (error) {
    console.error('dbSaveParameter failed:', error);
    throw new Error('Gagal menyimpan data parameter', { cause: error });
  }
}

export async function dbDeleteParameter(id: string) {
  try {
    return await db.delete(parameters).where(eq(parameters.id, id));
  } catch (error) {
    console.error('dbDeleteParameter failed:', error);
    throw new Error('Gagal menghapus parameter', { cause: error });
  }
}

// -------------------------------------------------------------
// Control Materials
// -------------------------------------------------------------
export async function dbGetControlMaterials() {
  try {
    return await db.select().from(controlMaterials);
  } catch (error) {
    console.error('dbGetControlMaterials failed:', error);
    throw new Error('Gagal mengambil data bahan kontrol', { cause: error });
  }
}

export async function dbSaveControlMaterial(data: typeof controlMaterials.$inferInsert) {
  try {
    return await db
      .insert(controlMaterials)
      .values(data)
      .onConflictDoUpdate({
        target: controlMaterials.id,
        set: {
          name: data.name,
          manufacturer: data.manufacturer,
          lotNumber: data.lotNumber,
          level: data.level,
          expirationDate: data.expirationDate,
          status: data.status,
        },
      })
      .returning();
  } catch (error) {
    console.error('dbSaveControlMaterial failed:', error);
    throw new Error('Gagal menyimpan data bahan kontrol', { cause: error });
  }
}

export async function dbDeleteControlMaterial(id: string) {
  try {
    return await db.delete(controlMaterials).where(eq(controlMaterials.id, id));
  } catch (error) {
    console.error('dbDeleteControlMaterial failed:', error);
    throw new Error('Gagal menghapus bahan kontrol', { cause: error });
  }
}

// -------------------------------------------------------------
// QC Targets
// -------------------------------------------------------------
export async function dbGetQCTargets() {
  try {
    return await db.select().from(qcTargets);
  } catch (error) {
    console.error('dbGetQCTargets failed:', error);
    throw new Error('Gagal mengambil data target QC', { cause: error });
  }
}

export async function dbSaveQCTarget(data: typeof qcTargets.$inferInsert) {
  try {
    return await db
      .insert(qcTargets)
      .values(data)
      .onConflictDoUpdate({
        target: qcTargets.id,
        set: {
          instrumentId: data.instrumentId,
          instrumentName: data.instrumentName,
          parameterId: data.parameterId,
          parameterName: data.parameterName,
          level: data.level,
          lotNumber: data.lotNumber,
          mean: data.mean,
          sd: data.sd,
          cv: data.cv,
          effectiveDate: data.effectiveDate,
        },
      })
      .returning();
  } catch (error) {
    console.error('dbSaveQCTarget failed:', error);
    throw new Error('Gagal menyimpan target QC', { cause: error });
  }
}

export async function dbDeleteQCTarget(id: string) {
  try {
    return await db.delete(qcTargets).where(eq(qcTargets.id, id));
  } catch (error) {
    console.error('dbDeleteQCTarget failed:', error);
    throw new Error('Gagal menghapus target QC', { cause: error });
  }
}

// -------------------------------------------------------------
// QC Records
// -------------------------------------------------------------
export async function dbGetQCRecords() {
  try {
    return await db.select().from(qcRecords).orderBy(desc(qcRecords.date), desc(qcRecords.time));
  } catch (error) {
    console.error('dbGetQCRecords failed:', error);
    throw new Error('Gagal mengambil riwayat QC', { cause: error });
  }
}

export async function dbSaveQCRecord(data: typeof qcRecords.$inferInsert) {
  try {
    return await db
      .insert(qcRecords)
      .values(data)
      .onConflictDoUpdate({
        target: qcRecords.id,
        set: {
          date: data.date,
          time: data.time,
          officerId: data.officerId,
          officerName: data.officerName,
          instrumentId: data.instrumentId,
          instrumentName: data.instrumentName,
          parameterId: data.parameterId,
          parameterName: data.parameterName,
          unit: data.unit,
          level: data.level,
          lotNumber: data.lotNumber,
          resultValue: data.resultValue,
          targetMean: data.targetMean,
          targetSd: data.targetSd,
          targetCv: data.targetCv,
          zScore: data.zScore,
          status: data.status,
          notes: data.notes,
          violationRules: data.violationRules,
          violationDetails: data.violationDetails,
          auditTrail: data.auditTrail,
        },
      })
      .returning();
  } catch (error) {
    console.error('dbSaveQCRecord failed:', error);
    throw new Error('Gagal menyimpan catatan QC', { cause: error });
  }
}

export async function dbDeleteQCRecord(id: string) {
  try {
    return await db.delete(qcRecords).where(eq(qcRecords.id, id));
  } catch (error) {
    console.error('dbDeleteQCRecord failed:', error);
    throw new Error('Gagal menghapus catatan QC', { cause: error });
  }
}

// -------------------------------------------------------------
// Westgard Violations
// -------------------------------------------------------------
export async function dbGetWestgardViolations() {
  try {
    return await db
      .select()
      .from(westgardViolations)
      .orderBy(desc(westgardViolations.date), desc(westgardViolations.time));
  } catch (error) {
    console.error('dbGetWestgardViolations failed:', error);
    throw new Error('Gagal mengambil data pelanggaran Westgard', { cause: error });
  }
}

export async function dbSaveWestgardViolation(data: typeof westgardViolations.$inferInsert) {
  try {
    return await db
      .insert(westgardViolations)
      .values(data)
      .onConflictDoUpdate({
        target: westgardViolations.id,
        set: {
          status: data.status,
          linkedCapaId: data.linkedCapaId,
          actionNotes: data.actionNotes,
          resolvedAt: data.resolvedAt,
          resolvedBy: data.resolvedBy,
        },
      })
      .returning();
  } catch (error) {
    console.error('dbSaveWestgardViolation failed:', error);
    throw new Error('Gagal menyimpan pelanggaran Westgard', { cause: error });
  }
}

export async function dbDeleteWestgardViolation(id: string) {
  try {
    return await db.delete(westgardViolations).where(eq(westgardViolations.id, id));
  } catch (error) {
    console.error('dbDeleteWestgardViolation failed:', error);
    throw new Error('Gagal menghapus data pelanggaran Westgard', { cause: error });
  }
}

// -------------------------------------------------------------
// CAPA Records
// -------------------------------------------------------------
export async function dbGetCAPARecords() {
  try {
    return await db.select().from(capaRecords).orderBy(desc(capaRecords.date));
  } catch (error) {
    console.error('dbGetCAPARecords failed:', error);
    throw new Error('Gagal mengambil data CAPA', { cause: error });
  }
}

export async function dbSaveCAPARecord(data: typeof capaRecords.$inferInsert) {
  try {
    return await db
      .insert(capaRecords)
      .values(data)
      .onConflictDoUpdate({
        target: capaRecords.id,
        set: {
          capaNumber: data.capaNumber,
          date: data.date,
          problemSource: data.problemSource,
          instrumentName: data.instrumentName,
          parameterName: data.parameterName,
          violationType: data.violationType,
          problemDescription: data.problemDescription,
          rootCauseAnalysis: data.rootCauseAnalysis,
          correctiveAction: data.correctiveAction,
          preventiveAction: data.preventiveAction,
          pic: data.pic,
          targetDate: data.targetDate,
          verificationResult: data.verificationResult,
          verifiedBy: data.verifiedBy,
          verifiedAt: data.verifiedAt,
          status: data.status,
          isOverdue: data.isOverdue,
          updatedAt: data.updatedAt,
        },
      })
      .returning();
  } catch (error) {
    console.error('dbSaveCAPARecord failed:', error);
    throw new Error('Gagal menyimpan catatan CAPA', { cause: error });
  }
}

export async function dbDeleteCAPARecord(id: string) {
  try {
    return await db.delete(capaRecords).where(eq(capaRecords.id, id));
  } catch (error) {
    console.error('dbDeleteCAPARecord failed:', error);
    throw new Error('Gagal menghapus CAPA', { cause: error });
  }
}

// -------------------------------------------------------------
// Lab Profile
// -------------------------------------------------------------
export async function dbGetLabProfile() {
  try {
    const list = await db.select().from(labProfile);
    return list[0] || null;
  } catch (error) {
    console.error('dbGetLabProfile failed:', error);
    throw new Error('Gagal mengambil profil lab', { cause: error });
  }
}

export async function dbSaveLabProfile(data: typeof labProfile.$inferInsert) {
  try {
    return await db
      .insert(labProfile)
      .values(data)
      .onConflictDoUpdate({
        target: labProfile.id,
        set: {
          name: data.name,
          institution: data.institution,
          address: data.address,
          city: data.city,
          licenseNumber: data.licenseNumber,
          phone: data.phone,
          email: data.email,
          headOfLab: data.headOfLab,
          headOfLabTitle: data.headOfLabTitle,
        },
      })
      .returning();
  } catch (error) {
    console.error('dbSaveLabProfile failed:', error);
    throw new Error('Gagal menyimpan profil lab', { cause: error });
  }
}
