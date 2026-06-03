'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { useUserStore } from '@/store/user';
import { temAcessoDP } from '@/lib/dp-access';
import { TabNav }        from '@/components/shared/TabNav';
import { SolicitacaoCard } from '@/components/shared/SolicitacaoCard';
import { EmptyState }    from '@/components/shared/EmptyState';
import { ErrorSection }  from '@/components/shared/ErrorSection';
import { Button }        from '@/components/ui/button';
import { useRH }         from '@/features/rh/hooks/useRH';
import type { AbonoRH, FeriasRHItem } from '@/services/squadra-client';
import { FeriasLoader }  from '@/features/gestao/components/GestaoLoaders';
import { ASSETS }        from '@/lib/assets';

const TABS = [
  { id: 'abonos', label: 'Abonos' },
  { id: 'ferias', label: 'Férias' },
];

function statusMap(s: string): 'pendente' | 'aprovado' | 'reprovado' | 'cancelado' {
  if (s === 'A') return 'aprovado';
  if (s === 'R') return 'reprovado';
  if (s === 'C') return 'cancelado';
  return 'pendente';
}

// ── MIME detection por assinatura base64 ──────────────────────────────────────

function detectMime(b64: string): string {
  if (b64.startsWith('JVBERi')) return 'application/pdf';
  if (b64.startsWith('/9j/'))   return 'image/jpeg';
  if (b64.startsWith('iVBOR')) return 'image/png';
  if (b64.startsWith('R0lGO')) return 'image/gif';
  return 'application/octet-stream';
}

// ── Viewer de anexo ───────────────────────────────────────────────────────────

function AnexoViewer({ id, status, onClose }: { id: string | number; status: 'P' | 'A' | 'R'; onClose: () => void }) {
  const [arquivo, setArquivo] = useState<string | null>(null);
  const [erro,    setErro]    = useState(false);

  useEffect(() => {
    fetch(`/api/rh/abonos/${id}/anexo?status=${status}`)
      .then((r) => r.json())
      .then((d) => {
        const a = (d as { arquivo?: string }).arquivo;
        if (a) setArquivo(a); else setErro(true);
      })
      .catch(() => setErro(true));
  }, [id, status]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const mime = arquivo ? detectMime(arquivo) : '';
  const src  = arquivo ? `data:${mime};base64,${arquivo}` : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-xl shadow-2xl overflow-hidden max-w-2xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-semibold">Anexo</span>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-auto flex items-center justify-center p-4 min-h-[200px]">
          {!arquivo && !erro && (
            <div className="flex flex-col items-center gap-2 text-muted-foreground text-sm">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Carregando anexo…
            </div>
          )}
          {erro && <ErrorSection message="Não foi possível carregar o anexo." />}
          {arquivo && mime.startsWith('image/') && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="Anexo" className="max-w-full max-h-[70vh] object-contain rounded" />
          )}
          {arquivo && mime === 'application/pdf' && (
            <iframe src={src} className="w-full h-[70vh] border-0 rounded" title="Anexo PDF" />
          )}
          {arquivo && mime === 'application/octet-stream' && (
            <div className="text-center text-sm text-muted-foreground">
              <p>Formato não suportado para visualização.</p>
              <a href={src} download="anexo" className="mt-2 inline-block text-primary underline underline-offset-2">
                Baixar arquivo
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RHAbonosLoader() {
  return (
    <div className="gestao-loader-wrap">
      <div className="rh-abonos-stack-stage" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, i) => (
          <Image
            key={i}
            src={ASSETS.loadingAbonos}
            alt=""
            width={230}
            height={230}
            className={`rh-abonos-stack-card rh-abonos-stack-card-${i + 1}`}
            priority
          />
        ))}
      </div>
      <strong>Buscando abonos…</strong>
    </div>
  );
}

// ── AbonoList ─────────────────────────────────────────────────────────────────

