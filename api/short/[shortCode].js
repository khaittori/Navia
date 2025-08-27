// api/short/[shortCode].js

import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase client (pastikan environment variables sudah diatur di Vercel)
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

// Konfigurasi untuk Vercel Edge Runtime
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    // Mengambil 'shortCode' dari parameter URL
    const shortCode = searchParams.get('shortCode');

    if (!shortCode) {
      return new Response('Short code not provided', { status: 400 });
    }

    // Ambil data dari tabel 'urls' di Supabase berdasarkan shortCode
    const { data, error } = await supabase
      .from('urls')
      .select('original_url, description, thumbnail_url')
      .eq('short_code', shortCode)
      .single();

    // Jika URL tidak ditemukan atau ada error
    if (error || !data) {
      return new Response('URL not found', { status: 404 });
    }

    const { original_url, description, thumbnail_url } = data;
    const userAgent = req.headers.get('user-agent') || '';

    // Deteksi apakah permintaan berasal dari bot social media/messaging
    const isBot = /facebookexternalhit|Twitterbot|WhatsApp|TelegramBot|Pinterest|LinkedInBot/i.test(userAgent);

    if (isBot) {
      // JIKA BOT: Kirim HTML dengan tag <meta> dinamis untuk pratinjau
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${description || 'Shared Link'}</title>
            <meta property="og:title" content="${description || 'Shared Link'}" />
            <meta property="og:description" content="Klik untuk membuka tautan: ${original_url}" />
            ${thumbnail_url ? `<meta property="og:image" content="${thumbnail_url}" />` : ''}
            <meta name="twitter:card" content="summary_large_image" />
            
            <!-- Meta refresh ini akan mengarahkan pengguna jika mereka membuka halaman ini di browser -->
            <meta http-equiv="refresh" content="0; url=${original_url}" />
          </head>
          <body>
            <p>Redirecting to ${original_url}...</p>
          </body>
        </html>
      `;
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' },
      });
    } else {
      // JIKA BUKAN BOT (BROWSER BIASA): Langsung arahkan (redirect) ke URL asli
      return new Response(null, {
        status: 307, // Temporary Redirect
        headers: { Location: original_url },
      });
    }
  } catch (err) {
    console.error(err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
