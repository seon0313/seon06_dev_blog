const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

export async function onRequestGet({ env, request }) {
  const url = new URL(request.url)
  const category = url.searchParams.get('category')
  const limit    = Math.min(parseInt(url.searchParams.get('limit')  || '50'), 100)
  const offset   = Math.max(parseInt(url.searchParams.get('offset') || '0'),  0)

  let query  = 'SELECT id, slug, title, excerpt, category_key, published_at FROM posts WHERE published = 1'
  const args = []

  if (category && category !== 'all') {
    query += ' AND category_key = ?'
    args.push(category)
  }

  query += ' ORDER BY published_at DESC LIMIT ? OFFSET ?'
  args.push(limit, offset)

  const { results } = await env.DB.prepare(query).bind(...args).all()
  return new Response(JSON.stringify({ posts: results }), { headers: CORS })
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET,OPTIONS' } })
}
