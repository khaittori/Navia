import React, { useState } from 'react';
import { upload } from '@vercel/blob/client';

const UrlForm = () => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [shortUrl, setShortUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShortUrl('');

    try {
      let thumbnailUrl = null;

      // 1. Upload thumbnail dulu (kalau ada) pakai client-side upload
      if (thumbnailFile) {
        setUploading(true);
        const blob = await upload(thumbnailFile.name, thumbnailFile, {
          access: 'public',
          handleUploadUrl: '/api/upload',
        });
        thumbnailUrl = blob.url;
        setUploading(false);
      }

      // 2. Kirim data ke create-url sebagai JSON
      const res = await fetch('/api/create-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalUrl,
          description,
          thumbnailUrl,
        }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text || `Server error (${res.status})`);
      }

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to create short URL');
      }

      setShortUrl(data.shortUrl);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', padding: 20 }}>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="originalUrl" style={{ display: 'block', marginBottom: 6 }}>
            Original URL *
          </label>
          <input
            id="originalUrl"
            type="url"
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            placeholder="https://example.com/very-long-url"
            required
            style={{ width: '100%', padding: 10, fontSize: 16 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="description" style={{ display: 'block', marginBottom: 6 }}>
            Description (optional)
          </label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Judul / deskripsi singkat"
            style={{ width: '100%', padding: 10, fontSize: 16 }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label htmlFor="thumbnail" style={{ display: 'block', marginBottom: 6 }}>
            Thumbnail (optional, max 4MB)
          </label>
          <input
            id="thumbnail"
            type="file"
            accept="image/*"
            onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
            style={{ width: '100%' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !originalUrl}
          style={{
            width: '100%',
            padding: 12,
            fontSize: 16,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? (uploading ? 'Uploading thumbnail...' : 'Creating...') : 'Create Short URL'}
        </button>
      </form>

      {error && (
        <p style={{ color: '#ff6b6b', marginTop: 16, wordBreak: 'break-word' }}>
          {error}
        </p>
      )}

      {shortUrl && (
        <div style={{ marginTop: 24, padding: 16, background: '#e8f5e9', borderRadius: 8, color: '#1b5e20' }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>Short URL berhasil dibuat:</p>
          <a
            href={shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ wordBreak: 'break-all', color: '#1565c0' }}
          >
            {shortUrl}
          </a>
        </div>
      )}
    </div>
  );
};

export default UrlForm;