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
    const dir = await ghFetch(`/repos/${REPO}/contents/data`);
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

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

module.exports = async function handler(req, res) {
  const headers = corsHeaders();

  if (req.method === 'OPTIONS') {
    return res.status(200).set(headers).end();
  }

  if (!GITHUB_TOKEN) {
    return res.status(500).set(headers).json({ error: 'GITHUB_TOKEN não configurado' });
  }

  const { type } = req.query;
  if (!['noticias', 'eventos', 'empresas'].includes(type)) {
    return res.status(400).set(headers).json({ error: 'Tipo inválido. Use: noticias, eventos, empresas' });
  }

  try {
    if (req.method === 'GET') {
      const result = await readFile(type);
      if (!result) {
        return res.status(200).set(headers).json([]);
      }
      return res.status(200).set(headers).json(result.content);
    }

    if (req.method === 'POST') {
      const result = await readFile(type);
      const data = result ? result.content : [];
      const sha = result ? result.sha : undefined;
      data.unshift(req.body);
      await writeFile(type, data, sha);
      return res.status(201).set(headers).json(req.body);
    }

    if (req.method === 'PUT') {
      const i = parseInt(req.query.i);
      if (isNaN(i)) {
        return res.status(400).set(headers).json({ error: 'Índice inválido' });
      }
      const result = await readFile(type);
      if (!result || !result.content[i]) {
        return res.status(404).set(headers).json({ error: 'Item não encontrado' });
      }
      result.content[i] = req.body;
      await writeFile(type, result.content, result.sha);
      return res.status(200).set(headers).json(req.body);
    }

    if (req.method === 'DELETE') {
      const i = parseInt(req.query.i);
      if (isNaN(i)) {
        return res.status(400).set(headers).json({ error: 'Índice inválido' });
      }
      const result = await readFile(type);
      if (!result || !result.content[i]) {
        return res.status(404).set(headers).json({ error: 'Item não encontrado' });
      }
      result.content.splice(i, 1);
      await writeFile(type, result.content, result.sha);
      return res.status(200).set(headers).json({ ok: true });
    }

    return res.status(405).set(headers).json({ error: 'Método não permitido' });
  } catch (err) {
    return res.status(500).set(headers).json({ error: err.message });
  }
}
