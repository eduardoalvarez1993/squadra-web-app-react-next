'use client';

import { useState, type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { TabNav }       from '@/components/shared/TabNav';
import { EmptyState }   from '@/components/shared/EmptyState';
import { ErrorSection } from '@/components/shared/ErrorSection';
import { Skeleton }     from '@/components/shared/Skeleton';
import { DrawerForm }   from '@/components/shared/DrawerForm';
import { FormFeedback } from '@/components/shared/FormFeedback';
import { ASSETS }       from '@/lib/assets';
import { Button }       from '@/components/ui/button';
import { Input }        from '@/components/ui/input';
import {
  useSolicitacoes,
  type AbonoItem,
} from '@/features/solicitacoes/hooks/useSolicitacoes';
import { AbonoForm } from '@/features/solicitacoes/components/AbonoForm';
import { AbonoLoader } from '@/features/gestao/components/GestaoLoaders';

const TABS = [
  { id: 'abono',      label: 'Abono' },
  { id: 'dayoff',     label: 'Day-off' },
  { id: 'hora-extra', label: 'Hora Extra' },
];

const STATUS_COLORS: Record<string, string> = {
  APROVADO:  'text-green-600',
  PENDENTE:  'text-yellow-600',
  REPROVADO: 'text-red-500',
};

function isTrivial(s: string | undefined | null) {
  return !s || /^\.+$/.test(s.trim()) || s.trim().length === 0;
}

function SolCard({ item }: { item: AbonoItem }) {
  const colorKey = Object.keys(STATUS_COLORS).find((k) =>
    item.status.toUpperCase().includes(k),
  );
  const color = colorKey ? STATUS_COLORS[colorKey] : 'text-muted-foreground';
  const periodo = [item.dataInicio, item.dataFim !== item.dataInicio ? item.dataFim : '']
    .filter(Boolean).join(' – ');

  // Prefere descricao (tipo) como título; mostra motivo apenas se for significativo
  const titulo = item.descricao || item.motivo || '—';
  const subtitulo = !isTrivial(item.motivo) && item.motivo !== item.descricao
    ? item.motivo
    : null;

  return (
    <div className="bg-card border border-border rounded-card p-3 flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium line-clamp-1">{titulo}</span>
        <span className={`text-xs font-semibold whitespace-nowrap ${color}`}>{item.status}</span>
      </div>
      <span className="text-xs text-muted-foreground">
        {periodo}{item.horas ? ` · ${item.horas}` : ''}
      </span>
      {subtitulo && (
        <span className="text-xs text-muted-foreground italic line-clamp-1">{subtitulo}</span>
      )}
    </div>
  );
}

function HistoricoList({ items, isLoading, emptyLabel, emptyImage, loadingFallback }: {
  items: AbonoItem[];
  isLoading: boolean;
  emptyLabel: string;
  emptyImage?: string;
  loadingFallback?: ReactNode;
}) {
  if (isLoading) {
    if (loadingFallback) return loadingFallback;
    return (
      <div className="flex flex-col gap-3" aria-hidden>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} height="72px" width="100%" />
        ))}
      </div>
    );
  }
  if (!items.length) return <EmptyState image={emptyImage} title={emptyLabel} />;
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => <SolCard key={`${item.id}-${item.dataInicio}-${i}`} item={item} />)}
    </div>
  );
}

// ── Abono ─────────────────────────────────────────────────────────────────────

function TabAbono() {
  const [open, setOpen] = useState(false);
  const { abonos, isLoading } = useSolicitacoes();

  return (
    <>
      <div className="flex flex-col gap-3">
        <Button onClick={() => setOpen(true)} className="w-full flex gap-2">
          <Plus className="w-4 h-4" /> Solicitar abono
        </Button>
        <HistoricoList
          items={abonos}
          isLoading={isLoading}
          emptyLabel="Nenhum abono solicitado até o momento"
          emptyImage={ASSETS.emptySolicitacoesAbono}
          loadingFallback={<AbonoLoader />}
        />
      </div>

      <DrawerForm open={open} onClose={() => setOpen(false)} title="Solicitar abono" side="right">
        <AbonoForm onDone={() => setOpen(false)} />
      </DrawerForm>
    </>
  );
}

// ── Dayoff ────────────────────────────────────────────────────────────────────

