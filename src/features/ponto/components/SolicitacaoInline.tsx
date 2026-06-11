'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormFeedback } from '@/components/shared/FormFeedback';
import { useSolicitacoes } from '@/features/solicitacoes/hooks/useSolicitacoes';
import { AbonoForm } from '@/features/solicitacoes/components/AbonoForm';

// Formatação amigável do dia (YYYY-MM-DD → DD/MM/YYYY) para o cabeçalho dos forms.
function fmtBR(iso: string): string {
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

// ── Hora Extra ──────────────────────────────────────────────────────────────
// Reusa o fluxo de /solicitacoes (rota POST /api/solicitacoes/hora-extra: máx 2h,
// tipo E/C calculado no servidor). A data vem travada no dia clicado no calendário.
export function HoraExtraInlineForm({ dataISO, onDone }: { dataISO: string; onDone: () => void }) {
  const { projetos, solicitarHoraExtra, isEnviandoHE, heError } = useSolicitacoes();
  const [projetoId, setProjetoId] = useState('');
  const [horas,     setHoras]     = useState('');
  const [motivo,    setMotivo]    = useState('');
  const [noturno,   setNoturno]   = useState(false);
  const [ok,        setOk]        = useState(false);

  const projetoIdSel = projetoId || (projetos.length === 1 ? String(projetos[0].id) : '');

  return (
    <form
      className="flex flex-col gap-4 pt-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const qtd = Number(horas);
        if (!projetoIdSel || !qtd) return;
        try {
          await solicitarHoraExtra({ projetoId: Number(projetoIdSel), data: dataISO, qtdadeHoras: qtd, motivo, isNoturno: noturno ? 'S' : 'N' });
        } catch {
          return; // erro exibido via heError
        }
        setOk(true);
        setHoras(''); setMotivo(''); setNoturno(false);
      }}
    >
      <p className="text-sm text-muted-foreground">
        Solicitação de hora extra para <strong>{fmtBR(dataISO)}</strong>. Máximo de 2h por solicitação.
      </p>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Projeto</label>
        <Select value={projetoIdSel} onValueChange={(v) => setProjetoId(v ?? '')}>
          <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
          <SelectContent>
            {projetos.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>{p.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Quantidade de horas</label>
        {/* step="any": permite digitar livremente (ex.: 1,5 = 1h30) sem travar em
            múltiplos de 30 min. Máx 2h (limite da API). */}
        <Input
          type="number"
          step="any"
          min="0.5"
          max="2"
          value={horas}
          onChange={(e) => { setHoras(e.target.value); setOk(false); }}
          placeholder="Ex.: 1,5 (1h30)"
          required
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Justificativa</label>
        <Input value={motivo} maxLength={300} onChange={(e) => { setMotivo(e.target.value); setOk(false); }} placeholder="Descreva a necessidade" required />
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={noturno} onChange={(e) => setNoturno(e.target.checked)} className="rounded" />
        Período noturno
      </label>

      {ok      && <FormFeedback type="ok"    message="Hora extra solicitada com sucesso!" />}
      {heError && <FormFeedback type="error" message={heError} />}

      <div className="flex gap-2">
        <Button type="submit" disabled={isEnviandoHE} className="flex-1">
          {isEnviandoHE ? 'Enviando…' : 'Solicitar'}
        </Button>
        <Button type="button" variant="outline" onClick={onDone}>Voltar</Button>
      </div>
    </form>
  );
}

// ── Abono ─────────────────────────────────────────────────────────────────────
// Reusa o AbonoForm completo (tipo, faixa de datas, parentesco, dia inteiro vs
// definir horas, anexo) — o mesmo de /solicitacoes — com o dia pré-preenchido.
export function AbonoInlineForm({ dataISO, onDone }: { dataISO: string; onDone: () => void }) {
  return <AbonoForm dataInicialISO={dataISO} onDone={onDone} />;
}
