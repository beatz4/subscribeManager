// functions/api/subscriptions/[id].js
// 개별 구독 수정/삭제 API

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

export async function onRequest(context) {
  const { request, env, params } = context;
  const KV = env.SUBSCRIPTIONS;
  const id = params.id;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const subs = (await KV.get('subs', 'json')) || [];

    if (request.method === 'GET') {
      const sub = subs.find(s => s.id === id);
      if (!sub) return json({ error: 'Not found' }, 404);
      return json(sub);
    }

    if (request.method === 'PUT') {
      const body = await request.json();
      const idx = subs.findIndex(s => s.id === id);
      if (idx === -1) return json({ error: 'Not found' }, 404);

      subs[idx] = {
        ...subs[idx],
        name: body.name ?? subs[idx].name,
        price: body.price ?? subs[idx].price,
        cycle: body.cycle ?? subs[idx].cycle,
        category: body.category ?? subs[idx].category,
        billingDay: body.billingDay ?? subs[idx].billingDay,
        emoji: body.emoji ?? subs[idx].emoji,
        color: body.color ?? subs[idx].color,
        memo: body.memo ?? subs[idx].memo,
        updatedAt: new Date().toISOString(),
      };

      await KV.put('subs', JSON.stringify(subs));
      return json(subs[idx]);
    }

    if (request.method === 'DELETE') {
      const filtered = subs.filter(s => s.id !== id);
      if (filtered.length === subs.length) return json({ error: 'Not found' }, 404);

      await KV.put('subs', JSON.stringify(filtered));
      return json({ success: true });
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}
