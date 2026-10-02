import { QCRecord, WestgardRuleDefinition, WestgardViolation } from '../types/index.ts';

export const DEFAULT_WESTGARD_RULES: WestgardRuleDefinition[] = [
  {
    id: '1-2s',
    name: 'Aturan 1-2s (Warning)',
    description: 'Satu hasil QC melewati batas ±2SD.',
    severity: 'WARNING',
    errorType: 'Random',
    sopRecommendation:
      'Peringatan (Warning): 1 data melewati ±2SD. Evaluasi kondisi reagen, suhu inkubasi, dan periksa level kontrol lain. Lakukan pengawasan ketat terhadap run berikutnya.',
    enabled: true,
  },
  {
    id: '1-3s',
    name: 'Aturan 1-3s (Reject)',
    description: 'Satu hasil QC melewati batas ±3SD.',
    severity: 'REJECT',
    errorType: 'Random',
    sopRecommendation:
      'Penolakan (Reject): Hasil melampaui batas kritis ±3SD. Indikasi kesalahan acak (random error) atau kesalahan pipet. Tahan hasil sampel pasien, ulangi pengukuran kontrol dengan vial/lot baru.',
    enabled: true,
  },
  {
    id: '2-2s',
    name: 'Aturan 2-2s (Reject)',
    description: 'Dua hasil berturut-turut melewati batas 2SD pada sisi mean yang sama.',
    severity: 'REJECT',
    errorType: 'Systematic',
    sopRecommendation:
      'Penolakan (Reject): 2 hasil berurutan melebihi 2SD di sisi yang sama. Indikasi kesalahan sistemik (systematic error). Periksa stabilitas reagen, rekalibrasi alat, dan evaluasi lot kontrol.',
    enabled: true,
  },
  {
    id: 'R-4s',
    name: 'Aturan R-4s (Reject)',
    description: 'Dua hasil berturut-turut memiliki selisih minimal 4SD.',
    severity: 'REJECT',
    errorType: 'Random',
    sopRecommendation:
      'Penolakan (Reject): Selisih antara 2 hasil berurutan ≥ 4SD. Indikasi kesalahan acak besar, gelembung udara, atau presipitasi reagen. Bersihkan sel alir/kuvet dan jalankan ulang.',
    enabled: true,
  },
  {
    id: '4-1s',
    name: 'Aturan 4-1s (Reject)',
    description: 'Empat hasil berturut-turut berada di luar batas 1SD pada sisi mean yang sama.',
    severity: 'REJECT',
    errorType: 'Systematic',
    sopRecommendation:
      'Penolakan (Reject): 4 hasil berurutan melebihi 1SD pada sisi yang sama. Indikasi pergeseran analitis (shift/trend). Lakukan kalibrasi ulang dan periksa masa kadaluarsa reagen.',
    enabled: true,
  },
  {
    id: '10x',
    name: 'Aturan 10x (Reject)',
    description: 'Sepuluh hasil berturut-turut berada pada satu sisi mean yang sama.',
    severity: 'REJECT',
    errorType: 'Systematic',
    sopRecommendation:
      'Penolakan (Reject): 10 hasil berurutan berada di satu sisi mean. Indikasi bias instrumen atau pergeseran nilai dasar. Lakukan maintenance mingguan/bulanan, kalibrasi ulang penuh, dan validasi ulang.',
    enabled: true,
  },
];

export interface EvaluationResult {
  zScore: number;
  status: 'PASS' | 'WARNING' | 'REJECT';
  violations: WestgardViolation[];
  ruleIds: string[];
  notesSummary: string;
}

/**
 * Calculates Z-Score: (Value - Mean) / SD
 */
export function calculateZScore(value: number, mean: number, sd: number): number {
  if (!sd || sd <= 0) return 0;
  return Number(((value - mean) / sd).toFixed(2));
}

/**
 * Evaluates Westgard rules for a newly entered or existing QC record
 * based on its target values and the preceding historical records for the same
 * instrument, parameter, and control level.
 */
