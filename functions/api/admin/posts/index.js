const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

// GET — 초안 포함 전체 포스트 목록
export async function onRequestGet({ env }) {
  const { results } = await env.DB
    .prepare(`
      SELECT id, slug, title, excerpt, category_key, published, published_at, created_at, updated_at
      FROM posts ORDER BY created_at DESC
    `)
    .all()
  return new Response(JSON.stringify({ posts: results }), { headers: CORS })
}

// POST — 새 포스트 생성
export async function onRequestPost({ env, request }) {
  const { slug, title, excerpt = '', content = '', category_key, published = 0 } = await request.json()

  if (!slug || !title || !category_key) {
    return new Response(JSON.stringify({ error: 'slug, title, category_key는 필수입니다.' }), { status: 400, headers: CORS })
  }

  const published_at = published ? new Date().toISOString() : null

  try {
    const result = await env.DB
      .prepare(`
        INSERT INTO posts (slug, title, excerpt, content, category_key, published, published_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `)
      .bind(slug, title, excerpt, content, category_key, published ? 1 : 0, published_at)
      .run()
    return new Response(JSON.stringify({ ok: true, id: result.meta.last_row_id }), { headers: CORS })
  } catch (e) {
    const msg = e.message?.includes('UNIQUE') ? '이미 존재하는 슬러그입니다.' : e.message
    return new Response(JSON.stringify({ error: msg }), { status: 409, headers: CORS })
  }
}
