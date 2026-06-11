'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormFeedback } from '@/components/shared/FormFeedback';
import { useSolicitacoes } from '@/features/solicitacoes/hooks/useSolicitacoes';

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
// Reusa o fluxo de /solicitacoes (rota POST /api/solicitacoes/abono). Versão
// simplificada (tipo, data, horas, justificativa) — sem grau de parentesco/anexo.
export function AbonoInlineForm({ dataISO, onDone }: { dataISO: string; onDone: () => void }) {
  const { tiposAbono, solicitarAbono, isSolicitando, abonoError } = useSolicitacoes();
  const [tipoId, setTipoId] = useState('');
  const [horas,  setHoras]  = useState('');
  const [just,   setJust]   = useState('');
  const [ok,     setOk]     = useState(false);

  // Filtra tipos que NÃO são day-off (espelha a aba Abono de /solicitacoes).
  const tiposFiltrados = tiposAbono.filter((t) => {
    const n = t.tipoAbono.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
    return !n.includes('DAY OFF') && !n.includes('FOLGA');
  });

  return (
    <form
      className="flex flex-col gap-4 pt-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!tipoId || !horas || !just) return;
        try {
          await solicitarAbono({ tipoAbonoId: Number(tipoId), data: dataISO, qtdadeHoras: Number(horas), justificativa: just });
        } catch {
          return; // erro exibido via abonoError
        }
        setOk(true);
        setTipoId(''); setHoras(''); setJust('');
      }}
    >
      <p className="text-sm text-muted-foreground">
        Solicitação de abono para <strong>{fmtBR(dataISO)}</strong>.
      </p>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Tipo</label>
        <Select value={tipoId} onValueChange={(v) => { setTipoId(v ?? ''); setOk(false); }}>
          <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
          <SelectContent>
            {tiposFiltrados.map((t) => (
              <SelectItem key={t.id} value={String(t.id)}>{t.tipoAbono}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Horas</label>
        <Input type="number" min="0.5" step="0.5" value={horas} onChange={(e) => { setHoras(e.target.value); setOk(false); }} required />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Justificativa</label>
        <Input value={just} onChange={(e) => { setJust(e.target.value); setOk(false); }} required />
      </div>

      {ok         && <FormFeedback type="ok"    message="Abono solicitado com sucesso!" />}
      {abonoError && <FormFeedback type="error" message={abonoError} />}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSolicitando} className="flex-1">
          {isSolicitando ? 'Enviando…' : 'Solicitar'}
        </Button>
        <Button type="button" variant="outline" onClick={onDone}>Voltar</Button>
      </div>
    </form>
  );
}
