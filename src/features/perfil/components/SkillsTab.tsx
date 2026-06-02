'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { PerfilData } from '@/services/squadra-client';

// ── Serialização {*} ──────────────────────────────────────────────────────────

type Skill = { nome: string; nivel: number };

function parseSkills(raw: unknown): Skill[] {
  if (!Array.isArray(raw)) return [];
  return (raw as string[]).map((s) => {
    if (typeof s !== 'string') return { nome: String(s), nivel: 0 };
    const nivel = (s.match(/\{\*\}/g) ?? []).length;
    const nome  = s.replace(/\{\*\}/g, '').trim();
    return { nome, nivel };
  }).filter((s) => s.nome);
}

function serSkills(list: Skill[]): string[] {
  return list.map((s) => s.nome + '{*}'.repeat(s.nivel));
}

// ── Seções ────────────────────────────────────────────────────────────────────

type SecKey = 'listaExperiencias' | 'listaExperienciasSoft' | 'listaOutrasCompetencias'
            | 'listaCertificacoes' | 'listaIdiomas';

const SECTIONS: { key: SecKey; label: string; tipo: string | null }[] = [
  { key: 'listaExperiencias',       label: 'Hard Skills',          tipo: 'Hard Skill' },
  { key: 'listaExperienciasSoft',   label: 'Soft Skills',          tipo: 'Soft Skill' },
  { key: 'listaOutrasCompetencias', label: 'Outras Competências',  tipo: null },
  { key: 'listaCertificacoes',      label: 'Certificações',        tipo: null },
  { key: 'listaIdiomas',            label: 'Idiomas',              tipo: null },
];

// ── Autocomplete ──────────────────────────────────────────────────────────────

type Sugestao = { nome: string; tipo: string | null };

async function fetchSugestoes(): Promise<Sugestao[]> {
  try {
    const res = await fetch('/assets/sugestoes.json');
    return res.ok ? res.json() : [];
  } catch { return []; }
}

// ── StarPicker ────────────────────────────────────────────────────────────────

function StarPicker({ nivel, onChange }: { nivel: number; onChange: (n: number) => void }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(nivel === i + 1 ? 0 : i + 1)}
          className={`text-base leading-none transition-colors ${i < nivel ? 'text-amber-400' : 'text-muted-foreground/30 hover:text-amber-300'}`}
          aria-label={`${i + 1} estrela${i > 0 ? 's' : ''}`}
        >
          {i < nivel ? '★' : '☆'}
        </button>
      ))}
    </span>
  );
}

// ── SkillChip ─────────────────────────────────────────────────────────────────

function SkillChip({ skill, onRemove, onNivel }: { skill: Skill; onRemove: () => void; onNivel: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1.5 bg-[#f5f7fa] border border-border rounded-full pl-3 pr-2 py-1.5">
      <span className="text-xs font-medium text-foreground">{skill.nome}</span>
      <StarPicker nivel={skill.nivel} onChange={onNivel} />
      <button
        type="button"
        onClick={onRemove}
        className="text-muted-foreground hover:text-destructive transition-colors text-sm leading-none ml-0.5"
        aria-label={`Remover ${skill.nome}`}
      >
        ×
      </button>
    </div>
  );
}

// ── AddRow ────────────────────────────────────────────────────────────────────

function AddRow({
  tipo, sugestoes, onAdd,
}: { tipo: string | null; sugestoes: Sugestao[]; onAdd: (s: Skill) => void }) {
  const [input, setInput] = useState('');
  const [nivel, setNivel] = useState(0);
  const [drop,  setDrop]  = useState(false);
  const [valid, setValid] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = sugestoes
    .filter((s) => (tipo === null || s.tipo === tipo) && s.nome.toLowerCase().includes(input.toLowerCase()))
    .slice(0, 8);

  function select(nome: string) {
    setInput(nome);
    setDrop(false);
    setValid(true);
  }

  function add() {
    if (!valid || !input.trim()) return;
    onAdd({ nome: input.trim(), nivel });
    setInput(''); setNivel(0); setValid(false);
    inputRef.current?.focus();
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="relative flex-1">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => { setInput(e.target.value); setDrop(true); setValid(false); }}
          onFocus={() => { if (input) setDrop(true); }}
          onBlur={() => setTimeout(() => setDrop(false), 150)}
          onKeyDown={(e) => { if (e.key === 'Escape') { setInput(''); setValid(false); setDrop(false); } }}
          placeholder="Busque nas sugestões…"
          className="w-full border border-border rounded-lg px-3 py-1.5 text-sm bg-background outline-none focus:ring-1 focus:ring-ring"
        />
        {drop && filtered.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-border rounded-lg shadow-md overflow-hidden">
            {filtered.map((s) => (
              <button
                key={s.nome}
                type="button"
                onMouseDown={() => select(s.nome)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                {s.nome}
              </button>
            ))}
          </div>
        )}
      </div>
      <StarPicker nivel={nivel} onChange={setNivel} />
      <button
        type="button"
        onClick={add}
        disabled={!valid}
        className="flex-shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        + Add
      </button>
    </div>
  );
}

