'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Plus, Trash2, Loader2, Zap, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DrawerForm } from '@/components/shared/DrawerForm';
import { ErrorSection } from '@/components/shared/ErrorSection';
import { FormFeedback } from '@/components/shared/FormFeedback';
import { AccessDenied } from '@/components/shared/AccessDenied';
import { VerificandoCredenciais } from '@/components/shared/VerificandoCredenciais';
import { useUserStore } from '@/store/user';
import { usePonto, useApontamentosDia, toMin, horaExtraAprovadaMin, type PontoDiaPendente } from '@/features/ponto/hooks/usePonto';
import { PontoCalendar } from '@/features/ponto/components/PontoCalendar';
import { PontosPendentes } from '@/features/ponto/components/PontosPendentes';
import { ApontamentoForm } from '@/features/ponto/components/ApontamentoForm';
import { HoraExtraInlineForm, AbonoInlineForm } from '@/features/ponto/components/SolicitacaoInline';
import { isMesFechado } from '@/lib/periodo-fechado';
import type { PontoDia } from '@/services/squadra-client';

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

function sumHoras(horas: string[]): string {
  const total = horas.reduce((acc, h) => acc + toMin(h), 0);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

type DrawerMode = 'registrar' | 'solicitar' | 'aguardar' | 'apontar' | 'hora-extra' | 'abono' | null;

function PontoPageContent() {
  const bateRep      = useUserStore((s) => s.permissoes.bateRep);
  const gestorId     = useUserStore((s) => s.gestorId);
  const hydrated     = gestorId !== 0;
  // Ponto vs Percentual é decidido SÓ pelo bateRep: quem não bate ponto apropria
  // horas por % e fica fora desta tela. Não depende de gerência nem de equipe.
  const ehPercentual = !bateRep;
  const searchParams = useSearchParams();

  // Ver ponto de outro usuário via search params ?sqhorasId=X&nome=Y
  const outraSqhorasId = searchParams.get('sqhorasId') ? Number(searchParams.get('sqhorasId')) : undefined;
  const outraNome      = searchParams.get('nome') ?? undefined;

  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const inicio  = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const fim     = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  // Mês fechado (computado): às 12:00 BRT do dia 1º do mês seguinte ele trava e nenhum
  // dia aceita ação — sem botões, faixa de aviso e card de pendências oculto.
  const mesFechado = isMesFechado(year, month);

  const {
    meses,
    dias,
    pendentes,
    projetos,
    diasSemApontamento,
    isLoading,
    isError,
    errorCode,
    registrar,
    isRegistrando,
    liberacao,
    isLiberando,
    liberacaoError,
  } = usePonto(inicio, fim, outraSqhorasId);

  const [drawerDia,  setDrawerDia]  = useState<PontoDia | null>(null);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  // Modo do apontamento de onde os atalhos de HE/abono foram abertos — usado pelo
  // botão "Voltar" para retornar à mesma visão.
  const [solReturn,  setSolReturn]  = useState<DrawerMode>('registrar');

  function openSolicitacao(modo: 'hora-extra' | 'abono') {
    setSolReturn(drawerMode);
    setDrawerMode(modo);
  }

  function openFromPendente(item: PontoDiaPendente) {
    if (outraSqhorasId) return; // somente-leitura ao ver outro colaborador
    setDrawerDia(item.dia);
    setDrawerMode(item.tipo);
  }

  function openFromCalendar(dia: PontoDia) {
    // Ao visualizar o ponto de outro colaborador o modo é somente-leitura:
    // não abrir registrar/apontar (o select usaria projetos do gestor logado e
    // o POST gravaria no usuário logado, não no alvo).
    if (outraSqhorasId) return;
    setDrawerDia(dia);
    if (dia.isFalta) {
      const st     = dia.statusLiberacaoFalta;
      const gestor = dia.liberacaoGestor;
      const solId  = dia.solicitacaoLiberacaoFaltaId;
      if (st === 'A' || gestor === 'S') {
        setDrawerMode(toMin(dia.horasRealizadas) === 0 ? 'apontar' : 'aguardar');
      } else if (st === 'P' || solId > 0) {
        setDrawerMode('aguardar');
      } else {
        setDrawerMode('solicitar');
      }
    } else {
      setDrawerMode('registrar');
    }
  }

  function openDiaSemApontamento(data: string) {
    // Navegar para o mês correto e abrir drawer
    const [, mm, yy] = data.split('/').map(Number);
    if (mm !== month || yy !== year) {
      setMonth(mm);
      setYear(yy);
    }
    // Encontra o dia nos dados carregados (ou cria um fake)
    const diaEncontrado = dias.find((d) => d.data === data);
    if (diaEncontrado) {
      openFromCalendar(diaEncontrado);
    } else {
      const [dd] = data.split('/');
      const fake: PontoDia = {
        data, diaSemana: '', fimDeSemana: false,
        horasRealizadas: '00:00', horasPrevistas: '08:00', horasAbono: '00:00',
        projeto: null, falta: false, horaExtra: '00:00', horasFalta: '00:00',
        isFalta: false, isAbono: false, isTravadoId: 0, solicitacaoTravadoId: 0,
        solicitacaoTravadoStatus: '', statusAbono: '', descricaoTipoAbono: '',
        idUnico: 0, confirmaFalta: false, dadosHoraExtra: null, faltaId: 0,
        solicitacaoLiberacaoFaltaId: 0, liberacaoGestor: '', statusLiberacaoFalta: '',
        permissaoLiberacao: false,
      };
      void dd;
      setDrawerDia(fake);
      setDrawerMode('registrar');
    }
  }

  function openNovoApontamento() {
    const hoje = new Date();
    const d    = String(hoje.getDate()).padStart(2, '0');
    const m    = String(hoje.getMonth() + 1).padStart(2, '0');
    const y    = hoje.getFullYear();
    const fake: PontoDia = {
      data:                        `${d}/${m}/${y}`,
      diaSemana:                   '',
      fimDeSemana:                 false,
      horasRealizadas:             '00:00',
      horasPrevistas:              '08:00',
      horasAbono:                  '00:00',
      projeto:                     null,
      falta:                       false,
      horaExtra:                   '00:00',
      horasFalta:                  '00:00',
      isFalta:                     false,
      isAbono:                     false,
      isTravadoId:                 0,
      solicitacaoTravadoId:        0,
      solicitacaoTravadoStatus:    '',
      statusAbono:                 '',
      descricaoTipoAbono:          '',
      idUnico:                     0,
      confirmaFalta:               false,
      dadosHoraExtra:              null,
      faltaId:                     0,
      solicitacaoLiberacaoFaltaId: 0,
      liberacaoGestor:             '',
      statusLiberacaoFalta:        '',
      permissaoLiberacao:          false,
    };
    setDrawerDia(fake);
    setDrawerMode('registrar');
  }

  function closeDrawer() {
    setDrawerDia(null);
    setDrawerMode(null);
  }

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  if (!hydrated) return <VerificandoCredenciais />;
  if (ehPercentual) return <AccessDenied description="Voce apropria horas por percentual. Use o menu Percentual para registrar suas horas." />;

  if (isError) {
    if (errorCode === 'sqhoras_not_found') {
      return (
        <div className="flex flex-col items-center justify-center gap-3 py-20 px-4 text-center">
          <span className="text-3xl">⏱</span>
          <p className="font-semibold text-foreground">Sem conta no SQHoras</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Este colaborador não possui uma conta ativa no SQHoras e não registra ponto por este sistema.
          </p>
        </div>
      );
    }
    return (
      <div className="p-4">
        <ErrorSection message="Não foi possível carregar os dados de ponto." onRetry={() => window.location.reload()} />
      </div>
    );
  }

  // Resumo
  const diasUteis = dias.filter((d) => !d.fimDeSemana && toMin(d.horasPrevistas) > 0);
  const carga     = sumHoras(diasUteis.map((d) => d.horasPrevistas));
  const realizado = sumHoras(diasUteis.map((d) => d.horasRealizadas));
  const saldo     = meses[0]?.saldo ?? null;
  const saldoNeg  = saldo ? saldo.startsWith('-') : false;

  const drawerDataIso = drawerDia
    ? (() => { const [d, m, y] = drawerDia.data.split('/'); return `${y}-${m}-${d}`; })()
    : '';
  // Edição/remoção de apontamentos: liberada em qualquer dia do mês ABERTO (o backend
  // só barra mês fechado). Em mês fechado ou ao ver outro colaborador, fica readonly.
  const drawerEditavel = !outraSqhorasId && !mesFechado;

  const drawerTitle = (() => {
    if (!drawerDia) return '';
    if (drawerMode === 'registrar' || drawerMode === 'apontar') return `Apontamento — ${drawerDia.data}`;
    if (drawerMode === 'hora-extra') return `Hora extra — ${drawerDia.data}`;
    if (drawerMode === 'abono')      return `Abono — ${drawerDia.data}`;
    if (drawerMode === 'solicitar') return `Solicitar liberação — ${drawerDia.data}`;
    return `Status — ${drawerDia.data}`;
  })();

  return (
    <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto pb-24">

      {/* Banner ver outro usuário */}
      {outraNome && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-card px-3 py-2 text-sm text-blue-700 dark:text-blue-300">
          Visualizando ponto de <strong>{outraNome}</strong>
        </div>
      )}

      {/* Navegação de mês */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={prevMonth} aria-label="Mês anterior">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-lg font-semibold">{MESES[month - 1]} {year}</h1>
        <Button variant="ghost" size="icon" onClick={nextMonth} aria-label="Próximo mês">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Resumo — Saldo | Carga | Realizado (espelha .ponto-resumo do vanilla) */}
      <div className="flex gap-3 bg-white rounded-xl shadow-sm px-4 py-3.5">
        {[
          { label: 'Saldo',     value: isLoading ? '—' : (saldo ?? '—'), red: saldoNeg },
          { label: 'Carga',     value: isLoading ? '—' : carga,     red: false },
          { label: 'Realizado', value: isLoading ? '—' : realizado, red: false },
        ].map(({ label, value, red }) => (
          <div key={label} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[0.72rem] text-gray-400 uppercase font-semibold tracking-wide">{label}</span>
            <span className={`text-[0.95rem] font-bold tabular-nums ${red ? 'text-red-500' : 'text-gray-900'}`}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Botão realizar apontamento — oculto ao ver ponto de outro ou em mês fechado */}
      {!outraSqhorasId && !mesFechado && (
        <button
          type="button"
          onClick={openNovoApontamento}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-[0.95rem] rounded-2xl py-3.5 shadow-[0_4px_20px_rgba(29,78,216,0.3)] hover:shadow-[0_6px_24px_rgba(29,78,216,0.45)] transition-all disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Realizar apontamento
        </button>
      )}

      {/* Dias pendentes — oculto ao ver outro (ações gravariam no usuário logado) ou em mês fechado */}
      {!isLoading && !outraSqhorasId && !mesFechado && (
        <PontosPendentes pendentes={pendentes} onItemClick={openFromPendente} />
      )}

      {/* Dias sem apontamento — apenas para o próprio usuário e mês ainda aberto */}
      {!outraSqhorasId && !mesFechado && diasSemApontamento.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
            Dias sem apontamento
          </h2>
          {diasSemApontamento.map((item) => {
            const clicavel = !item.possuiFalta || item.liberacaoGestor;
            const { bg, text, label } = item.possuiFalta
              ? item.liberacaoGestor
                ? { bg: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
                    text: 'text-green-700 dark:text-green-300', label: 'Liberado' }
                : { bg: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
                    text: 'text-red-700 dark:text-red-300', label: 'Falta aplicada' }
              : { bg: 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800',
                  text: 'text-yellow-700 dark:text-yellow-300', label: 'Sem apontamento' };

            return (
              <button
                key={item.data}
                type="button"
                disabled={!clicavel}
                onClick={() => clicavel && openDiaSemApontamento(item.data)}
                className={[
                  `flex items-center justify-between border rounded-card px-3 py-2 text-sm ${bg}`,
                  clicavel ? 'hover:opacity-80 transition-opacity' : 'cursor-default opacity-70',
                ].join(' ')}
              >
                <span className={`font-medium ${text}`}>{item.data}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${bg} ${text} border`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Faixa de mês fechado — período já computado, somente leitura */}
      {mesFechado && !outraSqhorasId && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-card px-3 py-2 text-sm text-amber-800 dark:text-amber-300 text-center font-medium">
          Mês fechado, nenhuma mudança autorizada.
        </div>
      )}

      {/* Calendário */}
      <PontoCalendar
        dias={dias}
        loading={isLoading}
        bloqueado={mesFechado}
        onDiaClick={mesFechado ? () => {} : openFromCalendar}
        onSolicitar={!outraSqhorasId && !mesFechado ? liberacao : undefined}
      />

      {/* Drawer */}
      <DrawerForm
        open={!!drawerDia && drawerMode !== null}
        onClose={closeDrawer}
        title={drawerTitle}
        side="right"
      >
        {drawerMode === 'registrar' || drawerMode === 'apontar' ? (
          <div className="flex flex-col">
            <ApontamentoForm
              data={drawerDataIso}
              projetos={projetos}
              isSubmitting={isRegistrando}
              cargaMin={drawerDia ? toMin(drawerDia.horasPrevistas) : 0}
              jaApontadoMin={drawerDia ? toMin(drawerDia.horasRealizadas) : 0}
              heAprovadaMin={drawerDia ? horaExtraAprovadaMin(drawerDia) : 0}
              onSubmit={async (input) => {
                await registrar(input);
                closeDrawer();
              }}
            />
            <ApontamentosRealizados dataISO={drawerDataIso} readOnly={!drawerEditavel} />

            {/* Atalhos para solicitação (reusam /solicitacoes) com o dia já preenchido. */}
            {drawerEditavel && (
              <div className="flex flex-col gap-2 border-t border-border pt-4 mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Solicitações</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => openSolicitacao('hora-extra')}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 text-sm font-medium py-2.5 hover:opacity-80 transition-opacity"
                  >
                    <Zap className="w-4 h-4" /> Hora extra
                  </button>
                  <button
                    type="button"
                    onClick={() => openSolicitacao('abono')}
                    className="flex items-center justify-center gap-1.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 text-sm font-medium py-2.5 hover:opacity-80 transition-opacity"
                  >
                    <FileText className="w-4 h-4" /> Abono
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : drawerMode === 'hora-extra' ? (
          <HoraExtraInlineForm dataISO={drawerDataIso} onDone={() => setDrawerMode(solReturn)} />
        ) : drawerMode === 'abono' ? (
          <AbonoInlineForm dataISO={drawerDataIso} onDone={() => setDrawerMode(solReturn)} />
        ) : drawerMode === 'solicitar' && drawerDia ? (
          <div className="flex flex-col gap-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Solicitação de liberação de falta para <strong>{drawerDia.data}</strong>.
              O gestor receberá a notificação e poderá aprovar ou recusar.
            </p>
            {liberacaoError && <FormFeedback type="error" message={liberacaoError} />}
            <Button
              onClick={async () => {
                if (!drawerDia.faltaId) return;
                await liberacao(drawerDia.faltaId, drawerDataIso);
                closeDrawer();
              }}
              disabled={isLiberando || !drawerDia.faltaId}
              className="w-full"
            >
              {isLiberando ? 'Solicitando…' : 'Solicitar liberação ao gestor'}
            </Button>
          </div>
        ) : drawerMode === 'aguardar' && drawerDia ? (
          <div className="flex flex-col gap-2 pt-2">
            <p className="text-sm">
              A solicitação de liberação para <strong>{drawerDia.data}</strong> está
              aguardando aprovação do gestor.
            </p>
            <p className="text-xs text-muted-foreground">
              Nenhuma ação necessária por enquanto.
            </p>
          </div>
        ) : null}
      </DrawerForm>
    </div>
  );
}

// Apontamentos já lançados do dia. Editável (exclusão individual) em qualquer dia do
// mês aberto; `readOnly` só exibe os períodos (mês fechado / ver outro colaborador).
function ApontamentosRealizados({ dataISO, readOnly = false }: { dataISO: string; readOnly?: boolean }) {
  const { apontamentos, isLoading, deletar, isDeletando, deletarError } = useApontamentosDia(dataISO, true);

  if (isLoading) {
    return <p className="text-xs text-muted-foreground border-t border-border pt-4 mt-2">Carregando apontamentos…</p>;
  }
  if (apontamentos.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 border-t border-border pt-4 mt-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Apontamentos realizados</p>
      {!readOnly && deletarError && <FormFeedback type="error" message={deletarError} />}
      {apontamentos.map((a) => (
        <div key={a.apontamentoID} className="flex items-center justify-between bg-card border border-border rounded-card px-3 py-2 gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium tabular-nums">{a.horaInicio} às {a.horaFim}</p>
            <p className="text-xs text-muted-foreground truncate">
              {a.nomeCliente ? `${a.nomeCliente} · ` : ''}{a.nomeProjeto}{a.nomeSubProjeto ? ` / ${a.nomeSubProjeto}` : ''}
            </p>
          </div>
          {!readOnly && (
            <button
              type="button"
              disabled={isDeletando}
              onClick={() => deletar({ id: a.apontamentoID, tipo: a.tipo, data: dataISO })}
              className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 disabled:opacity-40"
              aria-label="Excluir apontamento"
              title="Excluir"
            >
              {isDeletando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default function PontoPage() {
  return (
    <Suspense>
      <PontoPageContent />
    </Suspense>
  );
}
