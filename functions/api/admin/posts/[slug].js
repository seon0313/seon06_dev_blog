const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

// GET — 초안 포함 단일 포스트 (content 전체)
export async function onRequestGet({ env, params }) {
  const post = await env.DB
    .prepare('SELECT * FROM posts WHERE slug = ?')
    .bind(params.slug)
    .first()
  if (!post) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: CORS })
  }
  return new Response(JSON.stringify({ post }), { headers: CORS })
}

// PUT — 포스트 수정
export async function onRequestPut({ env, params, request }) {
  const { title, excerpt, content, category_key, published } = await request.json()

  const existing = await env.DB
    .prepare('SELECT id, published, published_at FROM posts WHERE slug = ?')
    .bind(params.slug)
    .first()
  if (!existing) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: CORS })
  }

  // 처음 발행될 때만 published_at 설정
  let published_at = existing.published_at
  if (published && !existing.published) {
    published_at = new Date().toISOString()
  }

  await env.DB
    .prepare(`
      UPDATE posts
      SET title = ?, excerpt = ?, content = ?, category_key = ?,
          published = ?, published_at = ?, updated_at = datetime('now')
      WHERE slug = ?
    `)
    .bind(title, excerpt, content, category_key, published ? 1 : 0, published_at, params.slug)
    .run()

  return new Response(JSON.stringify({ ok: true }), { headers: CORS })
}

// DELETE — 포스트 삭제
export async function onRequestDelete({ env, params }) {
  const existing = await env.DB
    .prepare('SELECT id FROM posts WHERE slug = ?')
    .bind(params.slug)
    .first()
  if (!existing) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: CORS })
  }
  await env.DB.prepare('DELETE FROM posts WHERE slug = ?').bind(params.slug).run()
  return new Response(JSON.stringify({ ok: true }), { headers: CORS })
}
