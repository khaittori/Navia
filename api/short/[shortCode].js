// api/short/[shortCode].js
import { createClient } from '@libsql/client/web';

export const config = {
  runtime: 'edge',
};

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export default async function handler(req) {
  try {
    // Vercel dynamic route: shortCode ada di URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    // pathname biasanya /api/short/abc123 atau /short/abc123 (setelah rewrite)
    const shortCode = pathParts[pathParts.length - 1] || url.searchParams.get('shortCode');

    if (!shortCode || shortCode === 'short') {
      return new Response('Short code not provided', { status: 400 });
    }

    const result = await turso.execute({
      sql: `SELECT original_url, description, thumbnail_url 
            FROM urls 
            WHERE short_code = ? 
            LIMIT 1`,
      args: [shortCode],
    });

    if (result.rows.length === 0) {
      const rootUrl = new URL(req.url).origin;
      return new Response(null, {
        status: 307,
        headers: { Location: rootUrl },
      });
    }

    const { original_url, description, thumbnail_url } = result.rows[0];
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
    return new Response(null, {
      status: 307,
      headers: { Location: rootUrl },
    });
  }
}