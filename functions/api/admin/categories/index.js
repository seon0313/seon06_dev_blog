const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

// POST — 카테고리 생성
export async function onRequestPost({ env, request }) {
  const { key, label, sort_order = 99 } = await request.json()

  if (!key || !label) {
    return new Response(JSON.stringify({ error: 'key와 label은 필수입니다.' }), { status: 400, headers: CORS })
  }

  try {
    await env.DB
      .prepare('INSERT INTO categories (key, label, sort_order) VALUES (?, ?, ?)')
      .bind(key.toLowerCase().trim(), label.trim(), Number(sort_order))
      .run()
    return new Response(JSON.stringify({ ok: true }), { headers: CORS })
  } catch (e) {
    const msg = e.message?.includes('UNIQUE') ? '이미 존재하는 키입니다.' : e.message
    return new Response(JSON.stringify({ error: msg }), { status: 409, headers: CORS })
  }
}
