import pg from 'pg';
const { Pool } = pg;

// Singleton pool for PostgreSQL on Render / Cloud
let poolInstance: pg.Pool | null = null;

export function getDbPool(): pg.Pool | null {
  let connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }

  // Detect if user copied the Internal hostname (e.g. @dpg-daf2rcad0e5s73aii2h0-a/) without the public domain
  // When running outside Render's private network (e.g. AI Studio preview), internal hostnames fail DNS (EAI_AGAIN).
  // Automatically append .oregon-postgres.render.com (the default Render region for free tier) so it resolves everywhere.
  if (/@dpg-[a-z0-9]+-a\//i.test(connectionString) || /@dpg-[a-z0-9]+-a$/i.test(connectionString)) {
    connectionString = connectionString.replace(/@(dpg-[a-z0-9]+-a)(\/|$)/i, '@$1.oregon-postgres.render.com$2');
  }

  if (!poolInstance) {
    const isRenderOrCloud = connectionString.includes('render.com') || process.env.NODE_ENV === 'production' || connectionString.includes('sslmode=require');
    poolInstance = new Pool({
      connectionString,
      ssl: isRenderOrCloud
        ? { rejectUnauthorized: false }
        : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 4000,
    });

    poolInstance.on('error', (err) => {
      // Prevent uncaught pool errors from flooding logs
      if (err.message?.includes('EAI_AGAIN') || err.message?.includes('ENOTFOUND')) {
        return;
      }
      console.warn('[PostgreSQL Pool Notice]:', err.message);
    });
  }

  return poolInstance;
}

/**
 * Initializes the required relational database schema on first launch if not already created.
 */
export async function initPostgresDatabase(): Promise<{ success: boolean; message: string }> {
  const pool = getDbPool();
  if (!pool) {
    return {
      success: false,
      message: 'DATABASE_URL no está configurado en las variables de entorno. Operando en modo local/fallback.'
    };
  }

  try {
    const client = await pool.connect();
    try {
      await client.query(`
        -- 1. Tabla de Configuración y Metadatos
        CREATE TABLE IF NOT EXISTS app_settings (
          id VARCHAR(50) PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- 2. Tabla de Estudiantes
        CREATE TABLE IF NOT EXISTS students (
          id VARCHAR(100) PRIMARY KEY,
          data JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- 3. Cursos y Grupos
        CREATE TABLE IF NOT EXISTS courses (
          id VARCHAR(100) PRIMARY KEY,
          data JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS groups (
          id VARCHAR(100) PRIMARY KEY,
          data JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- 4. Matrículas y Pagos
        CREATE TABLE IF NOT EXISTS enrollments (
          id VARCHAR(100) PRIMARY KEY,
          data JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS payments (
          id VARCHAR(100) PRIMARY KEY,
          data JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- 5. Asistencias, Calificaciones, Documentos
        CREATE TABLE IF NOT EXISTS attendance (
          id VARCHAR(100) PRIMARY KEY,
          data JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS grades (
          id VARCHAR(100) PRIMARY KEY,
          data JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS documents (
          id VARCHAR(100) PRIMARY KEY,
          data JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- 6. WhatsApp y CRM (Mensajes, Contactos, Conversaciones)
        CREATE TABLE IF NOT EXISTS whatsapp_contacts (
          id VARCHAR(100) PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS whatsapp_conversations (
          id VARCHAR(100) PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS whatsapp_messages (
          id VARCHAR(100) PRIMARY KEY,
          data JSONB NOT NULL,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- 7. Auditoría
        CREATE TABLE IF NOT EXISTS audit_logs (
          id VARCHAR(100) PRIMARY KEY,
          data JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- 8. Tabla de Sincronización Global / Snapshot (para respaldo completo atómico)
        CREATE TABLE IF NOT EXISTS app_state_snapshot (
          id VARCHAR(50) PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('[PostgreSQL]: Tablas del sistema verificadas e inicializadas correctamente en Render.');
      return { success: true, message: 'Base de datos PostgreSQL inicializada con éxito.' };
    } finally {
      client.release();
    }
  } catch (error: any) {
    if (error.code === 'ENOTFOUND' || error.message?.includes('EAI_AGAIN') || error.message?.includes('getaddrinfo')) {
      console.warn(
        `[PostgreSQL Aviso de Conexión]: El servidor no pudo resolver la dirección DNS del host. ` +
        `Si estás conectando desde fuera de la red interna de Render (por ejemplo, en desarrollo o AI Studio), ` +
        `debes usar la "External Database URL" en lugar de la "Internal Database URL". ` +
        `Detalle técnico: ${error.message}`
      );
    } else {
      console.warn('[PostgreSQL Init Notice]:', error.message);
    }
    return { success: false, message: error.message };
  }
}