export function evaluateWestgardRules(
  currentRecord: {
    id: string;
    date: string;
    time: string;
    instrumentName: string;
    parameterName: string;
    level: 'Level 1' | 'Level 2' | 'Level 3';
    lotNumber: string;
    resultValue: number;
    targetMean: number;
    targetSd: number;
  },
  precedingHistory: QCRecord[], // sorted chronologically descending (index 0 is previous record)
  activeRules: WestgardRuleDefinition[] = DEFAULT_WESTGARD_RULES
): EvaluationResult {
  const { resultValue, targetMean, targetSd } = currentRecord;
  const currentZ = calculateZScore(resultValue, targetMean, targetSd);

  const activeRuleMap = new Map(activeRules.map((r) => [r.id, r]));
  const isRuleEnabled = (id: string) => {
    const rule = activeRuleMap.get(id);
    return rule ? rule.enabled : true;
  };

  const detectedViolations: WestgardViolation[] = [];
  const ruleIds: string[] = [];

  // Helper to add violation
  const addViolation = (ruleDef: WestgardRuleDefinition) => {
    if (!ruleIds.includes(ruleDef.id)) {
      ruleIds.push(ruleDef.id);
      detectedViolations.push({
        id: `VIO-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        qcRecordId: currentRecord.id,
        date: currentRecord.date,
        time: currentRecord.time,
        instrumentName: currentRecord.instrumentName,
        parameterName: currentRecord.parameterName,
        level: currentRecord.level,
        lotNumber: currentRecord.lotNumber,
        resultValue: currentRecord.resultValue,
        zScore: currentZ,
        targetMean: currentRecord.targetMean,
        targetSd: currentRecord.targetSd,
        ruleId: ruleDef.id,
        ruleName: ruleDef.name,
        severity: ruleDef.severity,
        errorType: ruleDef.errorType,
        sopRecommendation: ruleDef.sopRecommendation,
        status: 'Belum Ditindaklanjuti',
      });
    }
  };

  // 1. Rule 1-3s: Single point exceeding +/- 3 SD (Rejection)
  if (isRuleEnabled('1-3s') && Math.abs(currentZ) > 3.0) {
    const rule = activeRuleMap.get('1-3s');
    if (rule) addViolation(rule);
  }

  // 2. Rule 1-2s: Single point exceeding +/- 2 SD (Warning)
  if (isRuleEnabled('1-2s') && Math.abs(currentZ) > 2.0) {
    const rule = activeRuleMap.get('1-2s');
    if (rule) addViolation(rule);
  }

  // Gather previous Z scores
  const prevZScores = precedingHistory.map((rec) =>
    rec.zScore !== undefined
      ? rec.zScore
      : calculateZScore(rec.resultValue, rec.targetMean, rec.targetSd)
  );

  // 3. Rule 2-2s: Two consecutive runs exceeding +/- 2 SD on the SAME side
  if (isRuleEnabled('2-2s') && prevZScores.length >= 1) {
    const prevZ = prevZScores[0];
    if (
      (currentZ > 2.0 && prevZ > 2.0) ||
      (currentZ < -2.0 && prevZ < -2.0)
    ) {
      const rule = activeRuleMap.get('2-2s');
      if (rule) addViolation(rule);
    }
  }

  // 4. Rule R-4s: Difference between consecutive runs >= 4.0 SD
  if (isRuleEnabled('R-4s') && prevZScores.length >= 1) {
    const prevZ = prevZScores[0];
    const diff = Math.abs(currentZ - prevZ);
    if (diff >= 4.0) {
      const rule = activeRuleMap.get('R-4s');
      if (rule) addViolation(rule);
    }
  }

  // 5. Rule 4-1s: Four consecutive runs exceeding 1 SD on the SAME side
  if (isRuleEnabled('4-1s') && prevZScores.length >= 3) {
    const run4 = [currentZ, prevZScores[0], prevZScores[1], prevZScores[2]];
    const allAbove1 = run4.every((z) => z > 1.0);
    const allBelow1 = run4.every((z) => z < -1.0);
    if (allAbove1 || allBelow1) {
      const rule = activeRuleMap.get('4-1s');
      if (rule) addViolation(rule);
    }
  }

  // 6. Rule 10x: Ten consecutive runs on the SAME side of the mean
  if (isRuleEnabled('10x') && prevZScores.length >= 9) {
    const run10 = [
      currentZ,
      prevZScores[0],
      prevZScores[1],
      prevZScores[2],
      prevZScores[3],
      prevZScores[4],
      prevZScores[5],
      prevZScores[6],
      prevZScores[7],
      prevZScores[8],
    ];
    const allPositive = run10.every((z) => z > 0);
    const allNegative = run10.every((z) => z < 0);
    if (allPositive || allNegative) {
      const rule = activeRuleMap.get('10x');
      if (rule) addViolation(rule);
    }
  }

  // Determine overall status
  let overallStatus: 'PASS' | 'WARNING' | 'REJECT' = 'PASS';
  const hasReject = detectedViolations.some((v) => v.severity === 'REJECT');
  const hasWarning = detectedViolations.some((v) => v.severity === 'WARNING');

  if (hasReject) {
    overallStatus = 'REJECT';
  } else if (hasWarning) {
    overallStatus = 'WARNING';
  }

  const notesSummary =
    detectedViolations.length > 0
      ? `Pelanggaran Westgard: ${detectedViolations.map((v) => v.ruleName).join(', ')}`
      : 'Hasil dalam batas normal';

  return {
    zScore: currentZ,
    status: overallStatus,
    violations: detectedViolations,
    ruleIds,
    notesSummary,
  };
}
