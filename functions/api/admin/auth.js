const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

export async function onRequestPost({ env, request }) {
  const { password } = await request.json()
  if (!env.ADMIN_TOKEN || password !== env.ADMIN_TOKEN) {
    return new Response(JSON.stringify({ error: 'Invalid password' }), { status: 401, headers: CORS })
  }
  return new Response(JSON.stringify({ ok: true, token: env.ADMIN_TOKEN }), { headers: CORS })
}
