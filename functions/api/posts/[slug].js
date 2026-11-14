const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

// 공개 응답: 브라우저가 60초간 바로 쓰고, 이후 10분간은 먼저 보여 주고 뒤에서 새로 받음
const CACHE = { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=600' }

export async function onRequestGet({ env, params }) {
  const { slug } = params

  const post = await env.DB
    .prepare('SELECT * FROM posts WHERE slug = ? AND published = 1')
    .bind(slug)
    .first()

  if (!post) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: CORS })
  }

  // tags
  const { results: tags } = await env.DB
    .prepare(`
      SELECT t.name FROM tags t
      JOIN post_tags pt ON pt.tag_id = t.id
      WHERE pt.post_id = ?
      ORDER BY t.name
    `)
    .bind(post.id)
    .all()

  return new Response(JSON.stringify({ post: { ...post, tags: tags.map(t => t.name) } }), { headers: { ...CORS, ...CACHE } })
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET,OPTIONS' } })
}
