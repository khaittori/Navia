import { neon } from '@neondatabase/serverless';
import { put } from '@vercel/blob';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse form data
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB
    });

    const [fields, files] = await form.parse(req);

    const originalUrl = fields.originalUrl?.[0];
    const description = fields.description?.[0] || '';
    const thumbnail = files.thumbnail?.[0];

    if (!originalUrl) {
      return res.status(400).json({ error: 'Original URL is required' });
    }

    // Upload thumbnail ke Vercel Blob
    let thumbnailUrl = null;
    if (thumbnail) {
      const fileBuffer = fs.readFileSync(thumbnail.filepath);
      const blob = await put(
        `thumbnails/${Date.now()}-${thumbnail.originalFilename}`,
        fileBuffer,
        {
          access: 'public',
          token: process.env.BLOB_READ_WRITE_TOKEN,
          contentType: thumbnail.mimetype,
        }
      );
      thumbnailUrl = blob.url;

      // Hapus file temporary
      fs.unlinkSync(thumbnail.filepath);
    }

    // Generate short code
    const shortCode = Math.random().toString(36).substring(2, 8);

    // Simpan ke Neon
    const sql = neon(process.env.DATABASE_URL);
    const result = await sql`
      INSERT INTO urls (original_url, short_code, description, thumbnail_url)
      VALUES (${originalUrl}, ${shortCode}, ${description}, ${thumbnailUrl})
      RETURNING short_code
    `;

    const origin = req.headers.origin || `http://${req.headers.host}`;
    const newShortUrl = `${origin}/short/${result[0].short_code}`;

    return res.status(200).json({
      shortUrl: newShortUrl,
      shortCode: result[0].short_code,
    });
  } catch (error) {
    console.error('Create URL error:', error);
    return res.status(500).json({ error: error.message });
  }
}