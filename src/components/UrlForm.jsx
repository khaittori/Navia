// src/components/UrlForm.jsx
import React, { useState } from 'react';
import { upload } from '@vercel/blob/client';

const UrlForm = () => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [shortUrl, setShortUrl] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setThumbnailFile(event.target.files[0]);
    } else {
      setThumbnailFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShortUrl('');

    try {
      let thumbnailUrl = null;

      // 1. Upload thumbnail langsung ke Vercel Blob (dari browser)
      if (thumbnailFile) {
        setUploading(true);
        const blob = await upload(thumbnailFile.name, thumbnailFile, {
          access: 'public',
          handleUploadUrl: '/api/upload', // kita buat endpoint ini
        });
        thumbnailUrl = blob.url;
        setUploading(false);
      }

      // 2. Kirim data ke API (hanya JSON)
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
    <div
      className="url-form-container"
      style={{
        maxWidth: '600px',
        margin: '40px auto',
        padding: '30px',
        border: '1px solid #e0e0e0',
        borderRadius: '12px',
        fontFamily: 'Arial, sans-serif',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      }}
    >
      <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#333' }}>
        Create a Custom Short URL
      </h2>
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
      >
        <div>
          <label htmlFor="originalUrl" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
            Original URL:
          </label>
          <input
            type="url"
            id="originalUrl"
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            required
            style={{ width: 'calc(100% - 22px)', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '16px' }}
            placeholder="e.g., https://example.com/your-very-long-url"
          />
        </div>

        <div>
          <label htmlFor="description" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
            Description (for Link Preview):
          </label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: 'calc(100% - 22px)', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '16px' }}
            placeholder="Optional description for Open Graph preview"
          />
        </div>

        <div>
          <label htmlFor="thumbnail" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
            Thumbnail (optional):
          </label>
          <input
            type="file"
            id="thumbnail"
            accept="image/*"
            onChange={handleFileChange}
            style={{ fontSize: '14px' }}
          />
          {thumbnailFile && (
            <p style={{ fontSize: '0.9em', color: '#555', marginTop: '8px', fontStyle: 'italic' }}>
              Selected: {thumbnailFile.name}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || uploading}
          style={{
            padding: '14px 20px',
            backgroundColor: loading || uploading ? '#b0b0b0' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading || uploading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          {uploading ? 'Uploading Thumbnail...' : loading ? 'Creating Link...' : 'Create Short URL'}
        </button>
      </form>

      {error && (
        <p style={{ color: '#d32f2f', textAlign: 'center', marginTop: '20px', fontWeight: 'bold' }}>
          {error}
        </p>
      )}

      {shortUrl && (
        <div style={{ marginTop: '30px', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '20px' }}>
          <h3 style={{ marginBottom: '10px', color: '#333' }}>Your Short URL is Ready!</h3>
          <p style={{ backgroundColor: '#e9ecef', padding: '12px', borderRadius: '4px', wordBreak: 'break-all' }}>
            <a href={shortUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1em' }}>
              {shortUrl}
            </a>
          </p>
        </div>
      )}
    </div>
  );
};

export default UrlForm;