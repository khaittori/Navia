// api/create-url.js
import { createClient } from '@libsql/client';

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
    const { originalUrl, description = '', thumbnailUrl = null } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ error: 'originalUrl is required' });
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

    // Insert ke Turso
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