'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormFeedback } from '@/components/shared/FormFeedback';
import type { ProjetoAlocado } from '@/services/squadra-client';
import type { NovoApontamentoClientInput } from '../hooks/usePonto';

interface ApontamentoFormProps {
  data:          string;
  projetos:      ProjetoAlocado[];
  onSubmit:      (input: NovoApontamentoClientInput) => Promise<void>;
  isSubmitting?: boolean;
}

export function ApontamentoForm({ data, projetos, onSubmit, isSubmitting }: ApontamentoFormProps) {
  const [projetoId,    setProjetoId]    = useState<string>('');
  const [subprojetoId, setSubprojetoId] = useState<string>('');
  const [horaInicio,   setHoraInicio]   = useState<string>('08:00');
  const [horaFinal,    setHoraFinal]    = useState<string>('17:00');
  const [justificativa,setJustificativa] = useState<string>('');
  const [error,        setError]         = useState<string | null>(null);
  const [ok,           setOk]            = useState(false);

  const projeto    = projetos.find((p) => String(p.id) === projetoId);
  const temSubProj = (projeto?.subProjetos.length ?? 0) > 0;

  // Base UI: SelectValue renderiza o `value` cru por padrão. Passando `items`
  // (mapa value→label) ao Root, ele exibe o NOME do projeto, não o ID.
  const projetoItems = projetos.map((p) => ({ value: String(p.id), label: p.nome }));
  const subprojetoItems = (projeto?.subProjetos ?? []).map((s) => ({ value: String(s.id), label: s.nome }));

  function validate(): string | null {
    if (!projetoId) return 'Selecione um projeto';
    if (temSubProj && !subprojetoId) return 'Selecione um subprojeto';
    // Data no futuro não pode ser apontada (en-CA = YYYY-MM-DD na hora local)
    const hojeIso = new Date().toLocaleDateString('en-CA');
    if (data && data > hojeIso) return 'Não é possível registrar apontamento em data futura';
    if (!horaInicio || !horaFinal) return 'Informe horário de início e fim';
    if (horaFinal <= horaInicio) return 'Horário fim deve ser após o início';
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
        horaInicio,
        horaFinal,
        projetoId:       Number(projetoId),
        subprojetoId:    subprojetoId ? Number(subprojetoId) : undefined,
        tipoApropriacao: 'JORNADA',
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

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Projeto</label>
        <Select
          items={projetoItems}
          value={projetoId}
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
          <Select items={subprojetoItems} value={subprojetoId} onValueChange={(v) => { setSubprojetoId(v ?? ''); setOk(false); }}>
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

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Início</label>
          <Input
            type="time"
            value={horaInicio}
            onChange={(e) => { setHoraInicio(e.target.value); setOk(false); }}
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Fim</label>
          <Input
            type="time"
            value={horaFinal}
            onChange={(e) => { setHoraFinal(e.target.value); setOk(false); }}
            required
          />
        </div>
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

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Registrando…' : 'Registrar apontamento'}
      </Button>
    </form>
  );
}
