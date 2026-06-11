'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormFeedback } from '@/components/shared/FormFeedback';
import type { ProjetoAlocado } from '@/services/squadra-client';
import { isPeriodoFechado } from '@/lib/periodo-fechado';
import { toMin, type NovoApontamentoClientInput, type Periodo } from '../hooks/usePonto';
import { tetoJornadaError, cargaZeroBloqueio } from '../apontamento-rules';

interface ApontamentoFormProps {
  data:          string;
  projetos:      ProjetoAlocado[];
  onSubmit:      (input: NovoApontamentoClientInput) => Promise<void>;
  isSubmitting?: boolean;
  // Contexto do dia p/ classificar automaticamente o excedente como HORA_EXTRA
  // (sem toggle): se o total do dia ultrapassar a carga e houver HE aprovada,
  // o apontamento vai como HORA_EXTRA, respeitando o teto aprovado.
  cargaMin?:      number;  // horas previstas do dia, em minutos
  jaApontadoMin?: number;  // horas já realizadas no dia, em minutos
  heAprovadaMin?: number;  // hora extra aprovada e ainda não registrada, em minutos
}

function fmtMin(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

type TipoApropriacao = NovoApontamentoClientInput['tipoApropriacao'];

export function ApontamentoForm({ data, projetos, onSubmit, isSubmitting, cargaMin = 0, jaApontadoMin = 0, heAprovadaMin = 0 }: ApontamentoFormProps) {
  const [projetoId,    setProjetoId]    = useState<string>('');
  const [subprojetoId, setSubprojetoId] = useState<string>('');
  const [periodos,     setPeriodos]     = useState<Periodo[]>([{ horaInicio: '', horaFinal: '' }]);
  const [justificativa,setJustificativa] = useState<string>('');
  const [error,        setError]         = useState<string | null>(null);
  const [ok,           setOk]            = useState(false);
  // Escolha explícita do usuário (toggle). `null` = ainda não tocou → segue o default automático.
  const [tipoManual,   setTipoManual]    = useState<TipoApropriacao | null>(null);

  function setPeriodo(i: number, campo: keyof Periodo, val: string) {
    setPeriodos((ps) => ps.map((p, idx) => idx === i ? { ...p, [campo]: val } : p));
    setOk(false);
  }
  function addPeriodo() { setPeriodos((ps) => [...ps, { horaInicio: '', horaFinal: '' }]); setOk(false); }
  function removePeriodo(i: number) { setPeriodos((ps) => ps.length > 1 ? ps.filter((_, idx) => idx !== i) : ps); setOk(false); }

  // Bloqueio de data/horário futuro (fuso BRT, igual ao backend).
  const hojeIso    = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  const horaAgora  = new Date().toLocaleTimeString('en-GB', { timeZone: 'America/Sao_Paulo', hour12: false }).slice(0, 5); // "HH:MM"
  const dataFutura = Boolean(data && data > hojeIso);
  const ehHoje     = data === hojeIso;
  // Mês fechado (12:00 BRT do dia 1º do mês seguinte): defesa — o drawer não deveria
  // abrir nesse caso, mas o submit fica bloqueado de qualquer forma.
  const bloqueado  = Boolean(data) && isPeriodoFechado(data);

  // Auto-seleção (derivada, sem effect): 1 projeto → já vem selecionado; idem subprojeto único.
  const projetoIdSel = projetoId || (projetos.length === 1 ? String(projetos[0].id) : '');
  const projeto      = projetos.find((p) => String(p.id) === projetoIdSel);
  const temSubProj   = (projeto?.subProjetos.length ?? 0) > 0;
  const subprojetoIdSel = subprojetoId || (projeto && projeto.subProjetos.length === 1 ? String(projeto.subProjetos[0].id) : '');

  // Base UI: SelectValue renderiza o `value` cru por padrão. Passando `items`
  // (mapa value→label) ao Root, ele exibe o NOME do projeto, não o ID.
  const projetoItems = projetos.map((p) => ({ value: String(p.id), label: p.nome }));
  const subprojetoItems = (projeto?.subProjetos ?? []).map((s) => ({ value: String(s.id), label: s.nome }));

  // Classificação JORNADA × HORA_EXTRA. O default é automático (o que ultrapassa a carga
  // do dia vira HORA_EXTRA), mas o usuário pode sobrepor pelo toggle quando ele aparece.
  const novoMin     = periodos.reduce((acc, p) => acc + Math.max(0, toMin(p.horaFinal) - toMin(p.horaInicio)), 0);
  const excedeMin    = Math.max(0, jaApontadoMin + novoMin - cargaMin);
  // Toggle só aparece quando o dia tem H.Extra LIBERADA (mesmo sinal do chip do calendário).
  // Sem HE aprovada não faz sentido marcar hora extra — o backend recusa o excedente de
  // qualquer forma. Default: HORA_EXTRA quando há HE aprovada e o dia excede a carga.
  const mostrarToggle = heAprovadaMin > 0;
  const tipoAuto: TipoApropriacao = (heAprovadaMin > 0 && excedeMin > 0) ? 'HORA_EXTRA' : 'JORNADA';
  const tipoApropriacao: TipoApropriacao = mostrarToggle ? (tipoManual ?? tipoAuto) : tipoAuto;

  // Bloqueios de negócio (avisam em tela e travam o submit):
  // 1) Dia de carga 0 sem HE aprovada → não há jornada a cumprir; só com HE aprovada.
  // 2) Teto de jornada: como JORNADA o total não pode passar da carga (só com carga > 0).
  const bloqueioMsg =
    cargaZeroBloqueio(cargaMin, heAprovadaMin) ??
    (cargaMin > 0
      ? tetoJornadaError({ tipoApropriacao, jaApontadoMin, novoMin, cargaMin, cargaLabel: fmtMin(cargaMin), temHEAprovada: heAprovadaMin > 0 })
      : null);

  function validate(): string | null {
    if (!projetoIdSel) return 'Selecione um projeto';
    if (temSubProj && !subprojetoIdSel) return 'Selecione um subprojeto';
    if (dataFutura) return 'Não é possível registrar apontamento em data futura';
    if (bloqueado)  return 'Período fechado — mês já computado.';
    if (periodos.length === 0) return 'Adicione pelo menos 1 período';
    for (const p of periodos) {
      if (!p.horaInicio || !p.horaFinal) return 'Informe início e fim de cada período';
      if (p.horaFinal <= p.horaInicio)   return 'Em cada período, o fim deve ser após o início';
      // Espelha o app-react: nenhum período pode exceder 6 horas (360 min).
      if (toMin(p.horaFinal) - toMin(p.horaInicio) > 360) return 'O período não pode exceder 6 horas';
      // No próprio dia, não dá para apontar horário que ainda não aconteceu.
      if (ehHoje && p.horaFinal > horaAgora) return `Não é possível registrar horário futuro — agora são ${horaAgora}.`;
    }
    // Sem sobreposição entre períodos
    const ord = [...periodos].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    for (let i = 1; i < ord.length; i++) {
      if (ord[i].horaInicio < ord[i - 1].horaFinal) return 'Os períodos não podem se sobrepor';
    }
    // Bloqueio de carga 0 / teto de jornada (excedente vira HORA_EXTRA).
    if (bloqueioMsg) return bloqueioMsg;
    // Teto da hora extra aprovada: ao marcar HORA EXTRA, o excedente da carga não pode
    // passar do aprovado (só checamos quando a aprovação foi detectada no payload do dia).
    if (tipoApropriacao === 'HORA_EXTRA' && heAprovadaMin > 0 && excedeMin > heAprovadaMin) {
      return `O excedente (${fmtMin(excedeMin)}) ultrapassa sua hora extra aprovada (${fmtMin(heAprovadaMin)}).`;
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setError(null);
    try {
      await onSubmit({
        data,
        periodos,
        projetoId:       Number(projetoIdSel),
        subprojetoId:    subprojetoIdSel ? Number(subprojetoIdSel) : undefined,
        tipoApropriacao,
        justificativa:   justificativa || undefined,
      });
      setOk(true);
      setTipoManual(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Data</label>
        <Input
          type="date"
          value={data}
          readOnly
          // travado no dia clicado / dia atual — picker apenas para visualização
          onKeyDown={(e) => e.preventDefault()}
          className="bg-muted cursor-default"
        />
      </div>

      {mostrarToggle && (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3">
          <p className="text-sm text-emerald-800 dark:text-emerald-300">
            <span aria-hidden>⚡</span> Você tem <strong>{fmtMin(heAprovadaMin)}</strong> de hora extra aprovada neste dia.
          </p>
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {(['JORNADA', 'HORA_EXTRA'] as const).map((t) => {
              const ativo = tipoApropriacao === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setTipoManual(t); setOk(false); }}
                  className={[
                    'rounded-md py-2 text-sm font-medium transition-colors',
                    ativo
                      ? t === 'HORA_EXTRA'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-blue-600 text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  ].join(' ')}
                >
                  {t === 'JORNADA' ? 'Jornada' : 'Hora Extra'}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Projeto</label>
        <Select
          items={projetoItems}
          value={projetoIdSel}
          onValueChange={(v) => { setProjetoId(v ?? ''); setSubprojetoId(''); setOk(false); }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione…" />
          </SelectTrigger>
          <SelectContent>
            {projetos.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {temSubProj && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Subprojeto</label>
          <Select items={subprojetoItems} value={subprojetoIdSel} onValueChange={(v) => { setSubprojetoId(v ?? ''); setOk(false); }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione…" />
            </SelectTrigger>
            <SelectContent>
              {(projeto?.subProjetos ?? []).map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {periodos.map((p, i) => (
          <div key={i} className="flex items-end gap-2">
            <div className="flex flex-col gap-1 flex-1">
              {i === 0 && <label className="text-sm font-medium">Início</label>}
              <Input type="time" max={ehHoje ? horaAgora : undefined} value={p.horaInicio} onChange={(e) => setPeriodo(i, 'horaInicio', e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              {i === 0 && <label className="text-sm font-medium">Fim</label>}
              <Input type="time" max={ehHoje ? horaAgora : undefined} value={p.horaFinal} onChange={(e) => setPeriodo(i, 'horaFinal', e.target.value)} required />
            </div>
            <button
              type="button"
              onClick={() => removePeriodo(i)}
              disabled={periodos.length === 1}
              className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Remover período"
              title="Remover período"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addPeriodo} className="self-start flex gap-1.5">
          <Plus className="w-4 h-4" /> Adicionar novo período
        </Button>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-muted-foreground">Justificativa (opcional)</label>
        <Input
          value={justificativa}
          onChange={(e) => { setJustificativa(e.target.value); setOk(false); }}
          placeholder="Ex: trabalho remoto"
        />
      </div>

      {/* Aviso ao vivo de bloqueio (carga 0 / teto de jornada), âmbar, antes do submit. */}
      {bloqueioMsg && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
          <span aria-hidden>⚠️</span>
          <span>{bloqueioMsg}</span>
        </div>
      )}

      {ok    && <FormFeedback type="ok"    message="Apontamento registrado com sucesso!" />}
      {error && <FormFeedback type="error" message={error} />}
      {dataFutura && <FormFeedback type="error" message="Não é possível registrar apontamento em data futura." />}
      {bloqueado && <FormFeedback type="error" message="Período fechado — mês já computado." />}

      <Button type="submit" disabled={isSubmitting || dataFutura || bloqueado || !!bloqueioMsg} className="w-full">
        {isSubmitting ? 'Registrando…' : 'Registrar apontamento'}
      </Button>
    </form>
  );
}
