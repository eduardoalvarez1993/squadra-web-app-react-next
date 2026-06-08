// Probe: lista usuários com `perfilMarketing === true`.
//
// Não existe endpoint "lista por flag" na API Squadra — então enumeramos todas
// as pessoas (/v1/pessoasRelatorio) e consultamos /v1/pessoa/permissoes/{id} uma a uma.
//
// Uso (PowerShell) — login via usuário/senha:
//   $env:SQ_USER = "eduardo.alvarez"
//   $env:SQ_PASS = "<senha>"
//   node scripts/probe-perfil-marketing.mjs
//
// Alternativa — passar um token já pronto (pula o login):
//   $env:SQ_TOKEN = "<bearer token de uma sessão logada>"
//
// Opcional:
//   $env:SQUADRA_API_URL = "https://api.squadra.com.br/api"  (default lido abaixo)
//   $env:CONCURRENCY = "8"                                    (paralelismo, default 8)
//
// Saída: imprime no console e grava docs/marketing-perfil-usuarios.md

import { writeFile } from 'node:fs/promises';

const API   = process.env.SQUADRA_API_URL || 'https://api.squadra.com.br/api';
const CONCURRENCY = Number(process.env.CONCURRENCY || 8);

async function obterToken() {
  if (process.env.SQ_TOKEN) return process.env.SQ_TOKEN;
  const usuario = process.env.SQ_USER;
  const senha   = process.env.SQ_PASS;
  if (!usuario || !senha) {
    console.error('✗ Defina SQ_USER + SQ_PASS (ou SQ_TOKEN). Abortando.');
    process.exit(1);
  }
  const res = await fetch(`${API}/v1/autenticacao/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ usuario, senha }),
  });
  if (!res.ok) { console.error(`✗ login ${res.status}: ${await res.text()}`); process.exit(1); }
  const d = await res.json();
  const token = d.accessToken ?? d.token ?? d?.retorno?.accessToken ?? d?.retorno?.token;
  if (!token) { console.error('✗ login OK mas sem token na resposta.'); process.exit(1); }
  console.log(`→ login OK como ${usuario}`);
  return token;
}

const TOKEN = await obterToken();
const headers = { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' };

function unwrap(json) {
  // a API envelopa em { sucesso, retorno } em alguns casos, em outros é cru
  if (Array.isArray(json)) return json;
  if (json && Array.isArray(json.retorno)) return json.retorno;
  if (json && json.retorno) return json.retorno;
  return json;
}

async function getPessoas() {
  // Fonte: POST /v1/pessoas/buscarpessoas com filtros vazios (roster de ativos).
  // (pessoasRelatorio é gestor-scoped e pode retornar 400 "Gestor não encontrado".)
  const body = {
    nome: '', ativo: true, unidade: '', cidade: '', cargo: '', gerente: '', empresa: '',
    departamento: '', telefone: '', experiencia: '', certificacao: '', projetos: '',
    interesses: '', projetosPessoais: '', dataDisponibilidade: '', pagina: 0, tamanhoPagina: 0, comunidades: '',
  };
  const res = await fetch(`${API}/v1/pessoas/buscarpessoas`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`buscarpessoas ${res.status}: ${await res.text()}`);
  const list = unwrap(await res.json());
  return list
    .map((p) => ({ id: Number(p.id ?? 0), nome: String(p.nome ?? ''), login: String(p.login ?? ''), cargo: String(p.cargo ?? '') }))
    .filter((p) => p.id > 0);
}

async function getPermissoes(id) {
  const res = await fetch(`${API}/v1/pessoa/permissoes/${id}`, { headers });
  if (!res.ok) return { _erro: `${res.status}` };
  return unwrap(await res.json());
}

// pool de concorrência simples
async function mapPool(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return out;
}

(async () => {
  console.log(`→ API: ${API}`);
  const pessoas = await getPessoas();
  console.log(`→ ${pessoas.length} pessoas. Consultando permissões (concorrência ${CONCURRENCY})...`);

  let done = 0;
  const resultados = await mapPool(pessoas, CONCURRENCY, async (p) => {
    const perm = await getPermissoes(p.id);
    done++;
    if (done % 50 === 0) console.log(`  ...${done}/${pessoas.length}`);
    return { ...p, perm };
  });

  const comMkt = resultados.filter((r) => r.perm && r.perm.perfilMarketing === true);
  const erros  = resultados.filter((r) => r.perm && r.perm._erro);

  console.log(`\n✓ Com perfilMarketing=true: ${comMkt.length}`);
  console.log(`  Erros de consulta: ${erros.length}`);
  for (const r of comMkt) console.log(`   • ${r.nome} (${r.login}) — ${r.cargo} [id ${r.id}]`);

  const hoje = new Date().toISOString().slice(0, 10);
  const linhas = comMkt.length
    ? comMkt.map((r) => `| ${r.id} | ${r.login} | ${r.nome} | ${r.cargo} |`).join('\n')
    : '| — | — | _Nenhum usuário com a flag populada_ | — |';

  const md = `# Usuários com perfilMarketing = true

> Gerado por \`scripts/probe-perfil-marketing.mjs\` em ${hoje}.
> Fonte: \`POST /v1/pessoas/buscarpessoas\` (roster) + \`GET /v1/pessoa/permissoes/{id}\` (não há endpoint de lista por flag).

- Pessoas verificadas: **${pessoas.length}**
- Com \`perfilMarketing=true\`: **${comMkt.length}**
- Erros de consulta: **${erros.length}**

| pessoaId | login | nome | cargo |
|---|---|---|---|
${linhas}

${comMkt.length === 0 ? '> ⚠️ Flag não-populada para ninguém — confirma a pendência de TI registrada no plano (`docs/marketing-painel.md`).' : ''}
`;

  await writeFile(new URL('../docs/marketing-perfil-usuarios.md', import.meta.url), md, 'utf8');
  console.log('\n✓ Documentado em docs/marketing-perfil-usuarios.md');
})().catch((e) => { console.error('✗', e.message); process.exit(1); });
