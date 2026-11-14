const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

// 공개 응답: 브라우저가 60초간 바로 쓰고, 이후 10분간은 먼저 보여 주고 뒤에서 새로 받음
const CACHE = { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=600' }

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
  return new Response(JSON.stringify({ posts: results }), { headers: { ...CORS, ...CACHE } })
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET,OPTIONS' } })
}
