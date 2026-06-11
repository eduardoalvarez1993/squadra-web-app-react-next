'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormFeedback } from '@/components/shared/FormFeedback';
import type { ProjetoAlocado } from '@/services/squadra-client';
import { toMin, type NovoApontamentoClientInput, type Periodo } from '../hooks/usePonto';

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

export function ApontamentoForm({ data, projetos, onSubmit, isSubmitting, cargaMin = 0, jaApontadoMin = 0, heAprovadaMin = 0 }: ApontamentoFormProps) {
  const [projetoId,    setProjetoId]    = useState<string>('');
  const [subprojetoId, setSubprojetoId] = useState<string>('');
  const [periodos,     setPeriodos]     = useState<Periodo[]>([{ horaInicio: '08:00', horaFinal: '17:00' }]);
  const [justificativa,setJustificativa] = useState<string>('');
  const [error,        setError]         = useState<string | null>(null);
  const [ok,           setOk]            = useState(false);

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

  // Auto-seleção (derivada, sem effect): 1 projeto → já vem selecionado; idem subprojeto único.
  const projetoIdSel = projetoId || (projetos.length === 1 ? String(projetos[0].id) : '');
  const projeto      = projetos.find((p) => String(p.id) === projetoIdSel);
  const temSubProj   = (projeto?.subProjetos.length ?? 0) > 0;
  const subprojetoIdSel = subprojetoId || (projeto && projeto.subProjetos.length === 1 ? String(projeto.subProjetos[0].id) : '');

  // Base UI: SelectValue renderiza o `value` cru por padrão. Passando `items`
  // (mapa value→label) ao Root, ele exibe o NOME do projeto, não o ID.
  const projetoItems = projetos.map((p) => ({ value: String(p.id), label: p.nome }));
  const subprojetoItems = (projeto?.subProjetos ?? []).map((s) => ({ value: String(s.id), label: s.nome }));

  // Classificação automática JORNADA × HORA_EXTRA (sem toggle): o que ultrapassar a
  // carga do dia vira HORA_EXTRA quando há hora extra aprovada, limitado ao teto.
  const novoMin     = periodos.reduce((acc, p) => acc + Math.max(0, toMin(p.horaFinal) - toMin(p.horaInicio)), 0);
  const excedeMin    = Math.max(0, jaApontadoMin + novoMin - cargaMin);
  const ehHoraExtra  = excedeMin > 0 && heAprovadaMin > 0;
  const tipoApropriacao: NovoApontamentoClientInput['tipoApropriacao'] = ehHoraExtra ? 'HORA_EXTRA' : 'JORNADA';

  function validate(): string | null {
    if (!projetoIdSel) return 'Selecione um projeto';
    if (temSubProj && !subprojetoIdSel) return 'Selecione um subprojeto';
    if (dataFutura) return 'Não é possível registrar apontamento em data futura';
    if (periodos.length === 0) return 'Adicione pelo menos 1 período';
    for (const p of periodos) {
      if (!p.horaInicio || !p.horaFinal) return 'Informe início e fim de cada período';
      if (p.horaFinal <= p.horaInicio)   return 'Em cada período, o fim deve ser após o início';
      // No próprio dia, não dá para apontar horário que ainda não aconteceu.
      if (ehHoje && p.horaFinal > horaAgora) return `Não é possível registrar horário futuro — agora são ${horaAgora}.`;
    }
    // Sem sobreposição entre períodos
    const ord = [...periodos].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    for (let i = 1; i < ord.length; i++) {
      if (ord[i].horaInicio < ord[i - 1].horaFinal) return 'Os períodos não podem se sobrepor';
    }
    // Teto da hora extra aprovada: o excedente da carga não pode passar do aprovado.
    if (excedeMin > 0 && heAprovadaMin > 0 && excedeMin > heAprovadaMin) {
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

      {heAprovadaMin > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
          <span aria-hidden>⚡</span>
          <span>
            Você tem <strong>{fmtMin(heAprovadaMin)}</strong> de hora extra aprovada. O que exceder a
            carga do dia será registrado como hora extra.
          </span>
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

      {ok    && <FormFeedback type="ok"    message="Apontamento registrado com sucesso!" />}
      {error && <FormFeedback type="error" message={error} />}
      {dataFutura && <FormFeedback type="error" message="Não é possível registrar apontamento em data futura." />}

      <Button type="submit" disabled={isSubmitting || dataFutura} className="w-full">
        {isSubmitting ? 'Registrando…' : 'Registrar apontamento'}
      </Button>
    </form>
  );
}
