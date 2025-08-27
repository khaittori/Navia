// src/components/Redirector.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async'; // Import Helmet
import { supabase } from '../supabaseClient'; // Pastikan path ini benar

const Redirector = () => {
  const { shortCode } = useParams(); // Dapatkan shortCode dari URL
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
        // Ambil URL asli, deskripsi, dan URL thumbnail dari Supabase
        const { data, error } = await supabase
          .from('urls')
          .select('original_url, description, thumbnail_url')
          .eq('short_code', shortCode) // Filter berdasarkan short_code
          .single(); // Hanya ambil satu baris data

        if (error) {
          throw error; // Lempar error jika ada masalah dengan query Supabase
        }

        if (data && data.original_url) {
          // Jika data ditemukan, simpan ke state
          setUrlData(data);
          // Jangan redirect di sini, tunggu efek berikutnya untuk memberi waktu render meta tag
        } else {
          setError('Short URL not found.');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching URL data:', error);
        setError(`Error: ${error.message}`);
        setLoading(false);
      }
    };

    fetchUrlAndData();
  }, [shortCode]); // Jalankan efek ini setiap kali shortCode berubah

  // Efek ini akan dijalankan setelah urlData tersedia
  // Ini memberikan waktu bagi meta tag untuk dirender dan diambil oleh platform chat
  useEffect(() => {
    if (urlData && urlData.original_url) {
      // Jeda selama 1500ms (1.5 detik) sebelum redirect
      // Ini memberi waktu bagi platform chat untuk mengambil metadata (OGP)
      const timer = setTimeout(() => {
        window.location.href = urlData.original_url; // Redirect ke URL asli
      }, 1500); // Anda bisa menyesuaikan durasi jeda ini

      // Cleanup function: Hapus timer jika komponen unmount sebelum jeda selesai
      return () => clearTimeout(timer);
    }
  }, [urlData]); // Jalankan efek ini setiap kali urlData berubah

  // Tampilkan loading state dan meta tag OGP
  return (
    <div>
      {loading && ( // Hanya tampilkan Helmet jika sedang loading (dan data sudah ada)
        urlData ? (
          <Helmet>
            {/* Judul untuk tab browser dan preview */}
            <title>{urlData.description || 'Short URL Preview'}</title>

            {/* Open Graph Meta Tags */}
            <meta property="og:title" content={urlData.description || 'Check out this shortened link!'} />
            <meta property="og:description" content={`Visit: ${window.location.origin}/short/${shortCode}`} />

            {/* Thumbnail - Pastikan URL ini publik dan valid */}
            {urlData.thumbnail_url && (
              <meta property="og:image" content={urlData.thumbnail_url} />
            )}

            {/* URL dari halaman preview itu sendiri */}
            <meta property="og:url" content={window.location.href} />
            <meta property="og:type" content="website" />

            {/* Opsional: Twitter Card Meta Tags (jika ingin preview yang lebih baik di Twitter) */}
            {/* <meta name="twitter:card" content="summary_large_image"/> */}
            {/* <meta name="twitter:title" content={urlData.description || 'Short URL Preview'}/> */}
            {/* <meta name="twitter:description" content={`Visit: ${window.location.origin}/short/${shortCode}`}/> */}
            {/* {urlData.thumbnail_url && <meta name="twitter:image" content={urlData.thumbnail_url}/>} */}
          </Helmet>
        ) : (
          // Jika masih loading tapi urlData belum ada (misal error awal)
          <Helmet>
            <title>URL Shortener Preview</title>
            <meta property="og:title" content="Short URL Preview" />
            <meta property="og:description" content="A shortened link." />
          </Helmet>
        )
      )}

      {/* Tampilan saat proses loading */}
      {loading && <p>Loading and preparing redirect...</p>}

      {/* Tampilan jika ada error */}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default Redirector;