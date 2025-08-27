// src/components/Redirector.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async'; // Import Helmet
import { supabase } from '../supabaseClient';

const Redirector = () => {
  const { shortCode } = useParams();
  const [urlData, setUrlData] = useState(null); // Simpan data URL lengkap
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUrlAndData = async () => {
      if (!shortCode) {
        setError('Short code not provided.');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('urls')
          .select('original_url, description, thumbnail_url') // Ambil deskripsi dan thumbnail_url
          .eq('short_code', shortCode)
          .single();

        if (error) {
          throw error;
        }

        if (data && data.original_url) {
          setUrlData(data); // Simpan data yang diambil
          // Lakukan redirect setelah semua data (termasuk meta tag) siap
          // window.location.href = data.original_url; // Redirect setelah meta tag di-render
        } else {
          setError('Short URL not found.');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching URL:', error);
        setError(`Error: ${error.message}`);
        setLoading(false);
      }
    };

    fetchUrlAndData();
  }, [shortCode]);

  // Efek untuk melakukan redirect setelah data diterima dan meta tag siap
  useEffect(() => {
    if (urlData && urlData.original_url) {
      // Beri sedikit jeda agar meta tag sempat di-render dan diambil oleh platform
      // Durasi jeda mungkin perlu disesuaikan atau dioptimalkan
      const timer = setTimeout(() => {
        window.location.href = urlData.original_url;
      }, 500); // Jeda 500ms (opsional)

      return () => clearTimeout(timer); // Clear timer jika komponen unmount
    }
  }, [urlData]); // Jalankan efek ini setiap kali urlData berubah

  if (loading) {
    return (
      <div>
        {/* Meta tag akan di-render di sini jika urlData tersedia */}
        {urlData && (
          <Helmet>
            <title>{urlData.description || 'URL Shortener Preview'}</title>
            <meta property="og:title" content={urlData.description || 'Short URL Preview'} />
            <meta property="og:description" content={`Visit this shortened URL: ${window.location.origin}/short/${shortCode}`} />
            {urlData.thumbnail_url && (
              <meta property="og:image" content={urlData.thumbnail_url} />
            )}
            <meta property="og:url" content={window.location.href} />
            <meta property="og:type" content="website" />
            {/* Tambahkan tag meta lain jika perlu, contoh: */}
            {/* <meta name="twitter:card" content="summary_large_image"/> */}
          </Helmet>
        )}
        <p>Loading and preparing redirect...</p>
      </div>
    );
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  // Seharusnya tidak sampai sini jika redirect berhasil
  return null;
};

export default Redirector;