function TabDayoff() {
  const [open,  setOpen]  = useState(false);
  const [data,  setData]  = useState('');
  const [horas, setHoras] = useState('8');
  const [just,  setJust]  = useState('');
  const [ok,    setOk]    = useState(false);

  const { dayoffs, isLoading, solicitarDayoff, isSolicitandoDO, dayoffError } = useSolicitacoes();

  return (
    <>
      <div className="flex flex-col gap-3">
        <Button onClick={() => { setOk(false); setOpen(true); }} className="w-full flex gap-2">
          <Plus className="w-4 h-4" /> Solicitar day-off
        </Button>
        <HistoricoList
          items={dayoffs}
          isLoading={isLoading}
          emptyLabel="Nenhum day-off encontrado"
          loadingFallback={<AbonoLoader />}
        />
      </div>

      <DrawerForm open={open} onClose={() => setOpen(false)} title="Solicitar day-off" side="right">
        <form
          className="flex flex-col gap-4 pt-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!data || !just) return;
            try {
              await solicitarDayoff({ data, qtdadeHoras: Number(horas) || 8, justificativa: just });
            } catch {
              // Erro de negócio do upstream — exibido via dayoffError abaixo. Não limpa o form.
              return;
            }
            setOk(true);
            setData(''); setHoras('8'); setJust('');
          }}
        >
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Data</label>
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Horas</label>
            <Input type="number" min="0.5" step="0.5" value={horas} onChange={(e) => setHoras(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Motivo</label>
            <Input value={just} onChange={(e) => setJust(e.target.value)} placeholder="Descreva o motivo" required />
          </div>
          {ok          && <FormFeedback type="ok"    message="Day-off solicitado com sucesso!" />}
          {dayoffError && <FormFeedback type="error" message={dayoffError} />}
          <Button type="submit" disabled={isSolicitandoDO} className="w-full">
            {isSolicitandoDO ? 'Enviando…' : 'Solicitar'}
          </Button>
        </form>
      </DrawerForm>
    </>
  );
}

// ── Hora Extra ────────────────────────────────────────────────────────────────

function TabHoraExtra() {
  const [open,      setOpen]      = useState(false);
  const [projetoId, setProjetoId] = useState('');
  const [data,      setData]      = useState('');
  const [horas,     setHoras]     = useState('');
  const [motivo,    setMotivo]    = useState('');
  const [noturno,   setNoturno]   = useState(false);
  const [ok,        setOk]        = useState(false);

  const { projetos, solicitarHoraExtra, isEnviandoHE, heError } = useSolicitacoes();

  return (
    <>
      <div className="flex flex-col gap-3">
        <Button onClick={() => { setOk(false); setOpen(true); }} className="w-full flex gap-2">
          <Plus className="w-4 h-4" /> Solicitar hora extra
        </Button>
        <p className="text-xs text-muted-foreground text-center pt-1">
          Máximo de 2h por solicitação.
        </p>
      </div>

      <DrawerForm open={open} onClose={() => setOpen(false)} title="Solicitar hora extra" side="right">
        <form
          className="flex flex-col gap-4 pt-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const qtd = Number(horas);
            if (!projetoId || !data || !qtd) return;
            try {
              await solicitarHoraExtra({ projetoId: Number(projetoId), data, qtdadeHoras: qtd, motivo, isNoturno: noturno ? 'S' : 'N' });
            } catch {
              // Erro de negócio do upstream — exibido via heError abaixo. Não limpa o form.
              return;
            }
            setOk(true);
            setProjetoId(''); setData(''); setHoras(''); setMotivo(''); setNoturno(false);
          }}
        >
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Projeto</label>
            <select
              value={projetoId}
              onChange={(e) => setProjetoId(e.target.value)}
              required
              className="w-full h-9 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-50"
            >
              <option value="">Selecione o projeto…</option>
              {projetos.map((p) => (
                <option key={p.id} value={String(p.id)}>{p.nome}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Data</label>
            <Input type="date" value={data} onChange={(e) => setData(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Quantidade de horas</label>
            {/* step="any": digitação livre (ex.: 1,5 = 1h30) sem travar em múltiplos. Máx 2h. */}
            <Input
              type="number"
              step="any"
              min="0.5"
              max="2"
              value={horas}
              onChange={(e) => setHoras(e.target.value)}
              placeholder="Ex.: 1,5 (1h30)"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Justificativa</label>
            <Input value={motivo} maxLength={300} onChange={(e) => setMotivo(e.target.value)} placeholder="Descreva a necessidade" required />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={noturno} onChange={(e) => setNoturno(e.target.checked)} className="rounded" />
            Período noturno
          </label>
          {ok      && <FormFeedback type="ok"    message="Hora extra solicitada com sucesso!" />}
          {heError && <FormFeedback type="error" message={heError} />}
          <Button type="submit" disabled={isEnviandoHE} className="w-full">
            {isEnviandoHE ? 'Enviando…' : 'Solicitar'}
          </Button>
        </form>
      </DrawerForm>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SolicitacoesPage() {
  const [tab, setTab] = useState('abono');
  const { isError, refetch } = useSolicitacoes();

  if (isError) {
    return (
      <div className="p-4">
        <ErrorSection message="Não foi possível carregar solicitações." onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto pb-24">
      <h1 className="sr-only">Minhas Solicitações</h1>
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="px-4 pt-3">
          <TabNav tabs={TABS} active={tab} onChange={setTab} />
        </div>
        <div className="p-4">
          {tab === 'abono'      && <TabAbono />}
          {tab === 'dayoff'     && <TabDayoff />}
          {tab === 'hora-extra' && <TabHoraExtra />}
        </div>
      </div>
    </div>
  );
}
