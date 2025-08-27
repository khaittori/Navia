// src/components/UrlForm.jsx

import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const UrlForm = () => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [shortUrl, setShortUrl] = useState('');
  const [error, setError] = useState('');

  const generateShortCode = () => Math.random().toString(36).substring(2, 8);

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

    console.log("--- DEBUG: Form submitted ---");

    if (!originalUrl) {
      setError('Original URL is required.');
      setLoading(false);
      return;
    }

    let finalThumbnailUrl = null;

    if (thumbnailFile) {
      setUploading(true);
      const fileExt = thumbnailFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `thumbnails/${fileName}`;

      console.log(`--- DEBUG: Uploading file: ${filePath} ---`);

      try {
        const { error: uploadError } = await supabase.storage
          .from('thumbnails')
          .upload(filePath, thumbnailFile);

        if (uploadError) {
          console.error("--- DEBUG: Supabase upload error ---", uploadError);
          throw uploadError;
        }
        console.log("--- DEBUG: File uploaded successfully ---");

        const { publicURL, error: urlError } = supabase.storage
          .from('thumbnails')
          .getPublicUrl(filePath);

        if (urlError) {
          console.error("--- DEBUG: Supabase getPublicUrl error ---", urlError);
          throw urlError;
        }

        finalThumbnailUrl = publicURL;
        console.log("--- DEBUG: Got public URL:", finalThumbnailUrl, "---");

      } catch (error) {
        setError(`Error processing thumbnail: ${error.message}`);
        setUploading(false);
        setLoading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    const shortCode = generateShortCode();
    const dataToInsert = {
      original_url: originalUrl,
      short_code: shortCode,
      description: description,
      thumbnail_url: finalThumbnailUrl,
    };

    console.log("--- DEBUG: Data to be inserted into database ---", dataToInsert);

    try {
      const { data, error: dbError } = await supabase
        .from('urls')
        .insert([dataToInsert])
        .select();

      if (dbError) {
        console.error("--- DEBUG: Supabase database insert error ---", dbError);
        throw dbError;
      }

      console.log("--- DEBUG: Data inserted successfully ---", data);

      if (data && data.length > 0) {
        const newShortUrl = `${window.location.origin}/short/${data[0].short_code}`;
        setShortUrl(newShortUrl);
      }
    } catch (error) {
      setError(`Error creating short URL: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    // ... JSX Anda tetap sama persis, tidak perlu diubah ...
    <div className="url-form-container" style={{ maxWidth: '600px', margin: '40px auto', padding: '30px', border: '1px solid #e0e0e0', borderRadius: '12px', fontFamily: 'Arial, sans-serif', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '25px', color: '#333' }}>Create a Custom Short URL</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label htmlFor="originalUrl" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>Original URL:</label>
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
          <label htmlFor="description" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>Description (for Link Preview):</label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: 'calc(100% - 22px)', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '16px' }}
            placeholder="e.g., My Awesome Product Page"
          />
        </div>
        <div>
          <label htmlFor="thumbnail" style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>Thumbnail (for Link Preview):</label>
          <input
            type="file"
            id="thumbnail"
            accept="image/*"
            onChange={handleFileChange}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%', fontSize: '16px', backgroundColor: '#f9f9f9' }}
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
            backgroundColor: (loading || uploading) ? '#b0b0b0' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: (loading || uploading) ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'background-color 0.3s ease, opacity 0.3s ease',
          }}
        >
          {uploading ? 'Uploading Thumbnail...' : (loading ? 'Creating Link...' : 'Create Short URL')}
        </button>
      </form>

      {error && <p style={{ color: '#d32f2f', textAlign: 'center', marginTop: '20px', fontWeight: 'bold' }}>{error}</p>}

      {shortUrl && (
        <div style={{ marginTop: '30px', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '20px' }}>
          <h3 style={{ marginBottom: '10px', color: '#333' }}>Your Short URL is Ready!</h3>
          <p style={{ backgroundColor: '#e9ecef', padding: '12px', borderRadius: '4px', wordBreak: 'break-all' }}>
            <a href={shortUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1em' }}>
              {shortUrl}
            </a>
          </p>
          {thumbnailFile && (
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ marginBottom: '10px', color: '#555' }}>Thumbnail Preview:</h4>
              <img
                src={URL.createObjectURL(thumbnailFile)}
                alt="Thumbnail Preview"
                style={{ maxWidth: '150px', maxHeight: '150px', borderRadius: '8px', border: '1px solid #ddd' }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UrlForm;