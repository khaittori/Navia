// api/short/[shortCode].js

import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase client (pastikan environment variables sudah diatur di Vercel)
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

    // Jika URL tidak ditemukan atau ada error, arahkan ke halaman utama sebagai fallback
    if (error || !data) {
      const rootUrl = new URL(req.url).origin;
      return new Response(null, {
        status: 307, // Temporary Redirect
        headers: { Location: rootUrl },
      });
    }

    const { original_url, description, thumbnail_url } = data;
    const pageTitle = description || 'Link Kustom Anda';
    const pageDescription = `Klik untuk membuka tautan: ${original_url}`;
    
    // LOGIKA BARU: Selalu sajikan halaman HTML ini.
    // Bot akan membaca tag <meta> untuk pratinjau.
    // Browser pengguna akan menjalankan <meta http-equiv="refresh"> untuk redirect otomatis.
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${pageTitle}</title>
          
          <!-- Open Graph / Facebook / WhatsApp -->
          <meta property="og:type" content="website" />
          <meta property="og:title" content="${pageTitle}" />
          <meta property="og:description" content="${pageDescription}" />
          ${thumbnail_url ? `<meta property="og:image" content="${thumbnail_url}" />` : ''}
          
          <!-- Twitter -->
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="${pageTitle}" />
          <meta name="twitter:description" content="${pageDescription}" />
          ${thumbnail_url ? `<meta name="twitter:image" content="${thumbnail_url}" />` : ''}

          <!-- Meta Refresh untuk redirect otomatis di browser -->
          <meta http-equiv="refresh" content="0; url=${original_url}" />
        </head>
        <body>
          <script type="text/javascript">
            // Fallback redirect dengan JavaScript jika meta refresh tidak bekerja
            window.location.href = "${original_url}";
          </script>
          <p>Anda sedang dialihkan...</p>
          <p>Jika tidak teralihkan, <a href="${original_url}">klik di sini</a>.</p>
        </body>
      </html>
    `;
    
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });

  } catch (err) {
    console.error('Error in edge function:', err);
    // Fallback redirect ke halaman utama jika terjadi error tak terduga
    const rootUrl = new URL(req.url).origin;
    return new Response(null, {
        status: 307,
        headers: { Location: rootUrl },
    });
  }
}
