'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useUserStore } from '@/store/user';
import { temAcessoDP } from '@/lib/dp-access';
import { statusLabel } from '@/lib/status';
import { detectMime } from '@/lib/mime';
import { TabNav }        from '@/components/shared/TabNav';
import { SolicitacaoCard } from '@/components/shared/SolicitacaoCard';
import { EmptyState }    from '@/components/shared/EmptyState';
import { ErrorSection }  from '@/components/shared/ErrorSection';
import { Button }        from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRH }         from '@/features/rh/hooks/useRH';
import type { AbonoRH, FeriasRHItem } from '@/services/squadra-client';
import { FeriasLoader }  from '@/features/gestao/components/GestaoLoaders';
import { ASSETS }        from '@/lib/assets';

const TABS = [
  { id: 'abonos', label: 'Abonos' },
  { id: 'ferias', label: 'Férias' },
];

// ── Viewer de anexo ───────────────────────────────────────────────────────────
// Usa o Dialog do projeto (foco, aria-modal, Esc e retorno de foco gerenciados)
// e renderiza o arquivo via Blob URL (evita data: URI gigante travar a UI).

function AnexoViewer({ id, status, onClose }: { id: string | number; status: 'P' | 'A' | 'R'; onClose: () => void }) {
  const [url,  setUrl]  = useState<string | null>(null);
  const [mime, setMime] = useState('');
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let cancelado = false;
    let objectUrl = '';
    fetch(`/api/rh/abonos/${id}/anexo?status=${status}`)
      .then((r) => r.json())
      .then((d) => {
        const b64 = (d as { arquivo?: string }).arquivo?.replace(/\s/g, '');
        if (!b64) { if (!cancelado) setErro(true); return; }
        const m = detectMime(b64);
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        objectUrl = URL.createObjectURL(new Blob([bytes], { type: m }));
        if (!cancelado) { setMime(m); setUrl(objectUrl); }
      })
      .catch(() => { if (!cancelado) setErro(true); });
    return () => { cancelado = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [id, status]);

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Anexo</DialogTitle>
        </DialogHeader>
        <div className="overflow-auto flex items-center justify-center p-2 min-h-[200px] max-h-[70vh]">
          {!url && !erro && (
            <div className="flex flex-col items-center gap-2 text-muted-foreground text-sm" role="status" aria-live="polite">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Carregando anexo…
            </div>
          )}
          {erro && <ErrorSection message="Não foi possível carregar o anexo." />}
          {url && mime.startsWith('image/') && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="Anexo do abono" className="max-w-full max-h-[68vh] object-contain rounded" />
          )}
          {url && mime === 'application/pdf' && (
            <iframe src={url} className="w-full h-[68vh] border-0 rounded" title="Anexo PDF" />
          )}
          {url && mime === 'application/octet-stream' && (
            <div className="text-center text-sm text-muted-foreground">
              <p>Formato não suportado para visualização.</p>
              <a href={url} download="anexo" className="mt-2 inline-block text-primary underline underline-offset-2">
                Baixar arquivo
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RHAbonosLoader() {
  return (
    <div className="gestao-loader-wrap" role="status" aria-live="polite">
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
  const [verAnexo, setVerAnexo] = useState<AbonoRH | null>(null);

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
              status={statusLabel(a.status)}
              detalhes={<span>{a.tipo}{a.data ? ` — ${a.data}` : ''}{a.horas ? ` (${a.horas})` : ''}{a.motivo ? ` — ${a.motivo}` : ''}</span>}
              actions={
                <div className="flex items-center gap-2 flex-wrap">
                  {a.temAnexo && (
                    <Button size="sm" variant="outline" onClick={() => setVerAnexo(a)}>
                      📎 Ver anexo
                    </Button>
                  )}
                  {statusLabel(a.status) === 'pendente' && (
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

      {verAnexo && (
        <AnexoViewer
          id={verAnexo.idUnico}
          status={(verAnexo.status === 'C' ? 'P' : verAnexo.status) as 'P' | 'A' | 'R'}
          onClose={() => setVerAnexo(null)}
        />
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
          status={statusLabel(f.status)}
          detalhes={<span>{f.dataInicio} → {f.dataFim}</span>}
          actions={statusLabel(f.status) === 'pendente' ? (
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
      <h1 className="sr-only">RH — Departamento Pessoal</h1>
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
