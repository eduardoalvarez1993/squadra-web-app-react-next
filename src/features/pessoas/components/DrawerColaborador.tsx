'use client';

import { useState, Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { AvatarGradient } from '@/components/shared/AvatarGradient';
import { PerfilLoader } from '@/components/shared/PerfilLoader';
import { SimularBtn } from '@/features/pessoas/components/SimularBtn';
import { ASSETS } from '@/lib/assets';
import Image from 'next/image';

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Pessoa = {
  id:                    number;
  nome:                  string;
  nomeSocial:            string;
  foto:                  string | null;
  cargo:                 string;
  email:                 string;
  celular:               string;
  login:                 string;
  [key: string]:         unknown;
};

type Skill = { nome: string; nivel: number };

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseSkill(raw: string): Skill {
  const nivel = (raw.match(/\{\*\}/g) ?? []).length;
  const nome  = raw.replace(/\{\*\}/g, '').trim();
  return { nome, nivel };
}

function Stars({ nivel }: { nivel: number }) {
  return (
    <span className="text-sm">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < nivel ? 'text-amber-400' : 'text-muted-foreground/30'}>★</span>
      ))}
    </span>
  );
}

// Formata datas ISO ("2025-05-14T00:00:00") como DD/MM/YYYY; demais valores passam direto.
function fmtCampo(value: unknown): string {
  const s = String(value);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : s;
}

function tag(s: string, i: number) {
  return (
    <span key={i} className="bg-[#f0f2f5] text-xs font-medium text-foreground px-3 py-1 rounded-full">
      {s}
    </span>
  );
}

// ── Tab: Dados ────────────────────────────────────────────────────────────────

