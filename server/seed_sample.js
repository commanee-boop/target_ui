import pool from './db.js';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Ensure some object types
    const objectCodes = ['MV','AMV','LMV','AFV','CV','MCV'];
    const objectIds = {};
    for (const code of objectCodes) {
      const [rows] = await connection.query('SELECT id FROM object_types WHERE code = ? LIMIT 1', [code]);
      if (rows.length) {
        objectIds[code] = rows[0].id;
      } else {
        const [r] = await connection.query('INSERT INTO object_types (code, name_th, name_en, icon_name, is_active) VALUES (?, ?, ?, ?, 1)', [code, code, code, code.toLowerCase()]);
        objectIds[code] = r.insertId;
      }
    }

    // Insert two media files
    const files = [
      {
        file_name: 'convoy_2025_05_20_01',
        media_type: 'video',
        file_extension: 'mp4',
        source_type: 'url',
        source_url: 'https://stream.example.com/convoy1',
        file_size_bytes: 1240 * 1024 * 1024,
        duration_seconds: 135,
        width: 1920,
        height: 1080,
        fps: 25
      },
      {
        file_name: 'checkpoint_photo_01',
        media_type: 'image',
        file_extension: 'jpg',
        source_type: 'upload',
        source_url: null,
        file_size_bytes: 2450000,
        duration_seconds: null,
        width: 2560,
        height: 1440,
        fps: null
      }
    ];

    for (const f of files) {
      const fileUuid = uuidv4();
      const storagePath = `/uploads/${fileUuid}.${f.file_extension}`;
      const [insertRes] = await connection.query(
        `INSERT INTO media_files (file_uuid, file_name, original_file_name, media_type, file_extension, source_type, source_url, storage_path, thumbnail_path, file_size_bytes, duration_seconds, width, height, fps, recorded_at, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [fileUuid, f.file_name, f.file_name, f.media_type, f.file_extension, f.source_type, f.source_url, storagePath, null, f.file_size_bytes, f.duration_seconds, f.width, f.height, f.fps, new Date(), 'completed']
      );
      const mediaId = insertRes.insertId;

      // map some object types
      if (f.media_type === 'video') {
        // convoy: MV AMV LMV
        for (const code of ['MV','AMV','LMV']) {
          await connection.query('INSERT IGNORE INTO media_object_types (media_file_id, object_type_id) VALUES (?, ?)', [mediaId, objectIds[code]]);
        }
        // detection summary
        await connection.query(`INSERT INTO media_detection_summary (media_file_id, object_type_id, detected_count, model_name, model_version, confidence_threshold, processed_at)
                                VALUES (?, ?, ?, ?, ?, ?, ?)
                                ON DUPLICATE KEY UPDATE detected_count = VALUES(detected_count)`,
          [mediaId, objectIds['MV'], 11, 'yolo-25', '1.0', 0.5, new Date()]
        );
        await connection.query(`INSERT INTO media_detection_summary (media_file_id, object_type_id, detected_count, model_name, model_version, confidence_threshold, processed_at)
                                VALUES (?, ?, ?, ?, ?, ?, ?)
                                ON DUPLICATE KEY UPDATE detected_count = VALUES(detected_count)`,
          [mediaId, objectIds['AMV'], 18, 'yolo-25', '1.0', 0.5, new Date()]
        );
        await connection.query(`INSERT INTO media_detection_summary (media_file_id, object_type_id, detected_count, model_name, model_version, confidence_threshold, processed_at)
                                VALUES (?, ?, ?, ?, ?, ?, ?)
                                ON DUPLICATE KEY UPDATE detected_count = VALUES(detected_count)`,
          [mediaId, objectIds['LMV'], 32, 'yolo-25', '1.0', 0.5, new Date()]
        );
      } else {
        // image: MV AMV LMV
        for (const code of ['MV','AMV','LMV']) {
          await connection.query('INSERT IGNORE INTO media_object_types (media_file_id, object_type_id) VALUES (?, ?)', [mediaId, objectIds[code]]);
        }
        await connection.query(`INSERT INTO media_detection_summary (media_file_id, object_type_id, detected_count, model_name, model_version, confidence_threshold, processed_at)
                                VALUES (?, ?, ?, ?, ?, ?, ?)
                                ON DUPLICATE KEY UPDATE detected_count = VALUES(detected_count)`,
          [mediaId, objectIds['MV'], 3, 'yolo-25', '1.0', 0.5, new Date()]
        );
        await connection.query(`INSERT INTO media_detection_summary (media_file_id, object_type_id, detected_count, model_name, model_version, confidence_threshold, processed_at)
                                VALUES (?, ?, ?, ?, ?, ?, ?)
                                ON DUPLICATE KEY UPDATE detected_count = VALUES(detected_count)`,
          [mediaId, objectIds['AMV'], 4, 'yolo-25', '1.0', 0.5, new Date()]
        );
        await connection.query(`INSERT INTO media_detection_summary (media_file_id, object_type_id, detected_count, model_name, model_version, confidence_threshold, processed_at)
                                VALUES (?, ?, ?, ?, ?, ?, ?)
                                ON DUPLICATE KEY UPDATE detected_count = VALUES(detected_count)`,
          [mediaId, objectIds['LMV'], 7, 'yolo-25', '1.0', 0.5, new Date()]
        );
      }
    }

    await connection.commit();
    console.log('Seeding complete');
  } catch (e) {
    await connection.rollback();
    console.error('Seeding failed', e);
    process.exitCode = 1;
  } finally {
    connection.release();
    process.exit();
  }
}

seed();
