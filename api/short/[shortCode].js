// api/short/[shortCode].js

import { createClient } from '@supabase/supabase-js';

// Pastikan environment variables sudah diatur di Vercel
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const shortCode = searchParams.get('shortCode');

    if (!shortCode) {
      return new Response('Short code not provided', { status: 400 });
    }

    const { data, error } = await supabase
      .from('urls')
      .select('original_url, description, thumbnail_url')
      .eq('short_code', shortCode)
      .single();

    if (error || !data) {
      const rootUrl = new URL(req.url).origin;
      return new Response(null, { status: 307, headers: { Location: rootUrl } });
    }

    const { original_url, description, thumbnail_url } = data;
    
    // --- INI PERUBAHANNYA ---
    // Judul tetap menggunakan deskripsi yang Anda masukkan
    const pageTitle = description || 'Tautan Kustom';
    // Deskripsi di bawah judul kita buat lebih rapi
    const pageDescription = "Tautan ini dibuat menggunakan URL Shortener Kustom.";
    // --- AKHIR PERUBAHAN ---
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${pageTitle}</title>
          
          <meta property="og:type" content="website" />
          <meta property="og:title" content="${pageTitle}" />
          <meta property="og:description" content="${pageDescription}" />
          ${thumbnail_url ? `<meta property="og:image" content="${thumbnail_url}" />` : ''}
          
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="${pageTitle}" />
          <meta name="twitter:description" content="${pageDescription}" />
          ${thumbnail_url ? `<meta name="twitter:image" content="${thumbnail_url}" />` : ''}
        </head>
        <body>
          <p>Anda sedang dialihkan...</p>
          <script type="text/javascript">
            window.location.href = "${original_url}";
          </script>
        </body>
      </html>
    `;
    
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (err) {
    console.error('Error in edge function:', err);
    const rootUrl = new URL(req.url).origin;
    return new Response(null, { status: 307, headers: { Location: rootUrl } });
  }
}