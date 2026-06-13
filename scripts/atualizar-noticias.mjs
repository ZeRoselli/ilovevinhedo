import { writeFileSync, readFileSync, existsSync } from 'fs';

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
if (!FIRECRAWL_API_KEY) {
  console.error('FIRECRAWL_API_KEY não definida');
  process.exit(1);
}

async function buscarNoticias() {
  const res = await fetch('https://api.firecrawl.dev/v2/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
    },
    body: JSON.stringify({
      query: 'Vinhedo SP notícias',
      sources: [{ type: 'news' }],
      limit: 5
    })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Erro na busca');
  return data.data.news || [];
}

function formatarData(dateStr) {
  if (!dateStr) return new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/\./g, '').toUpperCase();
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/\./g, '').toUpperCase();
  } catch {
    return dateStr;
  }
}

function categorizar(titulo, desc) {
  const t = (titulo + ' ' + desc).toLowerCase();
  if (t.includes('polícia') || t.includes('operação') || t.includes('crime') || t.includes('corrupção')) return 'Polícia';
  if (t.includes('evento') || t.includes('festa') || t.includes('show') || t.includes('cultura') || t.includes('música')) return 'Eventos';
  if (t.includes('gastronomia') || t.includes('restaurante') || t.includes('comida') || t.includes('bar')) return 'Gastronomia';
  if (t.includes('econ') || t.includes('empresa') || t.includes('fábrica') || t.includes('comércio') || t.includes('inaugura')) return 'Economia';
  if (t.includes('esporte') || t.includes('futebol') || t.includes('time')) return 'Esportes';
  if (t.includes('saúde') || t.includes('hospital') || t.includes('médico')) return 'Saúde';
  return 'Cidade';
}

async function gerarNoticiasJson() {
  const resultados = await buscarNoticias();

  const novasNoticias = resultados.map((n) => ({
    titulo: n.title.replace(/^(VÍDEO|VIDEO|FOTO|ÁUDIO|AUDIO):\s*/i, '').trim(),
    descricao: (n.snippet || '').replace(/\s+/g, ' ').trim().substring(0, 150),
    data: formatarData(n.date),
    categoria: categorizar(n.title, n.snippet || '')
  }));

  let existentes = [];
  if (existsSync('data/noticias.json')) {
    try {
      existentes = JSON.parse(readFileSync('data/noticias.json', 'utf-8'));
    } catch {}
  }

  const titulosExistentes = new Set(existentes.map(n => n.titulo));
  for (const n of novasNoticias) {
    if (!titulosExistentes.has(n.titulo)) {
      existentes.unshift(n);
    }
  }

  writeFileSync('data/noticias.json', JSON.stringify(existentes, null, 2), 'utf-8');
  console.log(`data/noticias.json atualizado com ${existentes.length} notícias (${novasNoticias.length} novas encontradas)`);
}

gerarNoticiasJson().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
