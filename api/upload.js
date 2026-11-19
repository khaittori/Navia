// api/upload.js
import { handleUpload } from '@vercel/blob/client';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'image/jpg',
          ],
          maximumSizeInBytes: 4 * 1024 * 1024, // 4MB
          tokenPayload: JSON.stringify({}),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('Blob upload completed:', blob.url);
      },
    });

    return res.status(jsonResponse.status).json(jsonResponse.body);
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(400).json({ error: error.message || 'Upload failed' });
  }
}