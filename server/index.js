import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import pool from './db.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(cors());
app.use(express.json());

async function ensureUsersTable() {
  const [tableExistsRows] = await pool.query("SHOW TABLES LIKE 'users'");
  if (!tableExistsRows.length) {
    await pool.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100) NULL,
        role VARCHAR(30) NOT NULL DEFAULT 'viewer',
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        last_login_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    return;
  }

  const [columns] = await pool.query('SHOW COLUMNS FROM users');
  const columnNames = new Set(columns.map((column) => column.Field.toLowerCase()));
  const alterations = [];

  if (!columnNames.has('email')) {
    alterations.push("ADD COLUMN email VARCHAR(100) NULL UNIQUE");
  }
  if (!columnNames.has('password_hash')) {
    alterations.push("ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT ''");
  }
  if (!columnNames.has('full_name')) {
    alterations.push("ADD COLUMN full_name VARCHAR(100) NULL");
  }
  if (!columnNames.has('role')) {
    alterations.push("ADD COLUMN role VARCHAR(30) NOT NULL DEFAULT 'viewer'");
  }
  if (!columnNames.has('is_active')) {
    alterations.push("ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1");
  }
  if (!columnNames.has('last_login_at')) {
    alterations.push("ADD COLUMN last_login_at DATETIME NULL");
  }
  if (!columnNames.has('created_at')) {
    alterations.push("ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
  }
  if (!columnNames.has('updated_at')) {
    alterations.push("ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
  }

  if (alterations.length) {
    await pool.query(`ALTER TABLE users ${alterations.join(', ')}`);
  }
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

function readString(value, fallback = '') {
  if (typeof value === 'string') {
    return value.trim();
  }
  return fallback;
}

function buildUserPayload(row) {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    full_name: row.full_name,
    role: row.role,
    is_active: !!row.is_active,
    created_at: row.created_at,
    last_login_at: row.last_login_at
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/reports', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
        m.id,
        m.file_name,
        m.source_url,
        m.media_type,
        m.file_extension,
        m.storage_path,
        m.file_size_bytes,
        m.duration_seconds,
        m.width,
        m.height,
        m.fps,
        m.recorded_at,
        m.created_at,
        GROUP_CONCAT(DISTINCT o.code SEPARATOR ',') AS tags,
        GROUP_CONCAT(DISTINCT CONCAT(o.code, ':', COALESCE(s.detected_count, 0)) SEPARATOR ',') AS metric_pairs
      FROM media_files m
      LEFT JOIN media_detection_summary s ON s.media_file_id = m.id
      LEFT JOIN object_types o ON o.id = s.object_type_id
      GROUP BY m.id
      ORDER BY m.created_at DESC`
    );

    const records = rows.map((row) => ({
      id: row.id,
      name: row.file_name,
      source: row.source_url || 'upload',
      ext: String(row.file_extension || '').toUpperCase(),
      kind: row.media_type || 'video',
      duration: row.duration_seconds != null ? formatDuration(row.duration_seconds) : 'ภาพนิ่ง',
      date: row.recorded_at ? formatDate(row.recorded_at) : formatDate(row.created_at),
      time: row.recorded_at ? formatTime(row.recorded_at) : formatTime(row.created_at),
      size: row.file_size_bytes != null ? formatBytes(row.file_size_bytes) : '0 MB',
      resolution: row.width && row.height ? `${row.width} x ${row.height}` : '-',
      fps: row.fps != null ? String(row.fps) : '-',
      recorder: 'admin',
      tags: row.tags ? row.tags.split(',') : [],
      metrics: row.metric_pairs ? Object.fromEntries(row.metric_pairs.split(',').map((pair) => {
        const [key, value] = pair.split(':');
        return [key, Number(value) || 0];
      })) : {},
      image: '/assets/surveillance-road.png'
    }));

    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Cannot load reports' });
  }
});

function formatDuration(seconds) {
  if (seconds == null) return 'ภาพนิ่ง';
  const secs = Number(seconds);
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const remaining = Math.floor(secs % 60);
  if (hours) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
}

function formatDate(dateValue) {
  const date = new Date(dateValue);
  return date.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(dateValue) {
  const date = new Date(dateValue);
  return date.toLocaleTimeString('th-TH', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatBytes(bytes) {
  if (bytes == null) return '0 MB';
  const mb = Number(bytes) / 1024 / 1024;
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
  return `${mb.toFixed(2).replace(/\.00$/, '')} MB`;
}

function parseDuration(durationText) {
  if (!durationText) return null;
  const parts = String(durationText).split(':').map((part) => Number(part));
  if (parts.some(Number.isNaN)) return null;
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0];
}

function parseFileSize(sizeText) {
  if (!sizeText) return 0;
  const normalized = String(sizeText).trim().toUpperCase();
  const match = normalized.match(/([\d.]+)\s*(KB|MB|GB|TB)?/);
  if (!match) return 0;
  const value = Number(match[1]);
  const unit = match[2] || 'B';
  switch (unit) {
    case 'TB': return Math.round(value * 1024 ** 4);
    case 'GB': return Math.round(value * 1024 ** 3);
    case 'MB': return Math.round(value * 1024 ** 2);
    case 'KB': return Math.round(value * 1024);
    default: return Math.round(value);
  }
}

function parseResolution(resolutionText) {
  if (!resolutionText) return { width: null, height: null };
  const match = String(resolutionText).match(/(\d+)\s*x\s*(\d+)/i);
  if (!match) return { width: null, height: null };
  return { width: Number(match[1]), height: Number(match[2]) };
}

async function ensureObjectType(code) {
  if (!code) return null;
  const [rows] = await pool.query('SELECT id FROM object_types WHERE code = ? LIMIT 1', [code]);
  if (rows.length) return rows[0].id;
  const [result] = await pool.query(
    'INSERT INTO object_types (code, name_th, name_en, icon_name, is_active) VALUES (?, ?, ?, ?, 1)',
    [code, code, code, code.toLowerCase()]
  );
  return result.insertId;
}

app.post('/api/auth/register', async (req, res) => {
  const body = req.body || {};
  const username = readString(body.username || body.userName || body.loginName).toLowerCase();
  const email = readString(body.email || body.mail).toLowerCase();
  const password = readString(body.password || body.pass || body.pwd);
  const fullName = readString(body.fullName || body.full_name || body.name || body.displayName);
  const role = readString(body.role || 'viewer').toLowerCase();

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'username and password are required' });
  }

  if (!email) {
    return res.status(400).json({ success: false, error: 'email is required' });
  }

  try {
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
      [username, email]
    );

    if (existing.length) {
      return res.status(409).json({ success: false, error: 'username or email already exists' });
    }

    const passwordHash = hashPassword(password);
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password_hash, full_name, role, is_active) VALUES (?, ?, ?, ?, ?, 1)',
      [username, email, passwordHash, fullName || username, role || 'viewer', 1]
    );

    const [rows] = await pool.query(
      'SELECT id, username, email, full_name, role, is_active, created_at, last_login_at FROM users WHERE id = ? LIMIT 1',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: buildUserPayload(rows[0])
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Unable to create user' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const body = req.body || {};
  const usernameOrEmail = readString(body.username || body.email || body.login || body.userName || body.user).toLowerCase();
  const password = readString(body.password || body.pass || body.pwd);

  if (!usernameOrEmail || !password) {
    return res.status(400).json({ success: false, error: 'username/email and password are required' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, username, email, full_name, role, password_hash, is_active, created_at, last_login_at FROM users WHERE (username = ? OR email = ?) LIMIT 1',
      [usernameOrEmail, usernameOrEmail]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    const user = rows[0];
    if (user.password_hash !== hashPassword(password)) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, error: 'Account is disabled' });
    }

    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);

    res.json({
      success: true,
      message: 'Login successful',
      user: buildUserPayload(user)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Unable to login' });
  }
});

app.post('/api/reports', async (req, res) => {
  const {
    fileName,
    source,
    ext,
    kind,
    duration,
    size,
    resolution,
    fps,
    recorder,
    tags,
    metrics,
    model
  } = req.body;

  if (!fileName || !ext || !kind) {
    return res.status(400).json({ error: 'Missing required report fields' });
  }

  const fileType = kind === 'image' ? 'image' : 'video';
  const sourceType = source && /^(https?:\/\/|rtsp:|rtmp:)/i.test(source) ? 'stream' : 'upload';
  const durationSeconds = parseDuration(duration);
  const fileSizeBytes = parseFileSize(size);
  const { width, height } = parseResolution(resolution);
  const fpsValue = typeof fps === 'number' ? fps : Number(String(fps).replace(/[^0-9.]/g, '')) || null;
  const fileUuid = uuidv4();
  const storagePath = `/uploads/${fileUuid}.${ext.toLowerCase()}`;
  const sourceUrl = source || null;
  const recordedAt = new Date();

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [insertResult] = await connection.query(
      `INSERT INTO media_files
        (file_uuid, file_name, original_file_name, media_type, file_extension, source_type,
         source_url, storage_path, thumbnail_path, file_size_bytes, duration_seconds,
         width, height, fps, recorded_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [fileUuid, fileName, fileName, fileType, ext.toLowerCase(), sourceType,
       sourceUrl, storagePath, null, fileSizeBytes, durationSeconds,
       width, height, fpsValue, recordedAt, 'completed']
    );

    const mediaFileId = insertResult.insertId;

    if (Array.isArray(tags) && tags.length) {
      for (const code of tags) {
        const objectTypeId = await ensureObjectType(code);
        if (!objectTypeId) continue;
        await connection.query(
          'INSERT IGNORE INTO media_object_types (media_file_id, object_type_id) VALUES (?, ?)',
          [mediaFileId, objectTypeId]
        );
      }
    }

    if (metrics && typeof metrics === 'object') {
      for (const [code, count] of Object.entries(metrics)) {
        const detectedCount = Number(count) || 0;
        if (detectedCount <= 0) continue;
        const objectTypeId = await ensureObjectType(code);
        if (!objectTypeId) continue;
        await connection.query(
          `INSERT INTO media_detection_summary
            (media_file_id, object_type_id, detected_count, model_name, model_version, confidence_threshold, processed_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE detected_count = VALUES(detected_count), updated_at = CURRENT_TIMESTAMP`,
          [mediaFileId, objectTypeId, detectedCount, model || null, null, null, new Date()]
        );
      }
    }

    await connection.commit();
    res.status(201).json({ id: mediaFileId });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ error: 'Cannot save report' });
  } finally {
    connection.release();
  }
});

async function startServer() {
  await ensureUsersTable();
  app.listen(port, () => {
    console.log(`Backend API server running on http://127.0.0.1:${port}`);
  });
}

startServer();
