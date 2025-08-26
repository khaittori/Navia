// src/components/Redirector.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'; // Perlu react-router-dom
import { supabase } from '../supabaseClient';

const Redirector = () => {
  const { shortCode } = useParams(); // Dapatkan shortCode dari URL
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUrlAndRedirect = async () => {
      if (!shortCode) {
        setError('Short code not provided.');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('urls')
          .select('original_url')
          .eq('short_code', shortCode) // Cari URL berdasarkan shortCode
          .single(); // Hanya ambil satu hasil

        if (error) {
          throw error;
        }

        if (data && data.original_url) {
          window.location.href = data.original_url; // Redirect ke URL asli
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

    fetchUrlAndRedirect();
  }, [shortCode]);

  if (loading) {
    return <p>Loading and redirecting...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  return null; // Seharusnya tidak sampai sini jika redirect berhasil
};

export default Redirector;