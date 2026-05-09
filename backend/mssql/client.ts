import sql from "mssql";

let poolPromise: Promise<sql.ConnectionPool> | null = null;

function getConnectionConfig(): sql.config | string {
  if (process.env.MSSQL_CONNECTION_STRING) {
    return process.env.MSSQL_CONNECTION_STRING;
  }

  const server = process.env.MSSQL_SERVER;
  const database = process.env.MSSQL_DATABASE;
  const user = process.env.MSSQL_USER;
  const password = process.env.MSSQL_PASSWORD;

  if (!server || !database || !user || !password) {
    throw new Error("MSSQL connection is not configured");
  }

  return {
    server,
    database,
    user,
    password,
    port: Number(process.env.MSSQL_PORT ?? 1433),
    options: {
      encrypt: process.env.MSSQL_ENCRYPT !== "false",
      trustServerCertificate: process.env.MSSQL_TRUST_SERVER_CERTIFICATE === "true",
    },
    pool: {
      max: Number(process.env.MSSQL_POOL_MAX ?? 10),
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };
}

export async function getMssqlPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(getConnectionConfig()).connect();
  }

  return poolPromise;
}

export async function query<T>(text: string, params: Record<string, unknown> = {}) {
  const pool = await getMssqlPool();
  const request = pool.request();

  Object.entries(params).forEach(([key, value]) => {
    request.input(key, value as sql.ISqlTypeFactoryWithNoParams | sql.ISqlTypeFactoryWithLength | unknown);
  });

  const result = await request.query<T>(text);
  return result.recordset;
}

export async function queryOne<T>(text: string, params: Record<string, unknown> = {}) {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function withTransaction<T>(
  callback: (request: <Row>(text: string, params?: Record<string, unknown>) => Promise<Row[]>) => Promise<T>,
) {
  const pool = await getMssqlPool();
  const transaction = new sql.Transaction(pool);

  await transaction.begin();

  const run = async <Row>(text: string, params: Record<string, unknown> = {}) => {
    const request = new sql.Request(transaction);

    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value as sql.ISqlTypeFactoryWithNoParams | sql.ISqlTypeFactoryWithLength | unknown);
    });

    const result = await request.query<Row>(text);
    return result.recordset;
  };

  try {
    const result = await callback(run);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export { sql };
