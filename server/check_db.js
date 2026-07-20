import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function check() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: Number(process.env.DB_PORT || 3306)
  });

  const [rows] = await conn.query("SHOW DATABASES LIKE 'military_detection'");
  console.log(rows);
  await conn.end();
}

check().catch((e) => { console.error(e); process.exit(1); });
