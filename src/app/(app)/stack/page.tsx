'use client';

import { useState } from 'react';
import { LayersIcon } from 'lucide-react';

// ---------------------------------------------------------------------------
// Dados de cada tecnologia
// ---------------------------------------------------------------------------

interface Tech {
  name: string;
  version: string;
  slug: string | null;
  abbr: string;
  color: string;
  bg: string;
  category: string;
  catColor: string;
  desc: string;
  reason: string;
}

const TECH_GROUPS: { title: string; subtitle: string; techs: Tech[] }[] = [
  {
    title: 'Base',
    subtitle: 'Framework, linguagem e runtime',
    techs: [
      {
        name: 'Next.js', version: '16', slug: 'nextdotjs', abbr: 'N',
        color: '#000000', bg: '#f5f5f5',
        category: 'Framework', catColor: 'bg-gray-100 text-gray-600',
        desc: 'Framework que reúne frontend e backend em um único projeto. Cuida de roteamento, carregamento de páginas e chamadas ao servidor de forma otimizada.',
        reason: 'App Router + Server Components + API Routes nativas. Elimina a necessidade de um servidor Node separado para rotas simples.',
      },
      {
        name: 'React', version: '19', slug: 'react', abbr: 'R',
        color: '#149ECA', bg: '#e8f9fe',
        category: 'UI Library', catColor: 'bg-cyan-100 text-cyan-700',
        desc: 'Biblioteca que organiza a interface em componentes reutilizáveis — como peças de lego que montam as telas. Padrão de mercado com vasto ecossistema.',
        reason: 'v19 traz useOptimistic, useFormStatus e Actions nativas para forms. Concurrent rendering para interfaces mais responsivas.',
      },
      {
        name: 'TypeScript', version: '5.9', slug: 'typescript', abbr: 'TS',
        color: '#3178C6', bg: '#e8f0fb',
        category: 'Linguagem', catColor: 'bg-blue-100 text-blue-700',
        desc: 'Versão do JavaScript com verificação de tipos. Detecta erros antes de o código chegar ao usuário e funciona como documentação automática para o time.',
        reason: 'Tipagem estática previne bugs de contrato entre camadas. Em projetos multi-dev, TS viabiliza refatorações seguras e IDEs com autocomplete confiável.',
      },
    ],
  },
  {
    title: 'Interface',
    subtitle: 'Estilização, componentes e ícones',
    techs: [
      {
        name: 'Tailwind CSS', version: '4', slug: 'tailwindcss', abbr: 'TW',
        color: '#06B6D4', bg: '#e0f7fa',
        category: 'CSS', catColor: 'bg-cyan-100 text-cyan-700',
        desc: 'Sistema de design em classes utilitárias. Cada propriedade visual tem sua própria classe, garantindo consistência visual sem conflito de nomes.',
        reason: 'v4 usa CSS nativo sem PostCSS obrigatório, ~5× mais rápido que v3. Purge automático: apenas classes usadas entram no bundle final.',
      },
      {
        name: 'shadcn/ui', version: '4', slug: 'shadcnui', abbr: 'sh',
        color: '#18181b', bg: '#f4f4f5',
        category: 'Componentes', catColor: 'bg-zinc-100 text-zinc-700',
        desc: 'Coleção de componentes prontos (botões, modais, campos) acessíveis e customizáveis. Diferente de libs tradicionais, o código fica no repositório com total controle.',
        reason: 'Built on Radix UI primitives — ARIA garantido. Sem lock-in: cada componente é código local, modificável sem fork de dependência.',
      },
      {
        name: 'Lucide React', version: '1.17', slug: 'lucide', abbr: 'Lu',
        color: '#e11d48', bg: '#fff1f2',
        category: 'Ícones', catColor: 'bg-rose-100 text-rose-700',
        desc: 'Biblioteca com mais de 1.000 ícones SVG consistentes. Apenas os ícones utilizados no projeto são incluídos, mantendo o app leve.',
        reason: 'Tree-shakeable: zero dead code. Grade geométrica 24px com stroke-width uniforme, o que garante harmonia visual entre ícones.',
      },
    ],
  },
  {
    title: 'Estado & Dados',
    subtitle: 'Gerenciamento de estado, cache e formulários',
    techs: [
      {
        name: 'TanStack Query', version: '5', slug: 'reactquery', abbr: 'TQ',
        color: '#EF4444', bg: '#fff0f1',
        category: 'Server State', catColor: 'bg-red-100 text-red-700',
        desc: 'Gerencia dados do servidor com cache automático — evita chamadas desnecessárias à API e exibe estados de carregamento e erro de forma padronizada.',
        reason: 'Cache inteligente com stale-while-revalidate, deduplicação de requests e refetch on focus. Substitui useEffect + fetch manual.',
      },
      {
        name: 'Zustand', version: '5', slug: null, abbr: 'Zu',
        color: '#7C3AED', bg: '#f5f3ff',
        category: 'Client State', catColor: 'bg-violet-100 text-violet-700',
        desc: 'Armazena dados do usuário logado (nome, foto, permissões) disponíveis em qualquer parte do app sem precisar "passar props" entre componentes.',
        reason: 'Store minimalista: 1 KB gzip, sem boilerplate do Redux. Devtools integrado, suporte a slices e middlewares de persistência.',
      },
      {
        name: 'React Hook Form', version: '7', slug: 'reacthookform', abbr: 'RHF',
        color: '#EC5990', bg: '#fdf2f8',
        category: 'Formulários', catColor: 'bg-pink-100 text-pink-700',
        desc: 'Gerencia formulários de forma eficiente: captura valores, valida campos e exibe erros sem travar a interface durante a digitação.',
        reason: 'Inputs não-controlados = zero re-renders por keystroke. Integração nativa com Zod via resolver. useFormStatus para loading states.',
      },
      {
        name: 'Zod', version: '4', slug: 'zod', abbr: 'Zd',
        color: '#3E67B1', bg: '#eef2fb',
        category: 'Validação', catColor: 'bg-blue-100 text-blue-700',
        desc: 'Define as regras de validação de formulários e respostas da API. Um único schema funciona tanto no browser quanto no servidor.',
        reason: 'Schema → TypeScript type automático via z.infer<>. Elimina duplicação runtime/compile-time. v4 é ~14× mais rápido que v3.',
      },
    ],
  },
  {
    title: 'Infraestrutura',
    subtitle: 'Sessão, segurança, rate limiting e notificações',
    techs: [
      {
        name: 'iron-session', version: '8', slug: null, abbr: 'IS',
        color: '#6366F1', bg: '#eef2ff',
        category: 'Sessão', catColor: 'bg-indigo-100 text-indigo-700',
        desc: 'Mantém o usuário logado de forma segura usando um cookie criptografado. Não precisa de banco de dados para armazenar sessões.',
        reason: 'Cookie HTTP-only + sealed (AES-GCM). O token da API Squadra nunca é exposto ao JavaScript do browser. Stateless — sem Redis para sessão.',
      },
      {
        name: 'DOMPurify', version: '3', slug: null, abbr: 'DP',
        color: '#16A34A', bg: '#f0fdf4',
        category: 'Segurança', catColor: 'bg-green-100 text-green-700',
        desc: 'Limpa conteúdo HTML externo (comunicados, posts do feed) antes de exibir na tela, prevenindo ataques de invasão via scripts maliciosos.',
        reason: 'Sanitização XSS para dangerouslySetInnerHTML. OWASP Top-10 mitigation para conteúdo de terceiros renderizado no DOM.',
      },
      {
        name: 'Upstash Redis', version: '2', slug: 'upstash', abbr: 'UP',
        color: '#00c16e', bg: '#f0fdf4',
        category: 'Rate Limiting', catColor: 'bg-emerald-100 text-emerald-700',
        desc: 'Limita quantas requisições cada usuário pode fazer em um período nas rotas da API, protegendo contra uso abusivo e ataques de força bruta.',
        reason: 'Redis serverless via HTTP — sem TCP overhead. Sliding window rate limiting nas API Routes críticas (auth, etc.).',
      },
      {
        name: 'Sonner', version: '2', slug: null, abbr: 'So',
        color: '#D97706', bg: '#fffbeb',
        category: 'Notificações', catColor: 'bg-amber-100 text-amber-700',
        desc: 'Exibe mensagens de feedback (sucesso, erro, carregando) de forma elegante e não-intrusiva no canto da tela.',
        reason: 'API simples: toast.success(), toast.error(), toast.promise(). Acessível por padrão com ARIA live regions.',
      },
    ],
  },
  {
    title: 'Qualidade',
    subtitle: 'Testes automatizados',
    techs: [
      {
        name: 'Vitest', version: '4', slug: 'vitest', abbr: 'Vt',
        color: '#6E9F18', bg: '#f7fbe8',
        category: 'Testes Unitários', catColor: 'bg-lime-100 text-lime-700',
        desc: 'Executa testes unitários e de integração automaticamente, verificando se funções e componentes individuais funcionam como esperado.',
        reason: 'API compatível com Jest. Integrado ao Vite: HMR em testes, ~10× mais rápido que Jest. Coverage nativo com v8.',
      },
      {
        name: 'Playwright', version: '1.60', slug: 'playwright', abbr: 'PW',
        color: '#2EAD33', bg: '#f0fdf4',
        category: 'Testes E2E', catColor: 'bg-green-100 text-green-700',
        desc: 'Simula um usuário real navegando no sistema: preenche formulários, clica em botões e verifica se tudo funciona do início ao fim.',
        reason: 'Multi-browser (Chromium/Firefox/WebKit). Auto-wait elimina flakiness. Network interception para mock de API nos testes.',
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Qualidade & Testes — visão de negócio
// ---------------------------------------------------------------------------

const QUALITY_STATS: { value: string; label: string }[] = [
  { value: '301',     label: 'testes automatizados' },
  { value: '24',      label: 'suítes de teste' },
  { value: '0',       label: 'falhas na suíte' },
  { value: '88–91%',  label: 'cobertura das rotas críticas' },
];

// Cobertura por área de RISCO (o que dá prejuízo se falhar vem primeiro).
const COVERAGE_AREAS: { label: string; note: string; pct: number; color: string }[] = [
  {
    label: 'Segurança das rotas',
    note: 'login, CSRF, permissões de RH/gestor',
    pct: 90, color: 'bg-green-500',
  },
  {
    label: 'Integração com a API Squadra',
    note: 'contratos de dados (schemas/transforms)',
    pct: 53, color: 'bg-blue-500',
  },
  {
    label: 'Regras de negócio e cálculos',
    note: 'horas, status, abonos, validações',
    pct: 64, color: 'bg-violet-500',
  },
];

// ---------------------------------------------------------------------------
// Changelog
// ---------------------------------------------------------------------------

const TYPE_STYLE: Record<'novo' | 'melhoria' | 'fix' | 'infra', { label: string; cls: string }> = {
  novo:     { label: 'novo',     cls: 'bg-violet-100 text-violet-700' },
  melhoria: { label: 'melhoria', cls: 'bg-blue-100 text-blue-700' },
  fix:      { label: 'fix',      cls: 'bg-amber-100 text-amber-700' },
  infra:    { label: 'infra',    cls: 'bg-slate-100 text-slate-600' },
};

interface ReleaseChange {
  type: keyof typeof TYPE_STYLE;
  text: string;
}

interface Release {
  version: string;
  title:   string;
  date:    string;
  changes: ReleaseChange[];
}

// Mais recente primeiro.
const RELEASES: Release[] = [
  {
    version: 'v1.7.0',
    title:   'Ponto mais próximo do app: jornada, hora extra e abono',
    date:    '11 Jun 2026',
    changes: [
      { type: 'novo',     text: 'Solicitar hora extra e abono direto no ponto: atalhos no dia abrem o formulário já com a data preenchida, sem sair da tela' },
      { type: 'novo',     text: 'Abono completo: tipo, período (início/fim), grau de parentesco, dia inteiro ou horas definidas e anexo (atestado em PNG/JPG/PDF), com cálculo automático de dias e horas por tipo' },
      { type: 'melhoria', text: 'Apontamento bloqueia jornada acima da carga do dia, com aviso em tela — o que passa do previsto só entra como hora extra aprovada' },
      { type: 'melhoria', text: 'Cada período do apontamento limitado a 6 horas, espelhando a regra do app' },
      { type: 'melhoria', text: 'Hora extra: quantidade com digitação livre (até 2h) e motivo limitado a 300 caracteres, no ponto e em Solicitações' },
      { type: 'infra',    text: 'Suíte de testes: 301 testes em 24 suítes (Vitest), 0 falhas' },
    ],
  },
  {
    version: 'v1.6.0',
    title:   'Hora extra no ponto & correções de gestão',
    date:    '11 Jun 2026',
    changes: [
      { type: 'novo',     text: 'Registrar hora extra aprovada direto no ponto: o que passa da carga do dia vira hora extra automaticamente, respeitando o limite aprovado' },
      { type: 'novo',     text: 'Dia com hora extra liberada exibe o selo "H.Extra liberada" e o botão Registrar (some após o lançamento) — na lista de pendentes e no calendário' },
      { type: 'melhoria', text: 'Aprovação de hora extra em painel lateral com escolha Banco de Horas ou Pagamento em Folha; reprovar agora pede confirmação' },
      { type: 'melhoria', text: 'Calendário do mês: botões só aparecem quando há ação possível, horas com tamanho padronizado e sem informação duplicada' },
      { type: 'fix',      text: 'Hora extra gravava a data trocada (dia/mês); agora envia no formato correto e o dia solicitado é respeitado' },
      { type: 'fix',      text: 'Gestão: aba Equipe voltou a carregar (mesmo endpoint do app) e uma falha nela não derruba mais as outras abas' },
      { type: 'fix',      text: 'Percentual: leitura correta das horas por mês; menu Ponto × Percentual estável (sem oscilação)' },
      { type: 'infra',    text: 'Suíte de testes: 265 testes em 20 suítes (Vitest), 0 falhas' },
    ],
  },
  {
    version: 'v1.5.0',
    title:   'Ponto do gestor, Marketing & Segurança',
    date:    '08 Jun 2026',
    changes: [
      { type: 'novo',     text: 'Aba Ponto no detalhe do colaborador (Minha Equipe e Pendências) com ações e detalhes de apropriação' },
      { type: 'novo',     text: 'Gestor libera ou confirma falta além de poder liberar o dia para apropriação' },
      { type: 'novo',     text: 'Painel de Marketing com acesso por perfil (substitui o controle via Airtable - que tinha liberações)' },
      { type: 'melhoria', text: 'Pessoas: aba Dados revisada (projetos, datas DD/MM, rótulos) e drawers carregados sob demanda' },
      { type: 'melhoria', text: 'Alterar gestor com atualização instantânea na tela e empty states ilustrados' },
      { type: 'infra',    text: 'Autorização por equipe nas rotas de gestão; sessão de 7 dias com retorno à rota após expirar' },
      { type: 'infra',    text: 'Suíte de testes: 261 testes em 19 suítes (Vitest), 0 falhas' },
    ],
  },
  {
    version: 'v1.4.0',
    title:   'Gestão de gestores & Qualidade',
    date:    '04 Jun 2026',
    changes: [
      { type: 'novo',     text: 'Abas Gestão Funcional e Gestão de Projeto — alterar o gestor de um colaborador ou de um projeto' },
      { type: 'novo',     text: 'Formulário com busca (autocomplete) do alvo e do novo gestor, pré-preenchido com o usuário logado' },
      { type: 'novo',     text: '"Ver todos" com lazy load, busca e filtros — colaboradores e projetos com seus gestores atuais' },
      { type: 'novo',     text: 'Suíte de testes automatizados: 234 testes (Vitest) e 8 fluxos E2E (Playwright), 0 falhas' },
      { type: 'melhoria', text: 'Schemas da API validados contra payloads reais — blindam contra mudanças de contrato' },
    ],
  },
  {
    version: 'v1.3.0',
    title:   'Extras & melhorias operacionais',
    date:    '03 Jun 2026',
    changes: [
      { type: 'novo',     text: 'Seção Extras no menu: Links Importantes, Galeria de Vídeos e Central de Ajuda (62 dúvidas)' },
      { type: 'melhoria', text: 'Ponto: calendário redesenhado, resumo Saldo/Carga/Realizado e ações por dia' },
      { type: 'melhoria', text: 'RH: menu para o Departamento Pessoal; abonos em abas e anexo corrigido' },
      { type: 'melhoria', text: 'Gestão: aprovar/reprovar no cartão; hora extra como Banco ou Folha; fotos nos cartões' },
      { type: 'melhoria', text: 'Solicitações: hora extra com justificativa e período noturno' },
    ],
  },
  {
    version: 'v1.2.0',
    title:   'Stack & paridade visual',
    date:    '02 Jun 2026',
    changes: [
      { type: 'novo',     text: 'Página Stack & Arquitetura no menu lateral' },
      { type: 'melhoria', text: 'Paridade visual e funcional completa com o app vanilla (web-app)' },
      { type: 'novo',     text: 'Modo simulação (DP / Coordenador) com banner de impersonação' },
    ],
  },
  {
    version: 'v1.0.0',
    title:   'Lançamento — Fundação',
    date:    'Mai 2026',
    changes: [
      { type: 'novo',  text: 'Home, Holerite, Férias, Perfil e Diretório de pessoas' },
      { type: 'novo',  text: 'Ponto (diário e percentual), Gestão (equipe, pendências, alocação), Feed e RH' },
      { type: 'infra', text: 'Shell completo: sidebar, topbar, bottom-nav e FluencIA; biblioteca de componentes compartilhados' },
      { type: 'infra', text: 'Autenticação iron-session (cookie HTTP-only), rate limiting e proteção de rotas' },
      { type: 'infra', text: 'Base Next.js 16 + TypeScript strict + Tailwind v4; client Squadra tipado; TanStack Query + Zustand' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Componentes auxiliares
// ---------------------------------------------------------------------------

function TechIcon({ slug, abbr, color, bg }: { slug: string | null; abbr: string; color: string; bg: string }) {
  const [err, setErr] = useState(false);

  if (slug && !err) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`https://cdn.simpleicons.org/${slug}`}
        alt=""
        width={28}
        height={28}
        onError={() => setErr(true)}
        className="h-7 w-7 object-contain"
      />
    );
  }

  return (
    <div
      className="h-7 w-7 rounded-md flex items-center justify-center text-[10px] font-bold leading-none select-none"
      style={{ backgroundColor: bg, color, border: `1px solid ${color}22` }}
    >
      {abbr}
    </div>
  );
}

function TechCard({ tech }: { tech: Tech }) {
  return (
    <div className="bg-white border border-border rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">
          <TechIcon slug={tech.slug} abbr={tech.abbr} color={tech.color} bg={tech.bg} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-sm text-foreground">{tech.name}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">v{tech.version}</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${tech.catColor}`}>{tech.category}</span>
          </div>
          <p className="text-sm text-muted-foreground leading-snug">{tech.desc}</p>
        </div>
      </div>
      <div className="bg-slate-50 border-l-2 border-slate-300 rounded-r-lg px-3 py-2 text-xs text-slate-600 leading-snug">
        <span className="font-semibold text-slate-700">Dev: </span>{tech.reason}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

export default function StackPage() {
  return (
    <div className="flex flex-col gap-8 p-4 max-w-4xl mx-auto pb-24">

      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <LayersIcon className="h-6 w-6 text-slate-400" />
          <h1 className="text-xl font-bold text-foreground">Stack & Arquitetura</h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          Visão geral das tecnologias utilizadas, por que foram escolhidas e como o projeto está organizado.
          Cada card traz uma descrição geral e uma nota técnica para quem quer ir mais fundo.
        </p>
        <div className="flex flex-wrap gap-2 mt-1">
          <span className="text-xs bg-zinc-900 text-zinc-100 px-2.5 py-1 rounded-full font-medium">Next.js App Router</span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">TypeScript strict</span>
          <span className="text-xs bg-cyan-100 text-cyan-700 px-2.5 py-1 rounded-full font-medium">Tailwind CSS v4</span>
          <span className="text-xs bg-sky-100 text-sky-700 px-2.5 py-1 rounded-full font-medium">React 19</span>
          <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">Vitest + Playwright</span>
        </div>
      </div>

      {/* Tech Groups */}
      {TECH_GROUPS.map((group) => (
        <section key={group.title}>
          <div className="mb-3 flex items-baseline gap-2">
            <h2 className="text-base font-semibold text-foreground">{group.title}</h2>
            <span className="text-xs text-muted-foreground">{group.subtitle}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {group.techs.map((tech) => (
              <TechCard key={tech.name} tech={tech} />
            ))}
          </div>
        </section>
      ))}

      {/* Qualidade & Testes */}
      <section>
        <div className="mb-3 flex items-baseline gap-2">
          <h2 className="text-base font-semibold text-foreground">Qualidade & Testes</h2>
          <span className="text-xs text-muted-foreground">Confiabilidade medida, não prometida</span>
        </div>
        <div className="bg-white border border-border rounded-xl p-5 flex flex-col gap-5">

          {/* Números */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {QUALITY_STATS.map((s) => (
              <div key={s.label} className="bg-slate-50 border border-border rounded-lg px-3 py-3 text-center">
                <p className="text-2xl font-bold text-foreground leading-none">{s.value}</p>
                <p className="text-[11px] text-muted-foreground leading-tight mt-1.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Frase de negócio */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            A qualidade aqui é <strong className="text-foreground">medida, não prometida</strong>. A suíte cobre
            primeiro o que causa prejuízo se falhar — <strong className="text-foreground">segurança</strong>,
            os cálculos que mexem com horas e abonos, e os <strong className="text-foreground">contratos de dados</strong> com
            a API Squadra. Cada defeito encontrado em homologação é transformado em teste automático, impedindo que volte.
          </p>

          {/* Cobertura por área de risco */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-slate-700">Cobertura por área de risco</p>
            {COVERAGE_AREAS.map((a) => (
              <div key={a.label} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm text-foreground">
                    {a.label} <span className="text-xs text-muted-foreground">· {a.note}</span>
                  </span>
                  <span className="text-sm font-semibold text-foreground font-mono">{a.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full ${a.color}`} style={{ width: `${a.pct}%` }} />
                </div>
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground leading-snug mt-1">
              Estratégia <strong className="text-slate-700">ponderada por risco</strong>: telas e componentes visuais
              são validados pelos testes ponta a ponta (Playwright), por isso não inflam a cobertura unitária.
            </p>
          </div>
        </div>
      </section>

      {/* Releases */}
      <section>
        <div className="mb-3 flex items-baseline gap-2">
          <h2 className="text-base font-semibold text-foreground">Releases</h2>
          <span className="text-xs text-muted-foreground">Linha do tempo de entregas</span>
        </div>
        <div className="flex flex-col">
          {RELEASES.map((r, i) => (
            <div key={r.version} className="flex gap-3">
              {/* Marcador + linha conectora */}
              <div className="flex flex-col items-center pt-1.5">
                <span className={`h-3.5 w-3.5 rounded-full border-2 flex-shrink-0 ${i === 0 ? 'bg-violet-500 border-violet-200' : 'bg-white border-slate-300'}`} />
                {i < RELEASES.length - 1 && <span className="w-px flex-1 bg-border my-1" />}
              </div>

              {/* Conteúdo da release */}
              <div className="flex-1 min-w-0 pb-6">
                <div className="bg-white border border-border rounded-xl p-4">
                  <div className="flex items-center gap-2 flex-wrap mb-2.5">
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${i === 0 ? 'bg-violet-600 text-white' : 'bg-muted text-foreground'}`}>
                      {r.version}
                    </span>
                    <span className="font-semibold text-sm text-foreground">{r.title}</span>
                    {i === 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-violet-100 text-violet-700 uppercase tracking-wide">
                        atual
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">{r.date}</span>
                  </div>
                  <ul className="flex flex-col gap-1.5">
                    {r.changes.map((c) => (
                      <li key={c.text} className="flex items-start gap-2">
                        <span className={`mt-px text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${TYPE_STYLE[c.type].cls}`}>
                          {TYPE_STYLE[c.type].label}
                        </span>
                        <span className="text-xs text-muted-foreground leading-snug">{c.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
