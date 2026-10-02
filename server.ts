import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import * as dotenv from 'dotenv';
import {
  dbGetUsers,
  dbSaveUser,
  dbDeleteUser,
  dbGetInstruments,
  dbSaveInstrument,
  dbDeleteInstrument,
  dbGetParameters,
  dbSaveParameter,
  dbDeleteParameter,
  dbGetControlMaterials,
  dbSaveControlMaterial,
  dbDeleteControlMaterial,
  dbGetQCTargets,
  dbSaveQCTarget,
  dbDeleteQCTarget,
  dbGetQCRecords,
  dbSaveQCRecord,
  dbDeleteQCRecord,
  dbGetWestgardViolations,
  dbSaveWestgardViolation,
  dbDeleteWestgardViolation,
  dbGetCAPARecords,
  dbSaveCAPARecord,
  dbDeleteCAPARecord,
  dbGetLabProfile,
  dbSaveLabProfile,
} from './src/db/queries.ts';
import { seedDatabaseIfEmpty } from './src/db/seed.ts';
import { testSupabaseConnection, getSupabaseClient } from './src/lib/supabase.ts';
import { pushAllToSupabase, pullAllFromSupabase } from './src/lib/supabaseSync.ts';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// Supabase Status & Connection Routes
app.get('/api/supabase/status', async (req, res) => {
  const url = process.env.SUPABASE_URL || '';
  const hasKey = Boolean(process.env.SUPABASE_ANON_KEY);
  if (!url || !hasKey) {
    return res.json({
      connected: false,
      configured: false,
      url: null,
      message: 'Supabase belum dikonfigurasi. Masukkan Project URL dan Anon Key untuk menghubungkan.',
    });
  }

  const test = await testSupabaseConnection();
  res.json({
    connected: test.success,
    configured: true,
    url: url.replace(/^(https?:\/\/[^.]+).*/, '$1...'),
    fullUrl: url,
    message: test.message,
  });
});

app.post('/api/supabase/test', async (req, res) => {
  const { url, anonKey } = req.body;
  const result = await testSupabaseConnection(url, anonKey);
  res.json(result);
});

app.post('/api/supabase/save-config', async (req, res) => {
  const { url, anonKey } = req.body;
  if (!url || !anonKey) {
    return res.status(400).json({ success: false, message: 'URL dan Anon Key wajib diisi.' });
  }

  const test = await testSupabaseConnection(url, anonKey);
  if (!test.success) {
    return res.status(400).json({ success: false, message: test.message });
  }

  // Update in runtime
  process.env.SUPABASE_URL = url.trim();
  process.env.SUPABASE_ANON_KEY = anonKey.trim();

  try {
    const envPath = path.resolve(__dirname, '.env');
    let content = '';
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, 'utf8');
    }
    content = content
      .split('\n')
      .filter((line) => !line.startsWith('SUPABASE_URL=') && !line.startsWith('SUPABASE_ANON_KEY='))
      .join('\n');
    content += `\nSUPABASE_URL="${url.trim()}"\nSUPABASE_ANON_KEY="${anonKey.trim()}"\n`;
    fs.writeFileSync(envPath, content, 'utf8');
  } catch (err) {
    console.warn('Could not write to .env file:', err);
  }

  res.json({
    success: true,
    message: 'Koneksi Supabase berhasil disimpan dan terhubung!',
  });
});

