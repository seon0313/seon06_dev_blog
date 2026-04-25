const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

export async function onRequestGet({ env, params }) {
  const { slug } = params

  const page = await env.DB
    .prepare('SELECT slug, title, content FROM pages WHERE slug = ? AND published = 1')
    .bind(slug)
    .first()

  if (!page) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: CORS })
  }

  return new Response(JSON.stringify({ page }), { headers: CORS })
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET,OPTIONS' } })
}
