// src/components/Redirector.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const Redirector = () => {
  const { shortCode } = useParams();
  const [urlData, setUrlData] = useState(null);
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
        const res = await fetch(`/api/get-url?shortCode=${shortCode}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch URL data');
        }

        if (data && data.original_url) {
          setUrlData(data);
        } else {
          setError('Short URL not found or invalid.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error in fetchUrlAndData:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUrlAndData();
  }, [shortCode]);

  // Redirect setelah data siap (beri waktu untuk meta tag terbaca)
  useEffect(() => {
    if (urlData && urlData.original_url) {
      const timer = setTimeout(() => {
        window.location.href = urlData.original_url;
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [urlData]);

  return (
    <div>
      <Helmet>
        <title>{urlData?.description ? urlData.description : 'Short URL Preview'}</title>

        <meta property="og:title" content={urlData?.description ? urlData.description : 'Check out this shortened link!'} />
        <meta
          property="og:description"
          content={`Visit the original link: ${urlData?.original_url ? urlData.original_url.substring(0, 70) + '...' : ''}`}
        />

        {urlData?.thumbnail_url && (
          <meta property="og:image" content={urlData.thumbnail_url} />
        )}

        <meta property="og:url" content={window.location.href} />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={urlData?.description || 'Short URL Preview'} />
        {urlData?.thumbnail_url && (
          <meta name="twitter:image" content={urlData.thumbnail_url} />
        )}
      </Helmet>

      {loading && (
        <p style={{ textAlign: 'center', marginTop: '80px' }}>
          {error ? `Error: ${error}` : 'Loading and preparing redirect...'}
        </p>
      )}

      {!loading && !error && !urlData && (
        <p style={{ textAlign: 'center', marginTop: '80px' }}>
          Something went wrong. Please try again.
        </p>
      )}
    </div>
  );
};

export default Redirector;