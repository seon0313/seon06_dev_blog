const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

// PUT — 카테고리 수정 (label, sort_order)
export async function onRequestPut({ env, params, request }) {
  const { label, sort_order } = await request.json()
  await env.DB
    .prepare('UPDATE categories SET label = ?, sort_order = ? WHERE key = ?')
    .bind(label.trim(), Number(sort_order), params.key)
    .run()
  return new Response(JSON.stringify({ ok: true }), { headers: CORS })
}

// DELETE — 카테고리 삭제 (포스트가 있으면 거부)
export async function onRequestDelete({ env, params }) {
  const row = await env.DB
    .prepare('SELECT COUNT(*) as cnt FROM posts WHERE category_key = ?')
    .bind(params.key)
    .first()

  if (row.cnt > 0) {
    return new Response(
      JSON.stringify({ error: `이 카테고리를 사용하는 게시글이 ${row.cnt}개 있습니다. 먼저 이동하거나 삭제하세요.` }),
      { status: 409, headers: CORS },
    )
  }

  await env.DB.prepare('DELETE FROM categories WHERE key = ?').bind(params.key).run()
  return new Response(JSON.stringify({ ok: true }), { headers: CORS })
}
