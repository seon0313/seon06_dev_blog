const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

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

  return new Response(JSON.stringify({ post: { ...post, tags: tags.map(t => t.name) } }), { headers: CORS })
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET,OPTIONS' } })
}
