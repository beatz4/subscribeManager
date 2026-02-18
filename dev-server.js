// 로컬 개발 서버 - Cloudflare Pages Functions를 로컬에서 에뮬레이션
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8788;
const DATA_FILE = path.join(__dirname, '.dev-data.json');

// 간이 KV 스토어 (파일 기반)
function loadData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function jsonResponse(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
  });
}

// 정적 파일 MIME 타입
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  // API: GET/POST /api/subscriptions
  if (pathname === '/api/subscriptions') {
    if (req.method === 'GET') {
      return jsonResponse(res, loadData());
    }
    if (req.method === 'POST') {
      const body = await parseBody(req);
      const subs = loadData();
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
        active: true,
        createdAt: new Date().toISOString(),
      };
      subs.push(newSub);
      saveData(subs);
      return jsonResponse(res, newSub, 201);
    }
    return jsonResponse(res, { error: 'Method not allowed' }, 405);
  }

  // API: GET/PUT/DELETE /api/subscriptions/:id
  const match = pathname.match(/^\/api\/subscriptions\/(.+)$/);
  if (match) {
    const id = match[1];
    const subs = loadData();

    if (req.method === 'GET') {
      const sub = subs.find(s => s.id === id);
      if (!sub) return jsonResponse(res, { error: 'Not found' }, 404);
      return jsonResponse(res, sub);
    }
    if (req.method === 'PUT') {
      const body = await parseBody(req);
      const idx = subs.findIndex(s => s.id === id);
      if (idx === -1) return jsonResponse(res, { error: 'Not found' }, 404);
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
        active: body.active ?? subs[idx].active ?? true,
        updatedAt: new Date().toISOString(),
      };
      saveData(subs);
      return jsonResponse(res, subs[idx]);
    }
    if (req.method === 'DELETE') {
      const filtered = subs.filter(s => s.id !== id);
      if (filtered.length === subs.length) return jsonResponse(res, { error: 'Not found' }, 404);
      saveData(filtered);
      return jsonResponse(res, { success: true });
    }
    return jsonResponse(res, { error: 'Method not allowed' }, 405);
  }

  // 정적 파일 서빙 (public 폴더)
  let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) filePath = path.join(filePath, 'index.html');
    const ext = path.extname(filePath);
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(content);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`\n  🚀 구독 관리 앱 로컬 서버 실행 중`);
  console.log(`  ➜ http://localhost:${PORT}\n`);
});
