import { Request, Response } from 'express';
import { getDbPool } from './db';

/**
 * Controller to handle all synchronized database persistence across Render / Web clients.
 */

// 1. Check database health and status
export async function getDatabaseStatus(req: Request, res: Response) {
  const pool = getDbPool();
  if (!pool) {
    return res.json({
      connected: false,
      provider: 'localStorage (Modo local sin DATABASE_URL)',
      message: 'No se ha detectado la variable DATABASE_URL en las variables de entorno.'
    });
  }

  try {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT NOW() as now, current_database() as db_name');
      const countRes = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM students) as students_count,
          (SELECT COUNT(*) FROM enrollments) as enrollments_count,
          (SELECT COUNT(*) FROM payments) as payments_count
      `);
      return res.json({
        connected: true,
        provider: 'PostgreSQL en Render',
        databaseName: result.rows[0].db_name,
        serverTime: result.rows[0].now,
        stats: {
          students: parseInt(countRes.rows[0].students_count, 10),
          enrollments: parseInt(countRes.rows[0].enrollments_count, 10),
          payments: parseInt(countRes.rows[0].payments_count, 10)
        }
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    const isDnsError = error.code === 'ENOTFOUND' || error.message?.includes('EAI_AGAIN') || error.message?.includes('getaddrinfo');
    return res.status(200).json({
      connected: false,
      error: error.message,
      isDnsError,
      message: isDnsError
        ? 'El servidor no pudo resolver el nombre del host (EAI_AGAIN). Si usaste la "Internal Database URL", solo funciona dentro de la red privada de Render. Usa la "External Database URL" en las variables de entorno.'
        : error.message
    });
  }
}

// 2. Fetch full application dataset from PostgreSQL
export async function getFullDataset(req: Request, res: Response) {
  const pool = getDbPool();
  if (!pool) {
    return res.json({
      success: false,
      hasPostgres: false,
      message: 'Sin PostgreSQL configurado'
    });
  }

  try {
    const client = await pool.connect();
    try {
      // Check if we have a snapshot first or query individual tables
      const snapshotRes = await client.query('SELECT data FROM app_state_snapshot WHERE id = $1', ['main']);
      
      if (snapshotRes.rows.length > 0 && snapshotRes.rows[0].data) {
        return res.json({
          success: true,
          hasPostgres: true,
          data: snapshotRes.rows[0].data
        });
      }

      // If no snapshot yet, try individual tables
      const [
        studentsRes,
        coursesRes,
        groupsRes,
        enrollmentsRes,
        paymentsRes,
        attendanceRes,
        gradesRes,
        documentsRes,
        communicationsRes,
        contactsRes,
        convsRes,
        msgsRes,
        logsRes,
        settingsRes
      ] = await Promise.all([
        client.query('SELECT data FROM students'),
        client.query('SELECT data FROM courses'),
        client.query('SELECT data FROM groups'),
        client.query('SELECT data FROM enrollments'),
        client.query('SELECT data FROM payments'),
        client.query('SELECT data FROM attendance'),
        client.query('SELECT data FROM grades'),
        client.query('SELECT data FROM documents'),
        client.query('SELECT data FROM communications'),
        client.query('SELECT data FROM whatsapp_contacts'),
        client.query('SELECT data FROM whatsapp_conversations'),
        client.query('SELECT data FROM whatsapp_messages ORDER BY timestamp ASC'),
        client.query('SELECT data FROM audit_logs ORDER BY created_at DESC LIMIT 200'),
        client.query('SELECT data FROM app_settings WHERE id = $1', ['general'])
      ]);

      const data = {
        students: studentsRes.rows.map(r => r.data),
        courses: coursesRes.rows.map(r => r.data),
        groups: groupsRes.rows.map(r => r.data),
        enrollments: enrollmentsRes.rows.map(r => r.data),
        payments: paymentsRes.rows.map(r => r.data),
        attendance: attendanceRes.rows.map(r => r.data),
        grades: gradesRes.rows.map(r => r.data),
        documents: documentsRes.rows.map(r => r.data),
        communications: communicationsRes.rows.map(r => r.data),
        whatsappContacts: contactsRes.rows.map(r => r.data),
        whatsappConversations: convsRes.rows.map(r => r.data),
        whatsappMessages: msgsRes.rows.map(r => r.data),
        auditLogs: logsRes.rows.map(r => r.data),
        settings: settingsRes.rows[0]?.data || null
      };

      return res.json({
        success: true,
        hasPostgres: true,
        data
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    const isDnsError = error.code === 'ENOTFOUND' || error.message?.includes('EAI_AGAIN') || error.message?.includes('getaddrinfo');
    if (!isDnsError) {
      console.warn('[Postgres getFullDataset Notice]:', error.message);
    }
    return res.status(200).json({ 
      success: false, 
      hasPostgres: false,
      isDnsError,
      error: error.message,
      fallback: 'localStorage'
    });
  }
}

// 3. Save / Synchronize application state directly to PostgreSQL
export async function syncDataset(req: Request, res: Response) {
  const pool = getDbPool();
  if (!pool) {
    return res.status(200).json({
      success: false,
      hasPostgres: false,
      message: 'DATABASE_URL no configurada; los datos se guardan en el cliente.'
    });
  }

  const {
    students,
    courses,
    groups,
    enrollments,
    payments,
    attendance,
    grades,
    documents,
    communications,
    whatsappContacts,
    whatsappConversations,
    whatsappMessages,
    auditLogs,
    settings
  } = req.body;

  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Store snapshot for instant atomic recovery
      await client.query(`
        INSERT INTO app_state_snapshot (id, data, updated_at)
        VALUES ('main', $1, NOW())
        ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
      `, [JSON.stringify(req.body)]);

      // 2. Sync students table
      if (Array.isArray(students)) {
        for (const st of students) {
          if (st && st.id) {
            await client.query(`
              INSERT INTO students (id, data, updated_at)
              VALUES ($1, $2, NOW())
              ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
            `, [st.id, JSON.stringify(st)]);
          }
        }
      }

      // 3. Sync enrollments table
      if (Array.isArray(enrollments)) {
        for (const en of enrollments) {
          if (en && en.id) {
            await client.query(`
              INSERT INTO enrollments (id, data)
              VALUES ($1, $2)
              ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
            `, [en.id, JSON.stringify(en)]);
          }
        }
      }

      // 4. Sync payments table
      if (Array.isArray(payments)) {
        for (const py of payments) {
          if (py && py.id) {
            await client.query(`
              INSERT INTO payments (id, data)
              VALUES ($1, $2)
              ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
            `, [py.id, JSON.stringify(py)]);
          }
        }
      }

      // 5. Settings
      if (settings) {
        await client.query(`
          INSERT INTO app_settings (id, data, updated_at)
          VALUES ('general', $1, NOW())
          ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
        `, [JSON.stringify(settings)]);
      }

      await client.query('COMMIT');

      return res.json({
        success: true,
        message: 'Base de datos de PostgreSQL en Render sincronizada exitosamente.'
      });
    } catch (txErr: any) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (error: any) {
    const isDnsError = error.code === 'ENOTFOUND' || error.message?.includes('EAI_AGAIN') || error.message?.includes('getaddrinfo');
    if (!isDnsError) {
      console.warn('[Postgres syncDataset Notice]:', error.message);
    }
    return res.status(200).json({ 
      success: false, 
      hasPostgres: false,
      isDnsError,
      error: error.message,
      message: 'Operación en caché local mientras se valida la conexión a la base de datos externa.'
    });
  }
}
