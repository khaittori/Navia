import React, { useState } from 'react';

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
      const formData = new FormData();
      formData.append('originalUrl', originalUrl);
      formData.append('description', description);
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
        setUploading(true);
      }

      const res = await fetch('/api/create-url', {
        method: 'POST',
        body: formData, // jangan set Content-Type manual
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create short URL');
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
          {loading ? (uploading ? 'Uploading...' : 'Creating...') : 'Create Short URL'}
        </button>
      </form>

      {error && (
        <p style={{ color: 'red', marginTop: 16 }}>{error}</p>
      )}

      {shortUrl && (
        <div style={{ marginTop: 24, padding: 16, background: '#e8f5e9', borderRadius: 8 }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>Short URL berhasil dibuat:</p>
          <a
            href={shortUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ wordBreak: 'break-all' }}
          >
            {shortUrl}
          </a>
        </div>
      )}
    </div>
  );
};

export default UrlForm;