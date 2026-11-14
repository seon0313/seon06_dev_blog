const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

// 공개 응답: 브라우저가 60초간 바로 쓰고, 이후 10분간은 먼저 보여 주고 뒤에서 새로 받음
const CACHE = { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=600' }

export async function onRequestGet({ env }) {
  const { results } = await env.DB
    .prepare('SELECT key, label, sort_order FROM categories ORDER BY sort_order')
    .all()

  // 항상 All을 맨 앞에
  const categories = [{ key: 'all', label: 'All' }, ...results]
  return new Response(JSON.stringify({ categories }), { headers: { ...CORS, ...CACHE } })
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { ...CORS, 'Access-Control-Allow-Methods': 'GET,OPTIONS' } })
}
