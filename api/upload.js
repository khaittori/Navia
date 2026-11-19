// api/upload.js
import { handleUpload } from '@vercel/blob/client';

export default async function handler(req, res) {
  const jsonResponse = await handleUpload({
    body: req.body,
    request: req,
    onBeforeGenerateToken: async () => {
      return {
        allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        maximumSizeInBytes: 5 * 1024 * 1024, // 5MB
      };
    },
    onUploadCompleted: async ({ blob }) => {
      console.log('Upload completed:', blob.url);
    },
  });

  return res.status(jsonResponse.status).json(jsonResponse.body);
}