// ── SkillsTab ─────────────────────────────────────────────────────────────────

type State = Record<SecKey, Skill[]>;
type SaveStatus = 'idle' | 'saving' | 'ok' | 'error';

export function SkillsTab({ perfil }: { perfil: PerfilData }) {
  const init = (): State => Object.fromEntries(
    SECTIONS.map((s) => [s.key, parseSkills(perfil[s.key])])
  ) as State;

  const [skills,    setSkills]    = useState<State>(init);
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [status,    setStatus]    = useState<SaveStatus>('idle');
  const [errorMsg,  setErrorMsg]  = useState('Erro ao salvar');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRender = useRef(true);

  useEffect(() => { fetchSugestoes().then(setSugestoes); }, []);

  const save = useCallback(async (s: State) => {
    setStatus('saving');
    try {
      const payload: Record<string, string[]> = {};
      for (const sec of SECTIONS) payload[sec.key] = serSkills(s[sec.key]);
      const res = await fetch('/api/perfil/competencias', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setStatus('ok');
        setTimeout(() => setStatus('idle'), 2500);
      } else {
        const data = await res.json().catch(() => ({})) as { error?: string };
        setErrorMsg(data.error ?? 'Erro ao salvar');
        setStatus('error');
      }
    } catch { setErrorMsg('Erro de rede'); setStatus('error'); }
  }, []);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(skills), 600);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [skills, save]);

  function update(key: SecKey, fn: (prev: Skill[]) => Skill[]) {
    setSkills((s) => ({ ...s, [key]: fn(s[key]) }));
  }

  const statusEl = {
    saving: <span className="text-xs text-amber-600 font-medium">Salvando…</span>,
    ok:     <span className="text-xs text-green-600 font-medium">✓ Salvo</span>,
    error:  <span className="text-xs text-destructive font-medium">{errorMsg}</span>,
    idle:   null,
  }[status];

  return (
    <div className="flex flex-col gap-5 py-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Competências &amp; Skills</h2>
        {statusEl}
      </div>

      {SECTIONS.map((sec) => (
        <div key={sec.key} className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-muted-foreground">{sec.label}</h3>

          <div className="flex flex-wrap gap-2">
            {skills[sec.key].length === 0 && (
              <span className="text-xs text-muted-foreground italic">Nenhuma adicionada</span>
            )}
            {skills[sec.key].map((sk, i) => (
              <SkillChip
                key={`${sk.nome}-${i}`}
                skill={sk}
                onRemove={() => update(sec.key, (prev) => prev.filter((_, idx) => idx !== i))}
                onNivel={(n) => update(sec.key, (prev) => prev.map((x, idx) => idx === i ? { ...x, nivel: n } : x))}
              />
            ))}
          </div>

          <AddRow
            tipo={sec.tipo}
            sugestoes={sugestoes}
            onAdd={(sk) => update(sec.key, (prev) => {
              if (prev.some((x) => x.nome.toLowerCase() === sk.nome.toLowerCase())) return prev;
              return [...prev, sk];
            })}
          />
        </div>
      ))}
    </div>
  );
}
