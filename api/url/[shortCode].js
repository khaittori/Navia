// api/url/[shortCode].js
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
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const shortCode = pathParts[pathParts.length - 1];

    if (!shortCode) {
      return new Response(JSON.stringify({ error: 'Short code required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await turso.execute({
      sql: `SELECT original_url, description, thumbnail_url 
            FROM urls 
            WHERE short_code = ? 
            LIMIT 1`,
      args: [shortCode],
    });

    if (result.rows.length === 0) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result.rows[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}