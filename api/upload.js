// api/upload.js
import { handleUpload } from '@vercel/blob/client';

export default async function handler(req, res) {
  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        // Izinkan hanya gambar
        return {
          allowedContentTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'image/jpg',
          ],
          maximumSizeInBytes: 4 * 1024 * 1024, // 4MB
          tokenPayload: JSON.stringify({}), // optional
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Blob upload completed:', blob.url);
      },
    });

    res.status(jsonResponse.status).json(jsonResponse.body);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(400).json({ error: error.message });
  }
}