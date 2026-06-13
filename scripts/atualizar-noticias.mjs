import { writeFileSync } from 'fs';

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
  if (t.includes('polícia') || t.includes('polícia') || t.includes('operação') || t.includes('crime') || t.includes('corrupção')) return 'Polícia';
  if (t.includes('evento') || t.includes('festa') || t.includes('show') || t.includes('cultura') || t.includes('música')) return 'Eventos';
  if (t.includes('gastronomia') || t.includes('restaurante') || t.includes('comida') || t.includes('bar')) return 'Gastronomia';
  if (t.includes('econ') || t.includes('empresa') || t.includes('fábrica') || t.includes('comércio') || t.includes('inaugura')) return 'Economia';
  if (t.includes('esporte') || t.includes('futebol') || t.includes('time')) return 'Esportes';
  if (t.includes('saúde') || t.includes('hospital') || t.includes('médico')) return 'Saúde';
  return 'Cidade';
}

async function gerarNoticiasJs() {
  const resultados = await buscarNoticias();

  const noticias = resultados.map((n) => ({
    titulo: n.title.replace(/^(VÍDEO|VIDEO|FOTO|ÁUDIO|AUDIO):\s*/i, '').trim(),
    descricao: (n.snippet || '').replace(/\s+/g, ' ').trim().substring(0, 150),
    data: formatarData(n.date),
    categoria: categorizar(n.title, n.snippet || '')
  }));

  const jsContent = `// GERADO AUTOMATICAMENTE em ${new Date().toISOString()}
// Fonte: Firecrawl Search

const noticias = ${JSON.stringify(noticias, null, 2)};

const eventos = [
  {
    titulo: "Festa da Uva e do Vinho",
    descricao: "Tradicional celebração com gastronomia, shows e pisa de uva.",
    dia: "14",
    mes: "MAR",
    tag: "Gastronomia"
  },
  {
    titulo: "Manifestação contra aumento do IPTU",
    descricao: "Moradores de Vinhedo convocam protesto pacífico.",
    dia: "11",
    mes: "JAN",
    tag: "Cidade"
  },
  {
    titulo: "Projeto Fome da Palavra",
    descricao: "EVG leva Bíblias e conscientização a colégio em Vinhedo.",
    dia: "15",
    mes: "MAI",
    tag: "Social"
  }
];
`;

  writeFileSync('js/noticias.js', jsContent, 'utf-8');
  console.log(`noticias.js atualizado com ${noticias.length} notícias`);
}

gerarNoticiasJs().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
