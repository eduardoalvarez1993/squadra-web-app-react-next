'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorSection } from '@/components/shared/ErrorSection';
import { AccessDenied } from '@/components/shared/AccessDenied';
import { VerificandoCredenciais } from '@/components/shared/VerificandoCredenciais';
import { Skeleton } from '@/components/shared/Skeleton';
import { FormFeedback } from '@/components/shared/FormFeedback';
import { DrawerForm } from '@/components/shared/DrawerForm';
import { useUserStore } from '@/store/user';
import { usePercentual, useProjetosBusca, useSubprojetos, type LancarInput, type PercentualItem } from '@/features/percentual/hooks/usePercentual';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function PercentualPage() {
  const permissoes = useUserStore((s) => s.permissoes);
  const bateRep    = useUserStore((s) => s.permissoes.bateRep);
  const gestorId   = useUserStore((s) => s.gestorId);
  const hydrated   = gestorId !== 0;

  const hoje = new Date();
  const [year,  setYear]  = useState(hoje.getFullYear());
  const [month, setMonth] = useState(hoje.getMonth() + 1);

  const isMesAtual = year === hoje.getFullYear() && month === hoje.getMonth() + 1;

  const { dados, isLoading, isError, refetch, lancar, isLancando, lancarError, deletar, isDeletando, fechar, isFechando, fecharError } = usePercentual(month, year);

  const [modalOpen,     setModalOpen]     = useState(false);
  const [confirmFechar, setConfirmFechar] = useState(false);
  const [deletandoItem, setDeletandoItem] = useState<PercentualItem | null>(null);

  // Lançar form
  const [busca,        setBusca]        = useState('');
  const [projetoId,    setProjetoId]    = useState<string | number | null>(null);
  const [projetoNome,  setProjetoNome]  = useState('');
  const [subProjetoId, setSubProjetoId] = useState<string | number>('');
  const [horas,        setHoras]        = useState('');
  const [percentual,   setPercentual]   = useState('');
  const [lancOk,       setLancOk]       = useState(false);

  const projetosQuery  = useProjetosBusca(busca);
  const subprojQuery   = useSubprojetos(projetoId);

  const horasPrevistas   = dados?.horasPrevistas   ?? 0;
  const horasRegistradas = dados?.horasRegistradas ?? 0;
  const restante         = horasPrevistas - horasRegistradas;

  if (!hydrated) return <VerificandoCredenciais />;
  if (!permissoes.gerenteFuncional || bateRep) {
    return <AccessDenied description="O percentual fica disponivel para gestores que nao registram ponto pelo app." />;
  }

  if (isError) {
    return (
      <div className="p-4">
        <ErrorSection message="Não foi possível carregar dados de percentual." onRetry={() => refetch()} />
      </div>
    );
  }

  async function handleLancar(e: React.FormEvent) {
    e.preventDefault();
    if (!subProjetoId && (subprojQuery.data?.length ?? 0) > 0) return;
    const input: LancarInput = {
      subProjetoId: Number(subProjetoId) || 0,
      mes:          month,
      ano:          year,
      horas:        Number(horas) || 0,
      percentual:   Number(percentual) || 0,
    };
    await lancar(input);
    setLancOk(true);
    setBusca(''); setProjetoId(null); setProjetoNome(''); setSubProjetoId('');
    setHoras(''); setPercentual('');
  }

  // Janela de deleção: dia 1-6 do mês seguinte
  const inDeleteWindow = hoje.getDate() <= 6;

  return (
    <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto pb-24">
      {/* Navegação de mês */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => {
          if (month === 1) { setMonth(12); setYear((y) => y - 1); }
          else setMonth((m) => m - 1);
        }}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-lg font-semibold">{MESES[month - 1]} {year}</h1>
        <Button variant="ghost" size="icon" disabled={isMesAtual} onClick={() => {
          if (month === 12) { setMonth(1); setYear((y) => y + 1); }
          else setMonth((m) => m + 1);
        }}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Header resumo */}
      {isLoading
        ? <Skeleton height="72px" width="100%" />
        : (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Previsto',  value: `${horasPrevistas}h` },
              { label: 'Alocado',   value: `${horasRegistradas}h` },
              { label: 'Restante',  value: `${restante}h`, red: restante < 0 },
            ].map(({ label, value, red }) => (
              <div key={label} className="bg-card border border-border rounded-card p-3 flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className={`text-base font-semibold ${red ? 'text-red-500' : ''}`}>{value}</span>
              </div>
            ))}
          </div>
        )
      }

      {dados?.fechado && (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-card px-3 py-2 text-sm text-green-700 dark:text-green-300">
          Fechado em {dados.dataFechamento ?? '—'}
        </div>
      )}

      {/* Lista de itens */}
      {isLoading
        ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height="56px" width="100%" />)
        : (dados?.itens.length ?? 0) === 0
        ? <EmptyState title="Nenhuma alocação lançada" description="Adicione alocações para este mês." />
        : (
          <div className="flex flex-col gap-2">
            {dados!.itens.map((item: PercentualItem) => (
              <div key={String(item.id)} className="flex items-center justify-between bg-card border border-border rounded-card px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  {item.clienteNome && (
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide truncate">
                      {item.clienteNome}
                    </p>
                  )}
                  <p className="text-sm truncate">
                    {item.projetoNome}
                    {item.subProjetoNome && <span className="text-muted-foreground"> / {item.subProjetoNome}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                  <span className="text-sm font-medium tabular-nums">
                    {item.horasRegistradas}h
                    {item.percentual != null && <span className="text-muted-foreground text-xs ml-1">• {item.percentual}%</span>}
                  </span>
                  {!dados?.fechado && inDeleteWindow && (
                    <button
                      type="button"
                      onClick={() => setDeletandoItem(item)}
                      disabled={isDeletando}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Remover"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      }

      {/* Ações */}
      {!dados?.fechado && (
        <Button onClick={() => { setLancOk(false); setModalOpen(true); }} className="w-full flex gap-2">
          <Plus className="w-4 h-4" /> Adicionar
        </Button>
      )}

      {/* Drawer — Lançar */}
      <DrawerForm open={modalOpen} onClose={() => setModalOpen(false)} title="Lançar alocação" side="right">
        <form onSubmit={handleLancar} className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Buscar projeto</label>
            <Input
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setProjetoId(null); setProjetoNome(''); }}
              placeholder="Mínimo 3 caracteres…"
            />
            {projetosQuery.data && projetosQuery.data.length > 0 && !projetoId && (
              <div className="border border-border rounded-md overflow-hidden mt-1">
                {projetosQuery.data.map((p) => (
                  <button
                    key={String(p.id)}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                    onClick={() => { setProjetoId(p.id); setProjetoNome(p.nome); setBusca(p.nome); }}
                  >
                    {p.nome} {p.cliente && <span className="text-muted-foreground">— {p.cliente}</span>}
                  </button>
                ))}
              </div>
            )}
            {projetoNome && <p className="text-xs text-green-600">Projeto selecionado: {projetoNome}</p>}
          </div>

          {subprojQuery.data && subprojQuery.data.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Subprojeto</label>
              <select
                className="border border-border rounded-md px-3 py-2 text-sm bg-background"
                value={String(subProjetoId)}
                onChange={(e) => setSubProjetoId(e.target.value)}
                required
              >
                <option value="">Selecione…</option>
                {subprojQuery.data.map((s) => (
                  <option key={String(s.id)} value={String(s.id)}>{s.nome}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Horas</label>
              <Input
                type="number"
                min="0"
                max={horasPrevistas || undefined}
                step="0.5"
                value={horas}
                onChange={(e) => {
                  const v = Math.min(Number(e.target.value), horasPrevistas || Infinity);
                  setHoras(String(v));
                  if (horasPrevistas > 0)
                    setPercentual(String(Math.min(Math.round((v / horasPrevistas) * 100), 100)));
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Percentual (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={percentual}
                onChange={(e) => {
                  const v = Math.min(Number(e.target.value), 100);
                  setPercentual(String(v));
                  if (horasPrevistas > 0)
                    setHoras(String(Math.min(Math.round((v / 100) * horasPrevistas), horasPrevistas)));
                }}
              />
            </div>
          </div>

          {horasPrevistas > 0 && (
            <p className="text-xs text-muted-foreground">
              Restante disponível: <span className={restante < 0 ? 'text-red-500 font-medium' : 'font-medium'}>{restante.toFixed(0)}h</span>
            </p>
          )}

          {lancOk    && <FormFeedback type="ok"    message="Alocação lançada com sucesso!" />}
          {lancarError && <FormFeedback type="error" message={lancarError} />}

          <Button type="submit" disabled={isLancando || !projetoId} className="w-full">
            {isLancando ? 'Lançando…' : 'Confirmar'}
          </Button>
        </form>
      </DrawerForm>

      {/* Drawer — Confirmar delete */}
      <DrawerForm open={!!deletandoItem} onClose={() => setDeletandoItem(null)} title="Remover alocação" side="right">
        <div className="flex flex-col gap-4 pt-2">
          <p className="text-sm">
            Remover a alocação{' '}
            <strong>{deletandoItem?.projetoNome}{deletandoItem?.subProjetoNome ? ` / ${deletandoItem.subProjetoNome}` : ''}</strong>?
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeletandoItem(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={isDeletando}
              onClick={async () => {
                if (deletandoItem) await deletar(deletandoItem.id);
                setDeletandoItem(null);
              }}
            >
              {isDeletando ? 'Removendo…' : 'Remover'}
            </Button>
          </div>
        </div>
      </DrawerForm>

      {/* Drawer — Confirmar fechar */}
      <DrawerForm open={confirmFechar} onClose={() => setConfirmFechar(false)} title="Fechar mês" side="right">
        <div className="flex flex-col gap-4 pt-2">
          <p className="text-sm text-destructive font-medium">
            Esta ação é <strong>irreversível</strong>. O mês {MESES[month - 1]}/{year} será fechado
            e não poderá ser reaberto pelo app.
          </p>
          {fecharError && <FormFeedback type="error" message={fecharError} />}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmFechar(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={isFechando}
              onClick={async () => {
                await fechar();
                setConfirmFechar(false);
              }}
            >
              {isFechando ? 'Fechando…' : 'Confirmar'}
            </Button>
          </div>
        </div>
      </DrawerForm>
    </div>
  );
}
