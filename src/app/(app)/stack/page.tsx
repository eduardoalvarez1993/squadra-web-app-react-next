'use client';

import { useState } from 'react';
import { LayersIcon, ArrowRightIcon } from 'lucide-react';

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
// Fluxo de dados
// ---------------------------------------------------------------------------

const FLOW_STEPS = [
  {
    label: 'Browser',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    note: 'React + Next.js App Router',
  },
  {
    label: 'Next.js\nAPI Route',
    color: 'bg-violet-100 text-violet-700 border-violet-200',
    note: 'Token lido do cookie HTTP-only',
  },
  {
    label: 'API Squadra',
    color: 'bg-green-100 text-green-700 border-green-200',
    note: 'REST JSON · api.squadra.com.br',
  },
];

// ---------------------------------------------------------------------------
// Changelog
// ---------------------------------------------------------------------------

interface ChangelogEntry {
  title: string;
  date?: string;
  tag: string;
  tagColor: string;
  items: string[];
}

const CHANGELOG: ChangelogEntry[] = [
  {
    title: 'Seção Extras — Links, Vídeos e Ajuda',
    date: '03 Jun 2026',
    tag: 'novo',
    tagColor: 'bg-violet-100 text-violet-700',
    items: [
      'Novo item "Extras" no menu (desktop e mobile)',
      'Links Importantes por grupos, com busca e copiar URL',
      'Galeria de Vídeos institucionais com busca e filtro por categoria',
      'Central de Ajuda: 62 dúvidas em 12 categorias, com busca e navegação em árvore',
    ],
  },
  {
    title: 'Ponto, RH e Gestão — melhorias',
    date: '03 Jun 2026',
    tag: 'release',
    tagColor: 'bg-green-100 text-green-700',
    items: [
      'Ponto: calendário do mês redesenhado, resumo Saldo/Carga/Realizado e ações por dia',
      'Apontamento exibindo o nome do projeto e data travada para visualização',
      'RH: menu disponível para o Departamento Pessoal; abonos em abas (Pendentes/Aprovados/Reprovados) e anexo corrigido',
      'Gestão: Aprovar/Reprovar direto no cartão; hora extra como Banco de Horas ou Folha; fotos nos cartões',
      'Solicitações: hora extra com justificativa e período noturno',
      'Tela "Verificando credenciais", cursor de clique nos botões e avatares neutros',
    ],
  },
  {
    title: 'Página Stack & Arquitetura',
    date: '02 Jun 2026',
    tag: 'release',
    tagColor: 'bg-green-100 text-green-700',
    items: [
      'Adicionado item "Stack" no menu lateral acima do botão Sair',
      'Página com tecnologias, logos, fluxo de dados e changelog',
    ],
  },
  {
    title: 'Paridade visual completa com o app vanilla',
    date: '02 Jun 2026',
    tag: 'release',
    tagColor: 'bg-green-100 text-green-700',
    items: [
      'Paridade visual e funcional com o web-app (SPA vanilla) validada',
      'Modo simulação: trocar perfil entre DP / Coordenador',
      'SimulandoBanner no topo durante impersonação',
    ],
  },
  {
    title: 'Features avançadas',
    tag: 'feature',
    tagColor: 'bg-blue-100 text-blue-700',
    items: [
      'Ponto diário e percentual de horas (gestores sem bateRep)',
      'Gestão: equipe, pendências, alocação e solicitações',
      'Feed: Squadra em Rede — posts, curtidas e comentários',
      'Comunicados com renderização segura de HTML (DOMPurify)',
      'Solicitações do colaborador: abono, day-off e hora extra',
      'Módulo RH restrito ao perfil DP',
    ],
  },
  {
    title: 'Features base',
    tag: 'feature',
    tagColor: 'bg-blue-100 text-blue-700',
    items: [
      'Home/Dashboard com saldo de horas, aniversariantes e novos colaboradores',
      'Holerite com contracheques e histórico salarial',
      'Férias: saldo, pedidos e histórico',
      'Perfil pessoal: dados, skills e kudos recebidos',
      'Diretório de pessoas com busca e drawer de detalhes',
    ],
  },
  {
    title: 'Shell & Navegação',
    tag: 'infra',
    tagColor: 'bg-amber-100 text-amber-700',
    items: [
      'Sidebar com collapse, controle de permissões e FluencIA',
      'Topbar com avatar, nome e menu mobile (drawer)',
      'BottomNav fixo para dispositivos móveis',
      'FluencIA Modal — assistente IA integrado ao Shell',
    ],
  },
  {
    title: 'Componentes compartilhados',
    tag: 'infra',
    tagColor: 'bg-amber-100 text-amber-700',
    items: [
      'Skeleton, EmptyState, ErrorSection, AlertCard',
      'AvatarGradient, TabNav, StatusChip, FormFeedback',
      'DrawerForm, ApprovalModal, SolicitacaoCard, PostCard',
      'HistoricoTable, PerfilLoader',
    ],
  },
  {
    title: 'Autenticação',
    tag: 'infra',
    tagColor: 'bg-amber-100 text-amber-700',
    items: [
      'Login com iron-session — cookie HTTP-only criptografado (AES-GCM)',
      'API Routes: POST /api/auth, DELETE /api/auth, GET /api/auth/me',
      'Rate limiting via Upstash Redis (sliding window)',
      'Middleware de proteção de rotas autenticadas',
    ],
  },
  {
    title: 'Foundation',
    tag: 'infra',
    tagColor: 'bg-amber-100 text-amber-700',
    items: [
      'Projeto Next.js 16 App Router + TypeScript strict + Tailwind CSS v4',
      'Squadra API client com tipagem completa (squadra-client)',
      'TanStack Query (QueryClientProvider) + Zustand store',
      'check-origin middleware anti-CSRF',
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

      {/* Fluxo de dados */}
      <section>
        <div className="mb-3 flex items-baseline gap-2">
          <h2 className="text-base font-semibold text-foreground">Fluxo de Dados</h2>
          <span className="text-xs text-muted-foreground">Como uma requisição percorre o sistema</span>
        </div>
        <div className="bg-white border border-border rounded-xl p-5">
          <div className="flex flex-wrap items-center gap-2">
            {FLOW_STEPS.map((step, i) => (
              <div key={step.label} className="flex items-center gap-2">
                <div className={`border rounded-lg px-3 py-2 text-center ${step.color}`}>
                  <p className="text-xs font-semibold leading-snug whitespace-pre-line">{step.label}</p>
                  <p className="text-[10px] opacity-70 leading-tight mt-0.5">{step.note}</p>
                </div>
                {i < FLOW_STEPS.length - 1 && (
                  <ArrowRightIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
            O token de autenticação da API Squadra é armazenado em um cookie{' '}
            <strong className="text-foreground">HTTP-only criptografado</strong> (iron-session).
            Ele nunca fica exposto ao JavaScript do browser — apenas as API Routes do Next.js
            conseguem lê-lo no servidor para repassar à API.
          </p>
        </div>
      </section>

      {/* Changelog */}
      <section>
        <div className="mb-3 flex items-baseline gap-2">
          <h2 className="text-base font-semibold text-foreground">Changelog</h2>
          <span className="text-xs text-muted-foreground">Histórico de entregas do projeto</span>
        </div>
        <div className="flex flex-col gap-0 bg-white border border-border rounded-xl overflow-hidden divide-y divide-border">
          {CHANGELOG.map((entry) => (
            <div key={entry.title} className="px-4 py-3 flex gap-3 items-start">
              <div className="flex flex-col items-end gap-1 flex-shrink-0 w-20 mt-0.5">
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${entry.tagColor}`}>
                  {entry.tag}
                </span>
                {entry.date && (
                  <span className="text-[10px] text-muted-foreground text-right leading-tight">{entry.date}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground mb-1">{entry.title}</p>
                <ul className="flex flex-col gap-0.5">
                  {entry.items.map((item) => (
                    <li key={item} className="text-xs text-muted-foreground flex gap-1.5 items-start">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
