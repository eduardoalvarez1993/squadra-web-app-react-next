'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, Eraser, Loader2 } from 'lucide-react';
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
import { usePercentual, useProjetosBusca, useSubprojetos, useMinhasAlocacoes, type PercentualItem } from '@/features/percentual/hooks/usePercentual';
import { podeAlterarMes } from '@/features/percentual/regras';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

// Arredonda p/ 2 casas (evita 50.400000001) e formata sem zeros à toa (50.4, 168).
const round2 = (n: number) => Math.round(n * 100) / 100;
const fmtH   = (n: number) => Number(n.toFixed(2)).toString();

// Linha editável (live). Unidade = subprojeto (o que o lançar exige).
// idPercentual = lançamento atual no backend (null = não lançado); baseline = horas
// persistidas, p/ pular saves sem mudança. editavel=false p/ itens fora das alocações
// (a lista de lançados não traz subProjetoId, então não dá pra relançar — só limpar).
type Linha = {
  key:            string;
  projetoNome:    string;
  cliente:        string;
  subProjetoId:   number;
  subProjetoNome: string;
  horas:          string;
  percentual:     string;
  baselineHoras:  number;
  idPercentual:   number | null;
  editavel:       boolean;
  salvando:       boolean;
  erro:           string | null;
};

export default function PercentualPage() {
  const permissoes = useUserStore((s) => s.permissoes);
  const bateRep    = useUserStore((s) => s.permissoes.bateRep);
  const gestorId   = useUserStore((s) => s.gestorId);
  const hydrated   = gestorId !== 0;

  const hoje = new Date();
  const [year,  setYear]  = useState(hoje.getFullYear());
  const [month, setMonth] = useState(hoje.getMonth() + 1);

  const isMesAtual = year === hoje.getFullYear() && month === hoje.getMonth() + 1;

  const { dados, isLoading, isError, refetch, lancar, deletar } = usePercentual(month, year);

  const horasPrevistas   = dados?.horasPrevistas   ?? 0;

  // Pode alterar o mês selecionado? (mês corrente, ou carência até dia 6 do mês seguinte)
  const podeAlterar = podeAlterarMes(month, year, hoje);
  const editavelMes = !dados?.fechado && podeAlterar;
  const prazoEncerrado = !isLoading && !isError && !dados?.fechado && !podeAlterar;

  // Alocações ativas do mês — base da lista editável (pré-preenchida com o lançado).
  const { data: alocacoes } = useMinhasAlocacoes(month, year, editavelMes);

  const [linhas, setLinhas] = useState<Linha[]>([]);
  const seedKey = useRef<string>('');
  const mesKey  = `${year}-${month}`;

  // Monta a lista uma vez por mês: alocações ∪ lançados (casados por nome), pré-preenchidos.
  useEffect(() => {
    if (!editavelMes || !alocacoes || isLoading || seedKey.current === mesKey) return;
    const itens = dados?.itens ?? [];
    const usados = new Set<number>();
    const rows: Linha[] = [];

    for (const p of alocacoes) {
      for (const s of p.subProjetos) {
        const item = itens.find((it) => it.projetoNome === p.nome && it.subProjetoNome === s.nome);
        if (item) usados.add(Number(item.id));
        rows.push({
          key: `${p.id}-${s.id}`, projetoNome: p.nome, cliente: p.cliente,
          subProjetoId: Number(s.id), subProjetoNome: s.nome,
          horas:        item ? String(item.horasRegistradas) : '',
          percentual:   item?.percentual != null ? String(item.percentual) : '',
          baselineHoras: item ? item.horasRegistradas : 0,
          idPercentual:  item ? Number(item.id) : null,
          editavel: true, salvando: false, erro: null,
        });
      }
    }
    // Lançados que não estão nas alocações: o subProjetoId é resolvido por nome no save.
    for (const it of itens) {
      if (usados.has(Number(it.id))) continue;
      rows.push({
        key: `ext-${it.id}`, projetoNome: it.projetoNome, cliente: it.clienteNome ?? '',
        subProjetoId: 0, subProjetoNome: it.subProjetoNome ?? '',
        horas: String(it.horasRegistradas), percentual: it.percentual != null ? String(it.percentual) : '',
        baselineHoras: it.horasRegistradas, idPercentual: Number(it.id),
        editavel: true, salvando: false, erro: null,
      });
    }
    setLinhas(rows);
    seedKey.current = mesKey;
  }, [editavelMes, alocacoes, dados, isLoading, mesKey]);

  // Total: mês editável usa o que está digitado (ao vivo); mês travado usa o persistido.
  const distribuido = editavelMes
    ? linhas.reduce((sum, r) => sum + (Number(r.horas) || 0), 0)
    : (dados?.horasRegistradas ?? 0);
  const pct = horasPrevistas > 0 ? Math.round((distribuido / horasPrevistas) * 100) : 0;

  function patchRow(key: string, patch: Partial<Linha>) {
    setLinhas((rows) => rows.map((r) => r.key === key ? { ...r, ...patch } : r));
  }
  function setRowHoras(key: string, val: string) {
    const h = Math.max(0, Number(val) || 0);
    patchRow(key, {
      erro: null,
      horas:      val === '' ? '' : String(h),
      percentual: val !== '' && horasPrevistas > 0 ? String(Math.round((h / horasPrevistas) * 100)) : '',
    });
  }
  function setRowPct(key: string, val: string) {
    const p = Math.min(100, Math.max(0, Number(val) || 0));
    patchRow(key, {
      erro: null,
      percentual: val === '' ? '' : String(p),
      horas:      val !== '' && horasPrevistas > 0 ? String(round2((p / 100) * horasPrevistas)) : '',
    });
  }

  // Itens lançados fora das alocações não trazem subProjetoId — resolvemos por nome
  // (busca projeto → subprojetos → casa pelo nome do subprojeto).
  async function resolverSubProjetoId(projetoNome: string, subProjetoNome: string): Promise<number> {
    const q = encodeURIComponent(projetoNome.slice(0, 40));
    const projs = await fetch(`/api/percentual/projetos?q=${q}`).then((r) => r.ok ? r.json() : []) as Array<{ id: number | string; nome: string }>;
    const proj = projs.find((p) => p.nome === projetoNome) ?? projs[0];
    if (!proj) return 0;
    const subs = await fetch(`/api/percentual/subprojetos/${proj.id}`).then((r) => r.ok ? r.json() : []) as Array<{ id: number | string; nome: string }>;
    const sub = subs.find((s) => s.nome === subProjetoNome) ?? (subs.length === 1 ? subs[0] : undefined);
    return sub ? Number(sub.id) : 0;
  }

  // Salva a linha no blur: deleta o lançamento antigo (se houver) e relança o novo.
  // Idempotente — não depende de o POST fazer upsert. Reconciliamos o id via refetch.
  async function salvarLinha(key: string) {
    const row = linhas.find((r) => r.key === key);
    if (!row || !row.editavel || row.salvando) return;
    const novoHoras = Number(row.horas) || 0;
    if (novoHoras === row.baselineHoras) return; // sem mudança

    // Trava: a soma do mês não pode passar do previsto (100%). Avisa o máximo aqui.
    const outras = (dados?.horasRegistradas ?? 0) - row.baselineHoras;
    if (novoHoras > 0 && outras + novoHoras > horasPrevistas + 0.01) {
      const max = Math.max(0, round2(horasPrevistas - outras));
      const maxPct = horasPrevistas > 0 ? Math.round((max / horasPrevistas) * 100) : 0;
      patchRow(key, { erro: `Excede 100% do mês. Máximo aqui: ${fmtH(max)}h (${maxPct}%).` });
      return;
    }

    patchRow(key, { salvando: true, erro: null });
    try {
      let sid = row.subProjetoId;
      if (!sid && novoHoras > 0) {
        sid = await resolverSubProjetoId(row.projetoNome, row.subProjetoNome);
        if (!sid) throw new Error('Não consegui identificar o subprojeto para salvar.');
      }
      if (row.idPercentual != null) await deletar(row.idPercentual);
      if (novoHoras > 0) {
        await lancar({ subProjetoId: sid, mes: month, ano: year, horas: novoHoras, percentual: Number(row.percentual) || 0 });
      }
      const res = await refetch();
      const fresh = res.data?.itens ?? [];
      const match = fresh.find((it) => it.projetoNome === row.projetoNome && it.subProjetoNome === row.subProjetoNome);
      patchRow(key, { salvando: false, baselineHoras: novoHoras, idPercentual: match ? Number(match.id) : null, subProjetoId: sid || row.subProjetoId });
    } catch (e) {
      patchRow(key, { salvando: false, erro: (e as Error).message || 'Erro ao salvar' });
    }
  }

  // Limpar = zera os campos e remove o lançamento, mas MANTÉM o projeto na lista.
  async function limparLinha(key: string) {
    const row = linhas.find((r) => r.key === key);
    if (!row || row.salvando) return;
    if (row.idPercentual == null) { patchRow(key, { horas: '', percentual: '' }); return; }
    patchRow(key, { salvando: true, erro: null });
    try {
      await deletar(row.idPercentual);
      await refetch();
      patchRow(key, { salvando: false, horas: '', percentual: '', baselineHoras: 0, idPercentual: null });
    } catch (e) {
      patchRow(key, { salvando: false, erro: (e as Error).message || 'Erro ao remover' });
    }
  }

  // Remover = tira a sugestão de projeto da lista (e apaga o lançamento, se houver).
  async function removerLinha(key: string) {
    const row = linhas.find((r) => r.key === key);
    if (!row || row.salvando) return;
    if (row.idPercentual == null) {
      setLinhas((rows) => rows.filter((r) => r.key !== key));
      return;
    }
    patchRow(key, { salvando: true, erro: null });
    try {
      await deletar(row.idPercentual);
      await refetch();
      setLinhas((rows) => rows.filter((r) => r.key !== key));
    } catch (e) {
      patchRow(key, { salvando: false, erro: (e as Error).message || 'Erro ao remover' });
    }
  }

  // ── Drawer "Adicionar projeto" (subprojeto fora das alocações) ──
  const [modalOpen,    setModalOpen]    = useState(false);
  const [busca,        setBusca]        = useState('');
  const [projetoId,    setProjetoId]    = useState<string | number | null>(null);
  const [projetoNome,  setProjetoNome]  = useState('');
  const [subProjetoId, setSubProjetoId] = useState<string | number>('');
  const projetosQuery = useProjetosBusca(busca);
  const subprojQuery  = useSubprojetos(projetoId);

  function resetAddForm() {
    setBusca(''); setProjetoId(null); setProjetoNome(''); setSubProjetoId('');
  }
  function adicionarProjeto(e: React.FormEvent) {
    e.preventDefault();
    const sid = Number(subProjetoId) || 0;
    if (!sid) return;
    const subNome = subprojQuery.data?.find((s) => String(s.id) === String(subProjetoId))?.nome ?? '';
    setLinhas((rows) => rows.some((r) => r.subProjetoId === sid) ? rows : [...rows, {
      key: `add-${sid}`, projetoNome, cliente: '', subProjetoId: sid, subProjetoNome: subNome,
      horas: '', percentual: '', baselineHoras: 0, idPercentual: null,
      editavel: true, salvando: false, erro: null,
    }]);
    setModalOpen(false);
    resetAddForm();
  }

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

  // Registrado = já tem lançamento; Sugestões = alocações ainda não lançadas.
  const registrados = linhas.filter((r) => r.idPercentual != null);
  const sugestoes   = linhas.filter((r) => r.idPercentual == null && r.editavel);
  const temLinhas   = registrados.length > 0 || sugestoes.length > 0;

  function renderLinha(r: Linha) {
    return (
      <div key={r.key} className="bg-card border border-border rounded-card px-3 py-2.5 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide truncate">
            {r.cliente || r.projetoNome}
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            {r.salvando && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
            <button
              type="button"
              onClick={() => removerLinha(r.key)}
              disabled={r.salvando}
              className="text-muted-foreground hover:text-destructive transition-colors text-lg leading-none"
              aria-label="Remover da lista"
              title="Remover da lista"
            >
              ×
            </button>
          </div>
        </div>
        <div className="flex items-end justify-between gap-3">
          <p className="text-sm truncate flex-1 min-w-0">
            {r.projetoNome}
            {r.subProjetoNome && <span className="text-muted-foreground"> / {r.subProjetoNome}</span>}
          </p>
          <div className="flex items-end gap-2 flex-shrink-0">
            <div className="flex flex-col items-center gap-0.5">
              <label className="text-[0.6rem] text-muted-foreground leading-none">horas</label>
              <Input type="number" min="0" max={horasPrevistas || undefined} step="any" value={r.horas}
                disabled={!r.editavel || r.salvando}
                onChange={(e) => setRowHoras(r.key, e.target.value)}
                onBlur={() => salvarLinha(r.key)}
                placeholder="0" className="w-16 h-8 text-center text-sm px-1" />
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <label className="text-[0.6rem] text-muted-foreground leading-none">%</label>
              <Input type="number" min="0" max="100" value={r.percentual}
                disabled={!r.editavel || r.salvando}
                onChange={(e) => setRowPct(r.key, e.target.value)}
                onBlur={() => salvarLinha(r.key)}
                placeholder="0" className="w-14 h-8 text-center text-sm px-1" />
            </div>
            <button
              type="button"
              onClick={() => limparLinha(r.key)}
              disabled={!r.editavel || r.salvando}
              className="h-8 flex items-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
              aria-label="Limpar valores"
              title="Limpar valores"
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>
        </div>
        {r.erro && <FormFeedback type="error" message={r.erro} />}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto pb-24">
      {/* Navegação de mês */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => {
          setLinhas([]); seedKey.current = '';
          if (month === 1) { setMonth(12); setYear((y) => y - 1); }
          else setMonth((m) => m - 1);
        }}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-lg font-semibold">{MESES[month - 1]} {year}</h1>
        <Button variant="ghost" size="icon" disabled={isMesAtual} onClick={() => {
          setLinhas([]); seedKey.current = '';
          if (month === 12) { setMonth(1); setYear((y) => y + 1); }
          else setMonth((m) => m + 1);
        }}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Resumo + barra de % ao vivo */}
      {isLoading
        ? <Skeleton height="72px" width="100%" />
        : (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Previsto',  value: `${horasPrevistas}h` },
                { label: 'Distribuído', value: `${fmtH(distribuido)}h` },
                { label: 'Restante',  value: `${fmtH(horasPrevistas - distribuido)}h`, red: distribuido > horasPrevistas },
              ].map(({ label, value, red }) => (
                <div key={label} className="bg-card border border-border rounded-card p-3 flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className={`text-base font-semibold ${red ? 'text-red-500' : ''}`}>{value}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total distribuído</span>
              <span className={`font-semibold tabular-nums ${pct === 100 ? 'text-green-600' : pct > 100 ? 'text-red-500' : 'text-amber-600'}`}>
                {pct}%{pct === 100 ? ' ✓' : pct > 100 ? ' (excede 100%)' : ` (faltam ${100 - pct}%)`}
              </span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : pct > 100 ? 'bg-red-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        )
      }

      {dados?.fechado && (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-card px-3 py-2 text-sm text-green-700 dark:text-green-300">
          Fechado em {dados.dataFechamento ?? '—'}
        </div>
      )}

      {prazoEncerrado && (
        <div className="w-full bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-card px-3 py-2 text-sm text-red-700 dark:text-red-300 text-center">
          Prazo encerrado para apropriação por percentual.
        </div>
      )}

      {/* Conteúdo */}
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height="64px" width="100%" />)
      ) : editavelMes ? (
        <>
          <p className="text-xs text-muted-foreground px-1">
            Preencha horas ou % — salva automaticamente ao sair do campo.
          </p>

          {registrados.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">Registrado</p>
              {registrados.map(renderLinha)}
            </div>
          )}

          {sugestoes.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">Sugestões conforme alocação</p>
              {sugestoes.map(renderLinha)}
            </div>
          )}

          {!temLinhas && (
            <EmptyState title="Nenhum projeto alocado" description="Adicione um projeto para distribuir suas horas." />
          )}

          <Button variant="outline" onClick={() => { resetAddForm(); setModalOpen(true); }} className="w-full flex gap-2">
            <Plus className="w-4 h-4" /> Adicionar projeto
          </Button>
        </>
      ) : (
        // Mês travado/fechado → somente leitura
        (dados?.itens.length ?? 0) === 0
          ? <EmptyState title="Nenhuma alocação lançada" />
          : (
            <div className="flex flex-col gap-2">
              {dados!.itens.map((item: PercentualItem) => (
                <div key={String(item.id)} className="flex items-center justify-between bg-card border border-border rounded-card px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    {item.clienteNome && (
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide truncate">{item.clienteNome}</p>
                    )}
                    <p className="text-sm truncate">
                      {item.projetoNome}
                      {item.subProjetoNome && <span className="text-muted-foreground"> / {item.subProjetoNome}</span>}
                    </p>
                  </div>
                  <span className="text-sm font-medium tabular-nums flex-shrink-0 ml-2">
                    {item.horasRegistradas}h
                    {item.percentual != null && <span className="text-muted-foreground text-xs ml-1">• {item.percentual}%</span>}
                  </span>
                </div>
              ))}
            </div>
          )
      )}

      {/* Drawer — Adicionar projeto */}
      <DrawerForm open={modalOpen} onClose={() => { setModalOpen(false); resetAddForm(); }} title="Adicionar projeto" side="right">
        <form onSubmit={adicionarProjeto} className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Buscar projeto</label>
            <Input
              value={busca}
              onChange={(e) => { setBusca(e.target.value); setProjetoId(null); setProjetoNome(''); setSubProjetoId(''); }}
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

          <Button type="submit" disabled={!projetoId || !subProjetoId} className="w-full">
            Adicionar à lista
          </Button>
          <p className="text-xs text-muted-foreground">Depois é só preencher horas ou % na lista — salva sozinho.</p>
        </form>
      </DrawerForm>

    </div>
  );
}
