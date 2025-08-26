// src/components/UrlForm.jsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient'; // Pastikan path ini benar sesuai struktur folder Anda

const UrlForm = () => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [loading, setLoading] = useState(false); // Status loading untuk keseluruhan proses
  const [uploading, setUploading] = useState(false); // Status loading khusus untuk upload thumbnail
  const [shortUrl, setShortUrl] = useState('');
  const [error, setError] = useState('');

  const generateShortCode = () => {
    // Logika sederhana untuk menghasilkan kode pendek (bisa dibuat lebih kompleks)
    // Menggunakan huruf kecil dan angka, panjang 6 karakter
    return Math.random().toString(36).substring(2, 8);
  };

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setThumbnailFile(event.target.files[0]);
    } else {
      setThumbnailFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Aktifkan loading utama
    setError('');
    setShortUrl(''); // Reset hasil sebelumnya

    if (!originalUrl) {
      setError('Original URL is required.');
      setLoading(false);
      return;
    }

    let thumbnailUrl = null;
    let uploadError = null; // Gunakan 'let' agar bisa diassign ulang

    // 1. Upload Thumbnail jika ada file yang dipilih
    if (thumbnailFile) {
      setUploading(true); // Aktifkan status uploading thumbnail
      const fileExt = thumbnailFile.name.split('.').pop();
      // Membuat nama file unik: timestamp + random string + ekstensi
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `thumbnails/${fileName}`; // Path di dalam bucket Supabase Storage

      try {
        // Upload file ke Supabase Storage
        const { error: uploadErr } = await supabase.storage
          .from('thumbnails') // Nama bucket Anda di Supabase Storage
          .upload(filePath, thumbnailFile, {
            cacheControl: '3600', // Cache selama 1 jam (sesuaikan jika perlu)
            upsert: true, // Timpa file jika sudah ada dengan nama yang sama
          });

        if (uploadErr) {
          uploadError = uploadErr; // Simpan error upload
          throw uploadErr; // Lanjut ke catch block untuk penanganan error terpusat
        }

        // Jika upload berhasil, dapatkan URL publik dari file yang diunggah
        // Pastikan bucket 'thumbnails' Anda diatur ke 'Public' di Supabase UI
        const { publicURL, error: urlError } = supabase.storage
          .from('thumbnails')
          .getPublicUrl(filePath);

        if (urlError) {
          uploadError = urlError; // Simpan error saat mendapatkan URL
          throw urlError; // Lanjut ke catch block
        }
        thumbnailUrl = publicURL; // Simpan URL thumbnail jika berhasil
        // console.log('Thumbnail uploaded successfully:', thumbnailUrl);

      } catch (error) {
        console.error('Error handling thumbnail:', error);
        setError(`Error processing thumbnail: ${error.message}`);
        // Pastikan status loading direset jika ada error pada thumbnail
        setUploading(false);
        setLoading(false);
        return; // Hentikan proses lebih lanjut jika ada error pada thumbnail
      } finally {
        setUploading(false); // Reset status upload thumbnail
      }
    }

    // Jika ada error saat memproses thumbnail, hentikan proses di sini
    if (uploadError) {
      // Error sudah ditampilkan oleh blok catch di atas, hanya perlu menghentikan proses
      // setLoading(false); // Sudah di-reset di catch block
      return;
    }

    // 2. Generate Short Code dan Simpan Data ke Database
    const shortCode = generateShortCode();
    try {
      const { data, error: dbError } = await supabase
        .from('urls')
        .insert([
          {
            original_url: originalUrl,
            short_code: shortCode,
            description: description,
            thumbnail_url: thumbnailUrl, // Simpan URL thumbnail (bisa null jika tidak ada)
          },
        ])
        .select(); // select() untuk mendapatkan data yang baru dimasukkan

      if (dbError) {
        throw dbError; // Lanjut ke catch block untuk penanganan error database
      }

      if (data && data.length > 0) {
        // Gunakan window.location.origin untuk mendapatkan domain aplikasi saat ini
        // Ini akan bekerja secara otomatis baik di localhost maupun setelah deploy
        const newShortUrl = `${window.location.origin}/short/${data[0].short_code}`;
        setShortUrl(newShortUrl);
        // console.log('URL created:', newShortUrl);
      }
    } catch (error) {
      console.error('Error saving to database:', error);
      setError(`Error creating short URL: ${error.message}`);
    } finally {
      setLoading(false); // Reset loading utama setelah proses selesai (baik berhasil maupun gagal)
    }
  };

  return (
    <div className="url-form-container" style={{ maxWidth: '600px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'Arial, sans-serif', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>Create a Short URL</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label htmlFor="originalUrl" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Original URL:</label>
          <input
            type="url"
            id="originalUrl"
            value={originalUrl}
            onChange={(e) => setOriginalUrl(e.target.value)}
            required
            style={{ width: 'calc(100% - 20px)', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '16px' }}
            placeholder="e.g., https://example.com/your-long-url"
          />
        </div>
        <div>
          <label htmlFor="description" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Description (Optional):</label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: 'calc(100% - 20px)', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '16px' }}
            placeholder="Add a short description"
          />
        </div>
        <div>
          <label htmlFor="thumbnail" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Thumbnail (Optional):</label>
          <input
            type="file"
            id="thumbnail"
            accept="image/*" // Hanya menerima file gambar
            onChange={handleFileChange}
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', width: '100%', fontSize: '16px', backgroundColor: '#f8f9fa' }}
          />
          {thumbnailFile && (
            <p style={{ fontSize: '0.9em', color: '#555', marginTop: '5px' }}>
              Selected: {thumbnailFile.name}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading || uploading} // Tombol nonaktif jika sedang loading atau uploading
          style={{
            padding: '12px 20px',
            backgroundColor: (loading || uploading) ? '#aaa' : '#007bff', // Warna berbeda saat disabled
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: (loading || uploading) ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            transition: 'background-color 0.3s ease, opacity 0.3s ease',
            opacity: (loading || uploading) ? 0.7 : 1
          }}
        >
          {uploading ? 'Uploading Thumbnail...' : (loading ? 'Processing...' : 'Create Short URL')}
        </button>
      </form>

      {/* Menampilkan Error Message */}
      {error && <p style={{ color: 'red', textAlign: 'center', marginTop: '15px', fontWeight: 'bold' }}>Error: {error}</p>}

      {/* Menampilkan Hasil URL Pendek */}
      {shortUrl && (
        <div style={{ marginTop: '20px', textAlign: 'center', borderTop: '1px solid #eee', paddingTop: '15px' }}>
          <h3 style={{ marginBottom: '10px', color: '#333' }}>Your Short URL:</h3>
          <p style={{ backgroundColor: '#e9ecef', padding: '10px', borderRadius: '4px', wordBreak: 'break-all', fontSize: '1.1em', color: '#0056b3' }}>
            <a href={shortUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', textDecoration: 'none', wordBreak: 'break-all' }}>
              {shortUrl}
            </a>
          </p>
          {/* Menampilkan preview thumbnail jika ada */}
          {thumbnailFile && (
            <div style={{ marginTop: '15px' }}>
              <h4 style={{ marginBottom: '10px', color: '#555' }}>Thumbnail Preview:</h4>
              <img
                src={thumbnailFile.previewURL || URL.createObjectURL(thumbnailFile)}
                alt="Thumbnail Preview"
                style={{ maxWidth: '150px', maxHeight: '150px', borderRadius: '4px', border: '1px solid #ddd' }}
                // Cleanup the object URL after component unmounts or when file changes
                // This is a basic example, for production consider useEffect cleanup
                onError={(e) => { e.target.src = 'path/to/fallback/image.png'; }} // Fallback image jika preview gagal
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UrlForm;