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
      // 1. Validasi shortCode
      if (!shortCode) {
        setError('Short code not provided.');
        setLoading(false);
        return;
      }

      try {
        // 2. Ambil data dari Supabase
        const { data, error } = await supabase
          .from('urls')
          .select('original_url, description, thumbnail_url')
          .eq('short_code', shortCode) // Filter berdasarkan short_code
          .single(); // Hanya ambil satu baris data

        if (error) {
          // Handle error dari query Supabase
          console.error('Supabase query error:', error);
          throw new Error(`Failed to fetch URL data: ${error.message}`);
        }

        if (data && data.original_url) {
          // Jika data ditemukan, simpan ke state
          setUrlData(data);
          console.log('Fetched data:', data); // Log data untuk debugging
        } else {
          // Jika data tidak ditemukan
          setError('Short URL not found or invalid.');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in fetchUrlAndData:', error);
        setError(error.message); // Tampilkan pesan error yang lebih spesifik
        setLoading(false);
      }
    };

    fetchUrlAndData();
  }, [shortCode]); // Jalankan efek ini setiap kali shortCode berubah

  // Efek ini akan dijalankan setelah urlData tersedia (setelah fetch berhasil)
  // Ini memberikan waktu bagi meta tag untuk dirender dan diambil oleh platform chat
  useEffect(() => {
    if (urlData && urlData.original_url) {
      console.log('Data available for meta tags and redirect:', urlData);
      // Jeda selama 1500ms (1.5 detik) sebelum redirect
      // Ini memberi waktu bagi platform chat untuk mengambil metadata (OGP)
      const timer = setTimeout(() => {
        console.log('Redirecting to:', urlData.original_url);
        window.location.href = urlData.original_url; // Redirect ke URL asli
      }, 1500); // Sesuaikan durasi jeda jika perlu

      // Cleanup function: Hapus timer jika komponen unmount sebelum jeda selesai
      return () => {
        console.log('Clearing redirect timer.');
        clearTimeout(timer);
      };
    }
  }, [urlData]); // Jalankan efek ini setiap kali urlData berubah

  // Tampilan saat proses loading atau jika ada error
  return (
    <div>
      {/* Helmet akan selalu dirender jika komponen ini aktif,
          tapi isi tag meta akan bergantung pada urlData */}
      <Helmet>
        {/* Judul Default atau Dibuat dari Deskripsi */}
        <title>{urlData?.description ? urlData.description : 'Short URL Preview'}</title>

        {/* Open Graph Meta Tags */}
        <meta property="og:title" content={urlData?.description ? urlData.description : 'Check out this shortened link!'} />
        {/* Deskripsi yang lebih informatif */}
        <meta property="og:description" content={`Visit the original link: ${urlData?.original_url ? urlData.original_url.substring(0, 70) + '...' : ''}`} />

        {/* Thumbnail - Pastikan URL ini publik dan valid */}
        {urlData?.thumbnail_url && (
          <meta property="og:image" content={urlData.thumbnail_url} />
        )}

        {/* URL dari halaman preview itu sendiri */}
        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="website" />

        {/* Opsional: Twitter Card Meta Tags */}
        {/* <meta name="twitter:card" content="summary_large_image"/> */}
        {/* <meta name="twitter:title" content={urlData?.description || 'Short URL Preview'}/> */}
        {/* <meta name="twitter:description" content={`Visit: ${window.location.origin}/short/${shortCode}`}/> */}
        {/* {urlData?.thumbnail_url && <meta name="twitter:image" content={urlData.thumbnail_url}/>} */}
      </Helmet>

      {/* Tampilan saat proses loading */}
      {loading && (
        <p>
          {error ? `Error: ${error}` : 'Loading and preparing redirect...'}
        </p>
      )}

      {/* Jika tidak loading dan tidak ada error, tapi urlData null (ini seharusnya tidak terjadi jika loading false), tampilkan pesan */}
      {!loading && !error && !urlData && (
          <p>Something went wrong. Please try again.</p>
      )}
    </div>
  );
};

export default Redirector;