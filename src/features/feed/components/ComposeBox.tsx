'use client';

import { useState, useRef, useEffect } from 'react';
import { AvatarGradient } from '@/components/shared/AvatarGradient';

type TipoKey = 'C' | 'D' | 'I' | 'K';

const TIPOS: { key: TipoKey; label: string; icon: string; color: string; bg: string }[] = [
  { key: 'C', label: 'Destaque', icon: '⭐', color: '#b91c1c', bg: '#fee2e2' },
  { key: 'D', label: 'Dica',     icon: '💬', color: '#0369a1', bg: '#e0f2fe' },
  { key: 'I', label: 'Ideia',    icon: '💡', color: '#b45309', bg: '#fef3c7' },
  { key: 'K', label: 'Kudos',    icon: '❤️', color: '#6d28d9', bg: '#ede9fe' },
];

type Pessoa = { id: number; nome: string; foto: string | null };

interface ComposeBoxProps {
  onPost:     (payload: { texto: string; tipoPublicacao: string; destinatarioId?: number }) => Promise<void>;
  isPosting?: boolean;
}

export function ComposeBox({ onPost, isPosting = false }: ComposeBoxProps) {
  const [expanded,       setExpanded]       = useState(false);
  const [texto,          setTexto]          = useState('');
  const [tipo,           setTipo]           = useState<TipoKey | null>(null);
  const [destQuery,      setDestQuery]      = useState('');
  const [destSelecionado, setDestSelecionado] = useState<Pessoa | null>(null);
  const [destResultados, setDestResultados] = useState<Pessoa[]>([]);
  const [destLoading,    setDestLoading]    = useState(false);
  const [dropOpen,       setDropOpen]       = useState(false);
  const [erroTipo,       setErroTipo]       = useState('');
  const [erroDest,       setErroDest]       = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const destTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isKudo   = tipo === 'K';
  const tipoConf = TIPOS.find((t) => t.key === tipo) ?? null;

  // Busca de destinatário com debounce 200ms
  useEffect(() => {
    if (!isKudo || !destQuery.trim() || destSelecionado) return;
    if (destTimer.current) clearTimeout(destTimer.current);
    setDestLoading(true);
    destTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/pessoas?q=${encodeURIComponent(destQuery)}`);
        const lista: Array<Record<string, unknown>> = res.ok ? await res.json() : [];
        setDestResultados(lista.slice(0, 8).map((p) => ({
          id:   Number(p['id'] ?? p['pessoaId'] ?? 0),
          nome: String(p['nomeSocial'] ?? p['nome'] ?? ''),
          foto: (p['foto'] as string | null) || null,
        })));
        setDropOpen(true);
      } catch { setDestResultados([]); }
      setDestLoading(false);
    }, 200);
    return () => { if (destTimer.current) clearTimeout(destTimer.current); };
  }, [destQuery, isKudo, destSelecionado]);

  function selecionarDest(p: Pessoa) {
    setDestSelecionado(p);
    setDestQuery(p.nome);
    setDropOpen(false);
    setErroDest('');
  }

  function limparDest() {
    setDestSelecionado(null);
    setDestQuery('');
    setDestResultados([]);
    setDropOpen(false);
  }

  function selecionarTipo(k: TipoKey) {
    setTipo(k);
    setErroTipo('');
    if (k !== 'K') limparDest();
  }

  function reset() {
    setTexto('');
    setTipo(null);
    limparDest();
    setErroTipo('');
    setErroDest('');
    setExpanded(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  async function handlePost() {
    if (!texto.trim()) { textareaRef.current?.focus(); return; }
    if (!tipo) {
      setErroTipo('Selecione um tipo de publicação');
      setTimeout(() => setErroTipo(''), 3000);
      return;
    }
    if (isKudo && !destSelecionado) {
      setErroDest('Informe o destinatário do Kudo');
      return;
    }
    await onPost({ texto: texto.trim(), tipoPublicacao: tipo, destinatarioId: destSelecionado?.id });
    reset();
  }

  return (
    <div className="bg-white border border-border rounded-xl overflow-hidden transition-all">
      {/* Textarea */}
      <div className="px-4 pt-3 pb-2">
        <textarea
          ref={textareaRef}
          rows={expanded ? 3 : 1}
          value={texto}
          placeholder="O que você quer compartilhar? 😊"
          className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground leading-snug transition-all"
          onFocus={() => setExpanded(true)}
          onChange={(e) => {
            setTexto(e.target.value);
            // auto-resize
            e.target.style.height = 'auto';
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          disabled={isPosting}
        />
      </div>

      {expanded && (
        <>
          {/* Tipo chips */}
          <div className="px-4 pb-2">
            <div className="flex flex-wrap gap-2">
              {TIPOS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => selecionarTipo(t.key)}
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all"
                  style={tipo === t.key
                    ? { background: t.bg, color: t.color, borderColor: t.color }
                    : { background: 'transparent', color: '#6b7280', borderColor: '#e5e7eb' }
                  }
                  disabled={isPosting}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            {erroTipo && <p className="text-xs text-destructive mt-1">{erroTipo}</p>}
          </div>

          {/* Barra inferior */}
          <div className="px-4 pb-3 flex items-center gap-2 border-t border-border pt-2">
            {/* Esquerda: campo autocomplete (Kudos) ou badge de tipo */}
            <div className="flex-1 relative min-w-0">
              {isKudo ? (
                <>
                  {destSelecionado ? (
                    <div className="flex items-center gap-1.5 border border-border rounded-lg px-2.5 py-1.5 bg-[#f5f7fa] h-8">
                      <AvatarGradient nome={destSelecionado.nome} foto={destSelecionado.foto} size={20} />
                      <span className="text-xs font-medium flex-1 truncate">{destSelecionado.nome}</span>
                      <button type="button" onClick={limparDest} className="text-muted-foreground hover:text-destructive text-sm leading-none ml-1 shrink-0">×</button>
                    </div>
                  ) : (
                    <input
                      value={destQuery}
                      onChange={(e) => { setDestQuery(e.target.value); setDestSelecionado(null); setErroDest(''); }}
                      onFocus={() => destResultados.length > 0 && setDropOpen(true)}
                      onBlur={() => setTimeout(() => setDropOpen(false), 150)}
                      placeholder="Para quem? (Kudos)"
                      className="w-full h-8 border border-border rounded-lg px-2.5 text-xs bg-background outline-none focus:ring-1 focus:ring-ring"
                      disabled={isPosting}
                      autoComplete="off"
                    />
                  )}
                  {dropOpen && (destResultados.length > 0 || destLoading) && (
                    <div className="absolute z-20 w-full bottom-full mb-1 bg-white border border-border rounded-lg shadow-lg overflow-hidden">
                      {destLoading && (
                        <div className="px-3 py-2 text-xs text-muted-foreground">Buscando…</div>
                      )}
                      {destResultados.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onMouseDown={() => selecionarDest(p)}
                          className="flex items-center gap-2 w-full px-3 py-2 hover:bg-accent transition-colors text-left"
                        >
                          <AvatarGradient nome={p.nome} foto={p.foto} size={24} />
                          <span className="text-xs">{p.nome}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {erroDest && <p className="absolute -bottom-4 text-xs text-destructive whitespace-nowrap">{erroDest}</p>}
                </>
              ) : tipoConf ? (
                <span
                  className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                  style={{ background: tipoConf.bg, color: tipoConf.color }}
                >
                  {tipoConf.icon} {tipoConf.label}
                </span>
              ) : <span />}
            </div>

            {/* Botões à direita — nunca descem */}
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={reset}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2"
                disabled={isPosting}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handlePost}
                disabled={isPosting || !texto.trim()}
                className="text-xs font-semibold bg-primary text-primary-foreground rounded-lg px-4 py-1.5 disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {isPosting ? 'Publicando…' : 'Publicar'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
