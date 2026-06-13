const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPO || 'ZeRoselli/ilovevinhedo';
const BASE = 'https://api.github.com';

async function ghFetch(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'ilovevinhedo-cms',
      ...(opts.headers || {})
    }
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GitHub API ${res.status}: ${err}`);
  }
  return res.status === 204 ? null : res.json();
}

function decodeContent(data) {
  return JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));
}

function encodeContent(obj) {
  return Buffer.from(JSON.stringify(obj, null, 2)).toString('base64');
}

async function readFile(type) {
  const path = `data/${type}.json`;
  try {
    const data = await ghFetch(`/repos/${REPO}/contents/${path}`);
    return { content: decodeContent(data), sha: data.sha };
  } catch {
    return null;
  }
}

async function writeFile(type, content, sha) {
  const path = `data/${type}.json`;
  const body = {
    message: `Atualiza ${type}.json via dashboard`,
    content: encodeContent(content),
    sha
  };
  return ghFetch(`/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

function json(res, code, data) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.end(JSON.stringify(data));
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.end();
    return;
  }

  if (!GITHUB_TOKEN) {
    json(res, 500, { error: 'GITHUB_TOKEN não configurado' });
    return;
  }

  const { type } = req.query;
  if (!['noticias', 'eventos', 'empresas'].includes(type)) {
    json(res, 400, { error: 'Tipo inválido. Use: noticias, eventos, empresas' });
    return;
  }

  try {
    if (req.method === 'GET') {
      const result = await readFile(type);
      json(res, 200, result ? result.content : []);
      return;
    }

    if (req.method === 'POST') {
      const result = await readFile(type);
      const data = result ? result.content : [];
      const sha = result ? result.sha : undefined;
      data.unshift(req.body);
      await writeFile(type, data, sha);
      json(res, 201, req.body);
      return;
    }

    if (req.method === 'PUT') {
      const i = parseInt(req.query.i);
      if (isNaN(i)) { json(res, 400, { error: 'Índice inválido' }); return; }
      const result = await readFile(type);
      if (!result || !result.content[i]) { json(res, 404, { error: 'Item não encontrado' }); return; }
      result.content[i] = req.body;
      await writeFile(type, result.content, result.sha);
      json(res, 200, req.body);
      return;
    }

    if (req.method === 'DELETE') {
      const i = parseInt(req.query.i);
      if (isNaN(i)) { json(res, 400, { error: 'Índice inválido' }); return; }
      const result = await readFile(type);
      if (!result || !result.content[i]) { json(res, 404, { error: 'Item não encontrado' }); return; }
      result.content.splice(i, 1);
      await writeFile(type, result.content, result.sha);
      json(res, 200, { ok: true });
      return;
    }

    json(res, 405, { error: 'Método não permitido' });
  } catch (err) {
    json(res, 500, { error: err.message });
  }
};
