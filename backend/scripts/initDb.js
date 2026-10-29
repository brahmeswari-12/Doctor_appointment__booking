/**
 * Creates the database and all tables by running database/schema.sql,
 * then applies small additive migrations so an existing database is upgraded
 * in place instead of having to be dropped.
 * Usage: npm run db:init
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Columns added to `appointments` by the payments feature. Applied only when
// missing, so running db:init repeatedly is safe.
const APPOINTMENT_PAYMENT_COLUMNS = [
  {
    name: 'payment_status',
    ddl: "ADD COLUMN `payment_status` ENUM('unpaid','pending','paid','failed','refunded') NOT NULL DEFAULT 'unpaid' AFTER `status`",
  },
  {
    name: 'payment_method',
    ddl: 'ADD COLUMN `payment_method` VARCHAR(30) NULL AFTER `payment_status`',
  },
  {
    name: 'amount',
    ddl: 'ADD COLUMN `amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER `payment_method`',
  },
  {
    name: 'payment_reference',
    ddl: 'ADD COLUMN `payment_reference` VARCHAR(100) NULL AFTER `amount`',
  },
  {
    name: 'paid_at',
    ddl: 'ADD COLUMN `paid_at` DATETIME NULL AFTER `payment_reference`',
  },
];

/** Adds any missing payment columns + index to an already-existing appointments table. */
async function migrateAppointments(connection, database) {
  const [columnRows] = await connection.query(
    'SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
    [database, 'appointments']
  );
  const existing = new Set(columnRows.map((row) => row.name.toLowerCase()));

  const added = [];
  for (const column of APPOINTMENT_PAYMENT_COLUMNS) {
    if (existing.has(column.name)) continue;
    await connection.query(`ALTER TABLE \`appointments\` ${column.ddl}`);
    added.push(column.name);
  }

  const [indexRows] = await connection.query(
    'SELECT INDEX_NAME AS name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?',
    [database, 'appointments', 'idx_appt_payment_status']
  );
  if (!indexRows.length) {
    await connection.query('ALTER TABLE `appointments` ADD KEY `idx_appt_payment_status` (`payment_status`)');
    added.push('idx_appt_payment_status');
  }

  return added;
}

async function main() {
  const database = process.env.DB_NAME || 'doctor_appointment_db';
  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  await connection.query(sql);

  const added = await migrateAppointments(connection, database);
  if (added.length) {
    console.log(`[db:init] Migrated appointments table: added ${added.join(', ')}`);
  }

  await connection.end();

  console.log(`[db:init] Database "${database}" and all tables are ready.`);
}

main().catch((err) => {
  console.error('[db:init] Failed:', err.message);
  process.exit(1);
});
