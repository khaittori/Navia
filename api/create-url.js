// api/create-url.js
import { createClient } from '@libsql/client';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validasi env
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.error('Missing Turso env vars');
    return res.status(500).json({ error: 'Server misconfigured: missing database credentials' });
  }

  try {
    const { originalUrl, description = '', thumbnailUrl = null } = req.body || {};

    if (!originalUrl || typeof originalUrl !== 'string') {
      return res.status(400).json({ error: 'originalUrl is required' });
    }

    // Validasi URL
    try {
      new URL(originalUrl);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const turso = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    // Generate short code unik
    function generateShortCode() {
      return Math.random().toString(36).substring(2, 8);
    }

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
      args: [originalUrl.trim(), shortCode, description.trim() || null, thumbnailUrl],
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
    return res.status(500).json({
      error: err.message || 'Internal server error',
    });
  }
}