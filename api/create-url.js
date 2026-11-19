// api/create-url.js
import { createClient } from '@libsql/client';
import { put } from '@vercel/blob';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

function generateShortCode() {
  return Math.random().toString(36).substring(2, 8);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      maxFileSize: 4 * 1024 * 1024, // 4MB
    });

    const [fields, files] = await form.parse(req);

    const originalUrl = fields.originalUrl?.[0];
    const description = fields.description?.[0] || '';
    const thumbnailFile = files.thumbnail?.[0];

    if (!originalUrl) {
      return res.status(400).json({ error: 'originalUrl is required' });
    }

    let thumbnailUrl = null;

    // Upload ke Vercel Blob
    if (thumbnailFile) {
      const fileBuffer = fs.readFileSync(thumbnailFile.filepath);
      const originalName = thumbnailFile.originalFilename || 'thumbnail.jpg';
      const fileExt = originalName.split('.').pop() || 'jpg';
      const fileName = `thumbnails/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      const blob = await put(fileName, fileBuffer, {
        access: 'public',
        contentType: thumbnailFile.mimetype || 'image/jpeg',
      });

      thumbnailUrl = blob.url;

      // Hapus file temporary
      try {
        fs.unlinkSync(thumbnailFile.filepath);
      } catch (e) {}
    }

    // Generate short code unik
    let shortCode = generateShortCode();
    let attempts = 0;
    while (attempts < 5) {
      const check = await turso.execute({
        sql: 'SELECT id FROM urls WHERE short_code = ?',
        args: [shortCode],
      });
      if (check.rows.length === 0) break;
      shortCode = generateShortCode();
      attempts++;
    }

    // Simpan ke Turso
    await turso.execute({
      sql: `INSERT INTO urls (original_url, short_code, description, thumbnail_url)
            VALUES (?, ?, ?, ?)`,
      args: [originalUrl, shortCode, description, thumbnailUrl],
    });

    const origin = req.headers.origin || `https://${req.headers.host}`;
    const shortUrl = `${origin}/short/${shortCode}`;

    return res.status(201).json({
      success: true,
      shortCode,
      shortUrl,
      thumbnailUrl,
    });
  } catch (err) {
    console.error('Error creating short URL:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}