function TabDados({ p }: { p: Pessoa }) {
  const allFields: [string, unknown][] = [
    ['Cargo',            p.cargo],
    ['Cidade',           p['cidade']],
    ['Aniversário',      p['dataNascimento']],
    ['Admissão',         p['dataAdmissao']],
    ['Gestor(a)',        p['gerente']],
    ['E-mail',           p.email],
    ['Celular',          p.celular],
    ['Cel. corporativo', p['celularCorporativo']],
  ];
  const fields = allFields.filter(([, v]) => v && String(v).trim());

  const competencias = (
    Array.isArray(p['listaCompetencias'])  ? p['listaCompetencias']  :
    Array.isArray(p['competencias'])        ? p['competencias']        :
    Array.isArray(p['skills'])              ? p['skills']              : []
  ) as string[];

  const projetos = (Array.isArray(p['listaProjetos']) ? p['listaProjetos'] : []) as unknown[];

  const formacao = typeof p['formacaoAcademica'] === 'string'
    ? p['formacaoAcademica'].split('|').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="flex flex-col gap-3 py-2">
      {/* Informações */}
      {fields.length > 0 && (
        <div className="bg-white rounded-xl p-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
          {fields.map(([label, value]) => (
            <Fragment key={label}>
              <span className="text-xs text-foreground font-bold whitespace-nowrap">{label}</span>
              <span className="text-xs text-foreground break-words">{fmtCampo(value)}</span>
            </Fragment>
          ))}
        </div>
      )}

      {/* Projetos */}
      {projetos.length > 0 && (
        <div className="bg-white rounded-xl p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Projetos</p>
          <ul className="flex flex-col gap-1.5">
            {projetos.map((pr, i) => {
              // listaProjetos pode vir como array de strings (API atual) ou de objetos
              const nome = typeof pr === 'string'
                ? pr
                : String((pr as Record<string, unknown>)['nome']
                    ?? (pr as Record<string, unknown>)['servico']
                    ?? (pr as Record<string, unknown>)['nomeProjeto']
                    ?? '—');
              return (
                <li key={i} className="text-sm text-foreground">{nome}</li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Competências */}
      {competencias.length > 0 && (
        <div className="bg-white rounded-xl p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Competências</p>
          <div className="flex flex-wrap gap-2">
            {competencias.map((c, i) => tag(String(c), i))}
          </div>
        </div>
      )}

      {/* Formação */}
      {formacao.length > 0 && (
        <div className="bg-white rounded-xl p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">Formação Acadêmica</p>
          <ul className="flex flex-col gap-1.5">
            {formacao.map((f, i) => <li key={i} className="text-sm text-foreground">{f}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Tab: Kudos ────────────────────────────────────────────────────────────────

const TIPO_CONF: Record<string, { label: string; icon: string; bg: string; color: string }> = {
  K:  { label: 'Kudos',    icon: '❤️', bg: '#ede9fe', color: '#6d28d9' },
  I:  { label: 'Ideia',    icon: '💡', bg: '#fef3c7', color: '#b45309' },
  D:  { label: 'Dica',     icon: '💬', bg: '#e0f2fe', color: '#0369a1' },
  C:  { label: 'Destaque', icon: '⭐', bg: '#fee2e2', color: '#b91c1c' },
  DE: { label: 'Destaque', icon: '⭐', bg: '#fee2e2', color: '#b91c1c' },
};

type KudoItem = Record<string, unknown>;

function TabKudos({ p }: { p: Pessoa }) {
  const kudos = (Array.isArray(p['kudosWalls']) ? p['kudosWalls'] : []) as KudoItem[];

  if (!kudos.length) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <Image src={ASSETS.emptyFeed} alt="" width={100} height={100} className="h-24 w-auto" unoptimized />
        <p className="text-sm text-muted-foreground">Nenhuma publicação encontrada.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {kudos.slice(0, 10).map((k, i) => {
        const tipo   = TIPO_CONF[String(k['tipoPublicacao'] ?? 'K')] ?? TIPO_CONF.K;
        const autor  = String(k['remetenteNome'] ?? k['nomeAutor'] ?? k['nome'] ?? '—');
        const foto   = (k['remetenteFoto'] ?? k['foto'] ?? null) as string | null;
        const texto  = String(k['mensagem'] ?? k['descricao'] ?? '');
        const data   = (() => {
          const s = String(k['dataPostagem'] ?? k['dataPublicacao'] ?? '');
          if (!s) return '';
          try { return new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }); } catch { return s; }
        })();

        return (
          <div key={i} className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="px-4 pt-3 pb-1">
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full"
                style={{ background: tipo.bg, color: tipo.color }}>
                {tipo.icon} {tipo.label}
              </span>
            </div>
            <div className="px-4 py-2 flex items-center gap-3">
              <AvatarGradient nome={autor} foto={foto} size={36} />
              <div>
                <p className="text-sm font-bold leading-tight">{autor}</p>
                {data && <p className="text-xs text-muted-foreground">{data}</p>}
              </div>
            </div>
            {texto && <p className="px-4 pb-4 text-sm text-foreground leading-relaxed">{texto}</p>}
          </div>
        );
      })}
    </div>
  );
}

// ── Tab: Interesses ───────────────────────────────────────────────────────────

function TabInteresses({ p }: { p: Pessoa }) {
  const items = (Array.isArray(p['listaInteresses']) ? p['listaInteresses'] : []) as string[];
  if (!items.length) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <Image
          src={ASSETS.emptyInteresses}
          alt=""
          width={140}
          height={112}
          className="h-28 w-auto"
          unoptimized
        />
        <p className="text-sm font-medium text-muted-foreground">Nenhum interesse cadastrado.</p>
      </div>
    );
  }
  return <div className="flex flex-wrap gap-2 py-2">{items.map((s, i) => tag(String(s), i))}</div>;
}

// ── Tab: Habilidades ──────────────────────────────────────────────────────────

function SkillList({ raw }: { raw: unknown }) {
  const items = (Array.isArray(raw) ? raw as string[] : []).map(parseSkill).filter((s) => s.nome);
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((sk, i) => (
        <span key={i} className="inline-flex items-center gap-1.5 bg-[#f0f2f5] text-xs font-medium text-foreground px-3 py-1.5 rounded-full">
          {sk.nome}
          {sk.nivel > 0 && <Stars nivel={sk.nivel} />}
        </span>
      ))}
    </div>
  );
}

function TabHabilidades({ p }: { p: Pessoa }) {
  const sections = [
    { label: 'Hard Skills',   key: 'listaExperiencias' },
    { label: 'Soft Skills',   key: 'listaExperienciasSoft' },
    { label: 'Idiomas',       key: 'listaIdiomas' },
    { label: 'Certificações', key: 'listaCertificacoes' },
  ];

  const filled = sections.filter((s) => Array.isArray(p[s.key]) && (p[s.key] as unknown[]).length > 0);

  if (!filled.length) {
    return <p className="text-sm text-muted-foreground py-4">Nenhuma habilidade cadastrada.</p>;
  }

  return (
    <div className="flex flex-col gap-3 py-2">
      {filled.map((s) => (
        <div key={s.key} className="bg-white rounded-xl p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">{s.label}</p>
          <SkillList raw={p[s.key]} />
        </div>
      ))}
    </div>
  );
}

// ── DrawerColaborador ─────────────────────────────────────────────────────────

type Tab = 'dados' | 'kudos' | 'interesses' | 'habilidades';

const TABS: { id: Tab; label: string }[] = [
  { id: 'dados',        label: 'Dados' },
  { id: 'kudos',        label: 'Kudos' },
  { id: 'interesses',   label: 'Interesses' },
  { id: 'habilidades',  label: 'Habilidades' },
];

interface DrawerColaboradorProps {
  pessoaId: number;
  nomeInicial?: string;
  fotoInicial?: string | null;
  onClose: () => void;
}

export function DrawerColaborador({ pessoaId, nomeInicial = '?', fotoInicial = null, onClose }: DrawerColaboradorProps) {
  const [tab, setTab] = useState<Tab>('dados');

  const { data, isLoading, isError } = useQuery<Pessoa>({
    queryKey: ['pessoa-drawer', pessoaId],
    queryFn:  async () => {
      const res = await fetch(`/api/pessoas/${pessoaId}`);
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    enabled:   pessoaId > 0,
  });

  const nome = data ? (data.nomeSocial || data.nome) : nomeInicial;
  const foto = data?.foto ?? fotoInicial;
  const cargo = data?.cargo ?? '';

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-[1000]" onClick={onClose} aria-hidden />

      {/* Painel */}
      <div
        className="fixed top-0 right-0 bottom-0 z-[1001] flex flex-col bg-white shadow-2xl"
        style={{ width: 'min(480px, 100vw)', animation: 'drawerIn .22s ease' }}
        role="dialog"
        aria-label={`Perfil de ${nome}`}
      >
        {/* Header */}
        <div className="flex-shrink-0 border-b border-border">
          <div className="flex items-start gap-3 px-5 pt-4 pb-3">
            <AvatarGradient nome={nome} foto={foto} size={52} />
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="font-bold text-base text-foreground leading-tight truncate">{nome}</p>
              {cargo && <p className="text-sm text-muted-foreground truncate">{cargo}</p>}
              {data && (
                <div className="mt-1">
                  <SimularBtn pessoaId={pessoaId} nomePessoa={nome} />
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors flex-shrink-0"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tab nav */}
          <div className="flex border-t border-border px-5">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={[
                  'px-3 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px cursor-pointer',
                  tab === t.id
                    ? 'text-primary border-primary'
                    : 'text-muted-foreground border-transparent hover:text-foreground',
                ].join(' ')}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Corpo scrollável */}
        <div className="flex-1 overflow-y-auto px-5 py-4 bg-[#f5f7fa]">
          {isLoading && <PerfilLoader text="Carregando colaborador..." />}

          {isError && (
            <p className="text-sm text-destructive py-4 text-center">Não foi possível carregar os dados.</p>
          )}

          {data && tab === 'dados'       && <TabDados p={data} />}
          {data && tab === 'kudos'       && <TabKudos p={data} />}
          {data && tab === 'interesses'  && <TabInteresses p={data} />}
          {data && tab === 'habilidades' && <TabHabilidades p={data} />}
        </div>
      </div>
    </>
  );
}