function AbonoList({
  abonos, isLoading, statusAbono, onSetStatus, onAvaliar,
}: {
  abonos:      AbonoRH[];
  isLoading:   boolean;
  statusAbono: 'P' | 'A' | 'R';
  onSetStatus: (s: 'P' | 'A' | 'R') => void;
  onAvaliar:   (id: string | number, acao: 'A' | 'R') => void;
}) {
  const [verAnexoId, setVerAnexoId] = useState<string | number | null>(null);

  return (
    <>
      <TabNav
        tabs={[
          { id: 'P', label: 'Pendentes' },
          { id: 'A', label: 'Aprovados' },
          { id: 'R', label: 'Reprovados' },
        ]}
        active={statusAbono}
        onChange={(id) => onSetStatus(id as 'P' | 'A' | 'R')}
      />

      {isLoading ? (
        <RHAbonosLoader />
      ) : abonos.length === 0 ? (
        <EmptyState title="Nenhum abono encontrado." />
      ) : (
        <div className="flex flex-col gap-3">
          {abonos.map((a) => (
            <SolicitacaoCard
              key={String(a.idUnico)}
              nome={a.nomeColaborador}
              foto={a.foto}
              tipo="abono"
              status={statusMap(a.status)}
              detalhes={<span>{a.tipo}{a.data ? ` — ${a.data}` : ''}{a.horas ? ` (${a.horas})` : ''}{a.motivo ? ` — ${a.motivo}` : ''}</span>}
              actions={
                <div className="flex items-center gap-2 flex-wrap">
                  {a.temAnexo && (
                    <Button size="sm" variant="outline" onClick={() => setVerAnexoId(a.idUnico)}>
                      📎 Ver anexo
                    </Button>
                  )}
                  {statusMap(a.status) === 'pendente' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => onAvaliar(a.idUnico, 'R')}>
                        Reprovar
                      </Button>
                      <Button size="sm" onClick={() => onAvaliar(a.idUnico, 'A')}>
                        Aprovar
                      </Button>
                    </>
                  )}
                </div>
              }
            />
          ))}
        </div>
      )}

      {verAnexoId !== null && (
        <AnexoViewer id={verAnexoId} status={statusAbono} onClose={() => setVerAnexoId(null)} />
      )}
    </>
  );
}

// ── FeriasList ────────────────────────────────────────────────────────────────

function FeriasList({
  ferias, isLoading, onAvaliar,
}: {
  ferias:    FeriasRHItem[];
  isLoading: boolean;
  onAvaliar: (id: number, acao: 'A' | 'R') => void;
}) {
  if (isLoading) return <FeriasLoader />;
  if (!ferias.length) return <EmptyState image={ASSETS.emptyFerias} title="Sem férias pendentes" />;

  return (
    <div className="flex flex-col gap-3">
      {ferias.map((f) => (
        <SolicitacaoCard
          key={f.idFerias}
          nome={f.nomeColaborador}
          foto={f.foto}
          tipo="ferias"
          status={statusMap(f.status)}
          detalhes={<span>{f.dataInicio} → {f.dataFim}</span>}
          actions={statusMap(f.status) === 'pendente' ? (
            <>
              <Button size="sm" variant="outline" onClick={() => onAvaliar(f.idFerias, 'R')}>
                Reprovar
              </Button>
              <Button size="sm" onClick={() => onAvaliar(f.idFerias, 'A')}>
                Aprovar
              </Button>
            </>
          ) : undefined}
        />
      ))}
    </div>
  );
}

// ── RHPage ────────────────────────────────────────────────────────────────────

export default function RHPage() {
  const perfilDP = useUserStore((s) => s.permissoes.perfilDP);
  const cargo    = useUserStore((s) => s.cargo);
  const acessoDP = temAcessoDP(perfilDP, cargo);
  const [tab, setTab] = useState('abonos');

  const {
    abonos, ferias,
    isLoadingAbonos, isLoadingFerias,
    isError,
    statusAbono, setStatusAbono,
    avaliarAbono, avaliarFerias,
  } = useRH();

  if (!acessoDP) {
    return (
      <div className="p-4">
        <ErrorSection message="Acesso restrito ao Departamento Pessoal." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4">
        <ErrorSection message="Não foi possível carregar os dados de RH." onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto pb-24">
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-4 pt-3">
          <TabNav tabs={TABS} active={tab} onChange={setTab} />
        </div>
        <div className="p-4 flex flex-col gap-4">
          {tab === 'abonos' && (
            <AbonoList
              abonos={abonos}
              isLoading={isLoadingAbonos}
              statusAbono={statusAbono}
              onSetStatus={setStatusAbono}
              onAvaliar={avaliarAbono}
            />
          )}

          {tab === 'ferias' && (
            <FeriasList ferias={ferias} isLoading={isLoadingFerias} onAvaliar={avaliarFerias} />
          )}
        </div>
      </div>
    </div>
  );
}
