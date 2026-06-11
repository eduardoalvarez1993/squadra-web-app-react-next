'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormFeedback } from '@/components/shared/FormFeedback';
import { useSolicitacoes } from '@/features/solicitacoes/hooks/useSolicitacoes';
import {
  GRAUS_PARENTESCO, type GrauParentesco,
  tipoExibeParentesco, tipoExibeDefinirHoras,
  defaultsForTipo, defaultsForParentesco, horasDiaInteiro, horasFromRange,
} from '@/features/solicitacoes/abono-rules';

const EXT_OK = ['png', 'jpg', 'jpeg', 'pdf'];

function todayISO(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

// Formulário de Abono completo, compartilhado entre /solicitacoes e o drawer do ponto.
// Espelha o app-react: faixa de datas, grau de parentesco (luto), "dia inteiro vs
// definir horas" e anexo. A quantidade de horas é DERIVADA das regras (abono-rules).
export function AbonoForm({ dataInicialISO, onDone }: { dataInicialISO?: string; onDone?: () => void }) {
  const { tiposAbono, solicitarAbono, isSolicitando, abonoError } = useSolicitacoes();

  const [tipoId,      setTipoId]      = useState('');
  const [dataInicio,  setDataInicio]  = useState(dataInicialISO || todayISO());
  const [dataFim,     setDataFim]     = useState(dataInicialISO || todayISO());
  const [grau,        setGrau]        = useState<GrauParentesco | ''>('');
  const [modo,        setModo]        = useState<'dia' | 'horas'>('dia');
  const [horaInicio,  setHoraInicio]  = useState('');
  const [horaFim,     setHoraFim]     = useState('');
  const [motivo,      setMotivo]      = useState('');
  const [anexo,       setAnexo]       = useState<string | null>(null);
  const [nomeAnexo,   setNomeAnexo]   = useState<string | null>(null);
  const [erro,        setErro]        = useState<string | null>(null);
  const [ok,          setOk]          = useState(false);

  const tipo = Number(tipoId) || 0;
  const exibeParentesco   = tipoExibeParentesco(tipo);
  const exibeDefinirHoras = tipoExibeDefinirHoras(tipo);
  const exibeDataFim      = tipo > 0 && !(exibeDefinirHoras && modo === 'horas');

  // Tipos day-off têm aba própria; abono não os lista.
  const tiposFiltrados = tiposAbono.filter((t) => {
    const n = t.tipoAbono.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
    return !n.includes('DAY OFF') && !n.includes('FOLGA');
  });

  // Quantidade de horas DERIVADA do estado atual (sem effect).
  function computeQtd(): { qtd: number; rangeError: string | null } {
    if (exibeDefinirHoras && modo === 'horas') {
      const r = horasFromRange(horaInicio, horaFim);
      return { qtd: r.horas, rangeError: r.error };
    }
    if (exibeDefinirHoras && modo === 'dia') return { qtd: horasDiaInteiro(dataInicio, dataFim), rangeError: null };
    if (exibeParentesco) return { qtd: grau ? defaultsForParentesco(grau, dataInicio).qtdadeHoras : 0, rangeError: null };
    return { qtd: defaultsForTipo(tipo, dataInicio).qtdadeHoras, rangeError: null };
  }
  const { qtd, rangeError } = computeQtd();

  function onTipoChange(v: string) {
    setOk(false); setErro(null);
    const t = Number(v) || 0;
    setTipoId(v);
    setGrau(''); setModo('dia'); setHoraInicio(''); setHoraFim('');
    setDataFim(defaultsForTipo(t, dataInicio).dataFim);
  }

  function onParentescoChange(v: string) {
    setOk(false); setErro(null);
    setGrau(v as GrauParentesco);
    setDataFim(defaultsForParentesco(v as GrauParentesco, dataInicio).dataFim);
  }

  function onDataInicioChange(v: string) {
    setOk(false);
    setDataInicio(v);
    // Recalcula a data fim pela regra vigente (tipo/grau).
    if (exibeParentesco && grau) setDataFim(defaultsForParentesco(grau, v).dataFim);
    else if (tipo > 0)          setDataFim(defaultsForTipo(tipo, v).dataFim);
    else                        setDataFim(v);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
    if (!EXT_OK.includes(ext)) { setErro('Formato não suportado. Use PNG, JPG ou PDF.'); return; }
    setErro(null);
    const reader = new FileReader();
    reader.onload = () => {
      const res = String(reader.result);
      setAnexo(res.includes(',') ? res.split(',')[1] : res);
      setNomeAnexo(f.name);
    };
    reader.readAsDataURL(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tipoId)  { setErro('Selecione o tipo de abono.'); return; }
    if (!dataInicio) { setErro('Informe a data de início.'); return; }
    if (exibeParentesco && !grau) { setErro('Selecione o grau de parentesco.'); return; }
    if (exibeDefinirHoras && modo === 'horas' && rangeError) { setErro(rangeError); return; }
    if (qtd <= 0) { setErro('Quantidade de horas inválida.'); return; }
    if (!motivo.trim()) { setErro('Informe o motivo.'); return; }

    setErro(null);
    try {
      await solicitarAbono({
        tipoAbonoId:   tipo,
        dataInicio,
        dataFim:       exibeDataFim ? dataFim : dataInicio,
        qtdadeHoras:   qtd,
        justificativa: motivo.trim(),
        ...(anexo ? { anexo, nomeAnexo: nomeAnexo ?? 'anexo' } : {}),
      });
    } catch {
      return; // erro do upstream exibido via abonoError
    }
    setOk(true);
    setTipoId(''); setGrau(''); setModo('dia'); setHoraInicio(''); setHoraFim('');
    setMotivo(''); setAnexo(null); setNomeAnexo(null);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
      {dataInicialISO && (
        <p className="text-sm text-muted-foreground">
          Abono a partir de <strong>{dataInicialISO.split('-').reverse().join('/')}</strong>.
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Tipo</label>
        <Select value={tipoId} onValueChange={(v) => onTipoChange(v ?? '')}>
          <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
          <SelectContent>
            {tiposFiltrados.map((t) => (
              <SelectItem key={t.id} value={String(t.id)}>{t.tipoAbono}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {exibeParentesco && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Grau de parentesco</label>
          <Select value={grau} onValueChange={(v) => onParentescoChange(v ?? '')}>
            <SelectTrigger><SelectValue placeholder="Selecione…" /></SelectTrigger>
            <SelectContent>
              {GRAUS_PARENTESCO.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Data início</label>
          <Input type="date" value={dataInicio} onChange={(e) => onDataInicioChange(e.target.value)} required />
        </div>
        {exibeDataFim && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Data fim</label>
            <Input type="date" min={dataInicio} value={dataFim} onChange={(e) => { setDataFim(e.target.value); setOk(false); }} required />
          </div>
        )}
      </div>

      {exibeDefinirHoras && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {(['dia', 'horas'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setModo(m); setOk(false); }}
                className={[
                  'rounded-md py-2 text-sm font-medium transition-colors',
                  modo === m ? 'bg-blue-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                {m === 'dia' ? 'Dia inteiro' : 'Definir horas'}
              </button>
            ))}
          </div>
          {modo === 'horas' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Início</label>
                <Input type="time" value={horaInicio} onChange={(e) => { setHoraInicio(e.target.value); setOk(false); }} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Fim</label>
                <Input type="time" value={horaFim} onChange={(e) => { setHoraFim(e.target.value); setOk(false); }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resumo da quantidade calculada */}
      {tipo > 0 && qtd > 0 && (
        <p className="text-xs text-muted-foreground">
          Total: <strong>{qtd}h</strong>{!exibeDefinirHoras || modo === 'dia' ? ` (${Math.max(1, Math.round(qtd / 8))} dia(s))` : ''}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Motivo</label>
        <Input value={motivo} maxLength={300} onChange={(e) => { setMotivo(e.target.value); setOk(false); }} placeholder="Descreva o motivo" required />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-muted-foreground">Anexo (opcional — PNG, JPG ou PDF)</label>
        <input type="file" accept=".png,.jpg,.jpeg,.pdf" onChange={onFile} className="text-sm" />
        {nomeAnexo && (
          <span className="text-xs text-muted-foreground flex items-center gap-2">
            {nomeAnexo}
            <button type="button" onClick={() => { setAnexo(null); setNomeAnexo(null); }} className="text-destructive">remover</button>
          </span>
        )}
      </div>

      {ok        && <FormFeedback type="ok"    message="Abono solicitado com sucesso!" />}
      {erro      && <FormFeedback type="error" message={erro} />}
      {abonoError && <FormFeedback type="error" message={abonoError} />}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSolicitando} className="flex-1">
          {isSolicitando ? 'Enviando…' : 'Solicitar'}
        </Button>
        {onDone && <Button type="button" variant="outline" onClick={onDone}>Voltar</Button>}
      </div>
    </form>
  );
}
