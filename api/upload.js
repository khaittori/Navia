// api/upload.js
import { put } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Baca file dari FormData
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Ambil filename dari header
    const contentType = req.headers['content-type'] || '';
    const filename = req.headers['x-filename'] || `thumbnail-${Date.now()}.jpg`;

    if (!buffer || buffer.length === 0) {
      return res.status(400).json({ error: 'No file received' });
    }

    if (buffer.length > 4 * 1024 * 1024) {
      return res.status(400).json({ error: 'File too large (max 4MB)' });
    }

    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: contentType.includes('image/') ? contentType : 'image/jpeg',
      addRandomSuffix: true,
    });

    return res.status(200).json({
      url: blob.url,
      pathname: blob.pathname,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      error: error.message || 'Upload failed',
    });
  }
}