const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

export async function onRequestGet({ env }) {
  const { results } = await env.DB
    .prepare('SELECT key, label, sort_order FROM categories ORDER BY sort_order')
    .all()

  // 항상 All을 맨 앞에
  const categories = [{ key: 'all', label: 'All' }, ...results]
  return new Response(JSON.stringify({ categories }), { headers: CORS })
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET,OPTIONS' } })
}