app.post('/api/supabase/sync-push', async (req, res) => {
  try {
    const result = await pushAllToSupabase();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/supabase/sync-pull', async (req, res) => {
  try {
    const result = await pullAllFromSupabase();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: 'PostgreSQL / Cloud SQL',
    supabaseConnected: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Full Bootstrap Data
app.get('/api/bootstrap', async (req, res) => {
  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await pullAllFromSupabase();
      } catch (err) {
        console.warn('Pull from Supabase on bootstrap:', err);
      }
    } else {
      await seedDatabaseIfEmpty();
    }

    const [
      usersList,
      instrumentsList,
      parametersList,
      controlsList,
      targetsList,
      recordsList,
      violationsList,
      capaList,
      profile,
    ] = await Promise.all([
      dbGetUsers(),
      dbGetInstruments(),
      dbGetParameters(),
      dbGetControlMaterials(),
      dbGetQCTargets(),
      dbGetQCRecords(),
      dbGetWestgardViolations(),
      dbGetCAPARecords(),
      dbGetLabProfile(),
    ]);

    res.json({
      users: usersList,
      instruments: instrumentsList,
      parameters: parametersList,
      controlMaterials: controlsList,
      qcTargets: targetsList,
      qcRecords: recordsList,
      westgardViolations: violationsList,
      capaRecords: capaList,
      labProfile: profile,
    });
  } catch (error: any) {
    console.error('Error fetching bootstrap data:', error);
    res.status(500).json({ error: error.message || 'Gagal mengambil data' });
  }
});

// QC Records
app.get('/api/qc-records', async (req, res) => {
  try {
    const list = await dbGetQCRecords();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/qc-records', async (req, res) => {
  try {
    const result = await dbSaveQCRecord(req.body);
    const supabase = getSupabaseClient();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('qc_records').upsert({
            id: req.body.id,
            date: req.body.date,
            time: req.body.time,
            officer_id: req.body.officerId,
            officer_name: req.body.officerName,
            instrument_id: req.body.instrumentId,
            instrument_name: req.body.instrumentName,
            parameter_id: req.body.parameterId,
            parameter_name: req.body.parameterName,
            unit: req.body.unit,
            level: req.body.level,
            lot_number: req.body.lotNumber,
            result_value: req.body.resultValue,
            target_mean: req.body.targetMean,
            target_sd: req.body.targetSd,
            target_cv: req.body.targetCv,
            z_score: req.body.zScore,
            status: req.body.status,
            notes: req.body.notes,
          });
        } catch (e) {
          console.warn('Supabase QC record sync error:', e);
        }
      })();
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/qc-records/:id', async (req, res) => {
  try {
    await dbDeleteQCRecord(req.params.id);
    const supabase = getSupabaseClient();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('qc_records').delete().eq('id', req.params.id);
        } catch {
          // ignore
        }
      })();
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Westgard Violations
app.get('/api/violations', async (req, res) => {
  try {
    const list = await dbGetWestgardViolations();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/violations', async (req, res) => {
  try {
    const result = await dbSaveWestgardViolation(req.body);
    const supabase = getSupabaseClient();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('westgard_violations').upsert({
            id: req.body.id,
            qc_record_id: req.body.qcRecordId,
            date: req.body.date,
            time: req.body.time,
            instrument_name: req.body.instrumentName,
            parameter_name: req.body.parameterName,
            level: req.body.level,
            lot_number: req.body.lotNumber,
            result_value: req.body.resultValue,
            z_score: req.body.zScore,
            target_mean: req.body.targetMean,
            target_sd: req.body.targetSd,
            rule_id: req.body.ruleId,
            rule_name: req.body.ruleName,
            severity: req.body.severity,
            error_type: req.body.errorType,
            sop_recommendation: req.body.sopRecommendation,
            status: req.body.status,
            linked_capa_id: req.body.linkedCapaId,
            action_notes: req.body.actionNotes,
          });
        } catch (e) {
          console.warn('Supabase violation sync error:', e);
        }
      })();
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/violations/:id', async (req, res) => {
  try {
    await dbDeleteWestgardViolation(req.params.id);
    const supabase = getSupabaseClient();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('westgard_violations').delete().eq('id', req.params.id);
        } catch {
          // ignore
        }
      })();
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// CAPA Records
app.get('/api/capa', async (req, res) => {
  try {
    const list = await dbGetCAPARecords();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/capa', async (req, res) => {
  try {
    const result = await dbSaveCAPARecord(req.body);
    const supabase = getSupabaseClient();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('capa_records').upsert({
            id: req.body.id,
            capa_number: req.body.capaNumber,
            date: req.body.date,
            problem_source: req.body.problemSource,
            instrument_name: req.body.instrumentName,
            parameter_name: req.body.parameterName,
            violation_type: req.body.violationType,
            violation_id: req.body.violationId,
            qc_record_id: req.body.qcRecordId,
            problem_description: req.body.problemDescription,
            root_cause_analysis: req.body.rootCauseAnalysis,
            corrective_action: req.body.correctiveAction,
            preventive_action: req.body.preventiveAction,
            pic: req.body.pic,
            target_date: req.body.targetDate,
            verification_result: req.body.verificationResult,
            status: req.body.status,
          });
        } catch (e) {
          console.warn('Supabase CAPA sync error:', e);
        }
      })();
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/capa/:id', async (req, res) => {
  try {
    await dbDeleteCAPARecord(req.params.id);
    const supabase = getSupabaseClient();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('capa_records').delete().eq('id', req.params.id);
        } catch {
          // ignore
        }
      })();
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Users
app.get('/api/users', async (req, res) => {
  try {
    const list = await dbGetUsers();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const result = await dbSaveUser(req.body);
    const supabase = getSupabaseClient();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('users').upsert({
            id: req.body.id,
            name: req.body.name,
            username: req.body.username,
            role: req.body.role,
            role_label: req.body.roleLabel || 'Ahli Teknologi Laboratorium Medik (ATLM)',
            nip: req.body.nip,
            status: req.body.status || 'Aktif',
            email: req.body.email || null,
            phone: req.body.phone || null,
          });
        } catch (e) {
          console.warn('Supabase user sync error:', e);
        }
      })();
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await dbDeleteUser(req.params.id);
    const supabase = getSupabaseClient();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('users').delete().eq('id', req.params.id);
        } catch (e) {
          console.warn('Supabase user delete error:', e);
        }
      })();
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Instruments
app.get('/api/instruments', async (req, res) => {
  try {
    const list = await dbGetInstruments();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/instruments', async (req, res) => {
  try {
    const result = await dbSaveInstrument(req.body);
    const supabase = getSupabaseClient();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('instruments').upsert({
            id: req.body.id,
            name: req.body.name,
            brand: req.body.brand,
            model: req.body.model,
            serial_number: req.body.serialNumber,
            location: req.body.location,
            status: req.body.status,
          });
        } catch (e) {
          console.warn('Supabase instrument sync error:', e);
        }
      })();
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/instruments/:id', async (req, res) => {
  try {
    await dbDeleteInstrument(req.params.id);
    const supabase = getSupabaseClient();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('instruments').delete().eq('id', req.params.id);
        } catch (e) {
          console.warn('Supabase instrument delete error:', e);
        }
      })();
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Parameters
app.get('/api/parameters', async (req, res) => {
  try {
    const list = await dbGetParameters();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/parameters', async (req, res) => {
  try {
    const result = await dbSaveParameter(req.body);
    const supabase = getSupabaseClient();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('parameters').upsert({
            id: req.body.id,
            name: req.body.name,
            code: req.body.code,
            unit: req.body.unit,
            instrument_id: req.body.instrumentId,
            instrument_name: req.body.instrumentName,
            method: req.body.method,
            clinical_significance: req.body.clinicalSignificance,
          });
        } catch (e) {
          console.warn('Supabase parameter sync error:', e);
        }
      })();
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/parameters/:id', async (req, res) => {
  try {
    await dbDeleteParameter(req.params.id);
    const supabase = getSupabaseClient();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('parameters').delete().eq('id', req.params.id);
        } catch (e) {
          console.warn('Supabase parameter delete error:', e);
        }
      })();
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Control Materials
app.get('/api/controls', async (req, res) => {
  try {
    const list = await dbGetControlMaterials();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/controls', async (req, res) => {
  try {
    const result = await dbSaveControlMaterial(req.body);
    const supabase = getSupabaseClient();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('control_materials').upsert({
            id: req.body.id,
            name: req.body.name,
            manufacturer: req.body.manufacturer,
            lot_number: req.body.lotNumber,
            level: req.body.level,
            expiration_date: req.body.expirationDate,
            status: req.body.status,
          });
        } catch (e) {
          console.warn('Supabase control sync error:', e);
        }
      })();
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/controls/:id', async (req, res) => {
  try {
    await dbDeleteControlMaterial(req.params.id);
    const supabase = getSupabaseClient();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('control_materials').delete().eq('id', req.params.id);
        } catch (e) {
          console.warn('Supabase control delete error:', e);
        }
      })();
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// QC Targets
app.get('/api/targets', async (req, res) => {
  try {
    const list = await dbGetQCTargets();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/targets', async (req, res) => {
  try {
    const result = await dbSaveQCTarget(req.body);
    const supabase = getSupabaseClient();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('qc_targets').upsert({
            id: req.body.id,
            instrument_id: req.body.instrumentId,
            instrument_name: req.body.instrumentName,
            parameter_id: req.body.parameterId,
            parameter_name: req.body.parameterName,
            level: req.body.level,
            lot_number: req.body.lotNumber,
            mean: req.body.mean,
            sd: req.body.sd,
            cv: req.body.cv,
            effective_date: req.body.effectiveDate || new Date().toISOString().split('T')[0],
          });
        } catch (e) {
          console.warn('Supabase target sync error:', e);
        }
      })();
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/targets/:id', async (req, res) => {
  try {
    await dbDeleteQCTarget(req.params.id);
    const supabase = getSupabaseClient();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('qc_targets').delete().eq('id', req.params.id);
        } catch (e) {
          console.warn('Supabase target delete error:', e);
        }
      })();
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Lab Profile
app.get('/api/profile', async (req, res) => {
  try {
    const profile = await dbGetLabProfile();
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/profile', async (req, res) => {
  try {
    const result = await dbSaveLabProfile(req.body);
    const supabase = getSupabaseClient();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('lab_profile').upsert({
            id: 'LAB-SMJ1',
            name: req.body.name,
            institution: req.body.institution,
            address: req.body.address,
            city: req.body.city,
            license_number: req.body.licenseNumber,
            phone: req.body.phone,
            email: req.body.email,
            head_of_lab: req.body.headOfLab,
            head_of_lab_title: req.body.headOfLabTitle,
          });
        } catch (e) {
          console.warn('Supabase profile sync error:', e);
        }
      })();
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// Vite Frontend Server Setup
// -------------------------------------------------------------
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server QC RSUD Sultan Muhammad Jamaludin I is running on http://localhost:${PORT}`);
  });
}

startServer();
