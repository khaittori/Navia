// api/short/[shortCode].js
import { neon } from '@neondatabase/serverless';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    // Karena rewrite Vercel, shortCode bisa datang dari path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const shortCode = pathParts[pathParts.length - 1] || searchParams.get('shortCode');

    if (!shortCode) {
      return new Response('Short code not provided', { status: 400 });
    }

    const sql = neon(process.env.DATABASE_URL);
    const data = await sql`
      SELECT original_url, description, thumbnail_url
      FROM urls
      WHERE short_code = ${shortCode}
      LIMIT 1
    `;

    if (!data || data.length === 0) {
      const rootUrl = new URL(req.url).origin;
      return new Response(null, { status: 307, headers: { Location: rootUrl } });
    }

    const { original_url, description, thumbnail_url } = data[0];
    const pageTitle = description || 'Tautan Kustom';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${pageTitle}</title>
          <meta property="og:type" content="website" />
          <meta property="og:title" content="${pageTitle}" />
          ${thumbnail_url ? `<meta property="og:image" content="${thumbnail_url}" />` : ''}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="${pageTitle}" />
          ${thumbnail_url ? `<meta name="twitter:image" content="${thumbnail_url}" />` : ''}
        </head>
        <body>
          <p>Anda sedang dialihkan...</p>
          <script>window.location.href = "${original_url}";</script>
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