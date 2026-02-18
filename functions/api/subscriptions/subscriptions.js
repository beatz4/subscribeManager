// functions/api/subscriptions.js
// Cloudflare Pages Functions - KV 기반 구독 관리 API

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// GET /api/subscriptions - 전체 구독 목록
// POST /api/subscriptions - 구독 추가
export async function onRequest(context) {
  const { request, env } = context;
  const KV = env.SUBSCRIPTIONS; // KV namespace binding

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    if (request.method === 'GET') {
      // KV에서 전체 목록 가져오기
      const data = await KV.get('subs', 'json');
      return json(data || []);
    }

    if (request.method === 'POST') {
      const body = await request.json();
      const subs = (await KV.get('subs', 'json')) || [];

      const newSub = {
        id: generateId(),
        name: body.name,
        price: body.price,
        cycle: body.cycle || 'monthly',
        category: body.category || 'etc',
        billingDay: body.billingDay || 1,
        emoji: body.emoji || '📦',
        color: body.color || '#6c5ce7',
        memo: body.memo || '',
        createdAt: new Date().toISOString(),
      };

      subs.push(newSub);
      await KV.put('subs', JSON.stringify(subs));

      return json(newSub, 201);
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
