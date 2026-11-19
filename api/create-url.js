// api/create-url.js
import { createClient } from '@libsql/client/web';
import { put } from '@vercel/blob';

export const config = {
  runtime: 'edge',
};

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

function generateShortCode() {
  return Math.random().toString(36).substring(2, 8);
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const formData = await req.formData();
    const originalUrl = formData.get('originalUrl');
    const description = formData.get('description') || '';
    const thumbnailFile = formData.get('thumbnail'); // File | null

    if (!originalUrl) {
      return new Response(JSON.stringify({ error: 'originalUrl is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let thumbnailUrl = null;

    // Upload ke Vercel Blob jika ada file
    if (thumbnailFile && thumbnailFile.size > 0) {
      const fileExt = thumbnailFile.name.split('.').pop() || 'jpg';
      const fileName = `thumbnails/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

      const blob = await put(fileName, thumbnailFile, {
        access: 'public',
        addRandomSuffix: false,
      });

      thumbnailUrl = blob.url;
    }

    // Generate short code unik (retry sederhana)
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

    const origin = new URL(req.url).origin;
    const shortUrl = `${origin}/short/${shortCode}`;

    return new Response(
      JSON.stringify({
        success: true,
        shortCode,
        shortUrl,
        thumbnailUrl,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('Error creating short URL:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}