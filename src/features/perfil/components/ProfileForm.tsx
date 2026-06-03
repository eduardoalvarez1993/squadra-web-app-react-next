'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Camera, CornerDownLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormFeedback } from '@/components/shared/FormFeedback';
import { AvatarGradient } from '@/components/shared/AvatarGradient';
import type { PerfilData } from '@/services/squadra-client';

interface ProfileFormProps {
  perfil:        PerfilData;
  onAtualizar:   (data: Record<string, unknown>) => Promise<void>;
  isAtualizando: boolean;
}

function parseInteresses(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return (raw as unknown[])
    .map((s) => String(s).replace(/\{\*\}/g, '').trim())
    .filter(Boolean);
}

// Extrai a região cropada e redimensiona para maxPx × maxPx
function applyCrop(img: HTMLImageElement, crop: PixelCrop, maxPx = 400): string {
  const scaleX = img.naturalWidth  / img.width;
  const scaleY = img.naturalHeight / img.height;
  const size   = Math.min(maxPx, Math.round(crop.width * scaleX));
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  canvas.getContext('2d')!.drawImage(
    img,
    crop.x * scaleX, crop.y * scaleY,
    crop.width * scaleX, crop.height * scaleY,
    0, 0, size, size,
  );
  return canvas.toDataURL('image/jpeg', 0.85);
}

function initCrop(w: number, h: number): Crop {
  return centerCrop(makeAspectCrop({ unit: '%', width: 90 }, 1, w, h), w, h);
}

// ── CropModal ─────────────────────────────────────────────────────────────────

function CropModal({ src, onConfirm, onCancel }: {
  src:       string;
  onConfirm: (dataUrl: string) => void;
  onCancel:  () => void;
}) {
  const imgRef                       = useRef<HTMLImageElement>(null);
  const [crop, setCrop]              = useState<Crop>();
  const [completed, setCompleted]    = useState<PixelCrop>();

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(initCrop(width, height));
  }

  function confirm() {
    if (!imgRef.current || !completed) return;
    onConfirm(applyCrop(imgRef.current, completed));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl flex flex-col gap-4 p-4 w-full max-w-sm shadow-xl">
        <p className="text-sm font-semibold">Ajustar foto (1:1)</p>

        <div className="flex justify-center overflow-hidden rounded-lg bg-black/10">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompleted(c)}
            aspect={1}
            circularCrop
            minWidth={40}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={src}
              alt="Crop"
              onLoad={onImageLoad}
              style={{ maxHeight: '60vh', maxWidth: '100%', display: 'block' }}
            />
          </ReactCrop>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="button" className="flex-1" onClick={confirm} disabled={!completed}>
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── FotoUpload ────────────────────────────────────────────────────────────────

function FotoUpload({
  nome, foto, onFoto, disabled,
}: {
  nome:     string;
  foto:     string;
  onFoto:   (dataUrl: string) => void;
  disabled: boolean;
}) {
  const fileRef              = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setCropSrc(URL.createObjectURL(file));
  }

  function handleConfirm(dataUrl: string) {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    onFoto(dataUrl);
  }

  function handleCancel() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Foto de perfil</span>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => !disabled && fileRef.current?.click()}
            className="relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
            aria-label="Alterar foto de perfil"
            disabled={disabled}
          >
            <AvatarGradient nome={nome || ''} foto={foto || null} size={72} />
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity pointer-events-none">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </button>

          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <span>Clique no avatar para trocar</span>
            <span>JPG, PNG ou WebP</span>
            {foto && (
              <button
                type="button"
                onClick={() => onFoto('')}
                disabled={disabled}
                className="flex items-center gap-1 text-destructive hover:underline disabled:opacity-50 w-fit"
              >
                <X className="w-3 h-3" /> Remover foto
              </button>
            )}
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFile}
          className="hidden"
          aria-hidden="true"
        />
      </div>

      {cropSrc && (
        <CropModal src={cropSrc} onConfirm={handleConfirm} onCancel={handleCancel} />
      )}
    </>
  );
}

// ── ProfileForm ───────────────────────────────────────────────────────────────

type InteresseStatus = 'idle' | 'saving' | 'ok' | 'error';

export function ProfileForm({ perfil, onAtualizar, isAtualizando }: ProfileFormProps) {
  const [nomeSocial, setNomeSocial] = useState('');
  const [celular,    setCelular]    = useState('');
  const [foto,       setFoto]       = useState('');
  const [interesses, setInteresses] = useState<string[]>([]);
  const [addInput,   setAddInput]   = useState('');
  const [iStatus,    setIStatus]    = useState<InteresseStatus>('idle');
  const [feedback,   setFeedback]   = useState<'ok' | 'error' | null>(null);
  const [errMsg,     setErrMsg]     = useState('');
  const addInputRef    = useRef<HTMLInputElement>(null);
  const onAtualizarRef = useRef(onAtualizar);
  useEffect(() => { onAtualizarRef.current = onAtualizar; });

  useEffect(() => {
    setNomeSocial(String(perfil.nomeSocial ?? ''));
    setCelular(String(perfil.celular ?? ''));
    setFoto(String(perfil.foto ?? ''));
    setInteresses(parseInteresses(perfil.listaInteresses));
  }, [perfil.nomeSocial, perfil.celular, perfil.foto, perfil.listaInteresses]);

  const saveInteresses = useCallback(async (list: string[]) => {
    setIStatus('saving');
    try {
      await onAtualizarRef.current({ listaInteresses: list });
      setIStatus('ok');
      setTimeout(() => setIStatus('idle'), 2000);
    } catch {
      setIStatus('error');
    }
  }, []);

  function addInteresse() {
    const n = addInput.trim();
    if (!n || interesses.some((x) => x.toLowerCase() === n.toLowerCase())) {
      setAddInput('');
      return;
    }
    const next = [...interesses, n];
    setInteresses(next);
    setAddInput('');
    saveInteresses(next);
    setTimeout(() => addInputRef.current?.focus(), 0);
  }

  function removeInteresse(i: number) {
    const next = interesses.filter((_, idx) => idx !== i);
    setInteresses(next);
    saveInteresses(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    try {
      await onAtualizar({ nomeSocial, celular, foto, listaInteresses: interesses });
      setFeedback('ok');
    } catch (err) {
      setErrMsg((err as Error).message);
      setFeedback('error');
    }
  }

  const iStatusEl = {
    saving: <span className="text-xs text-amber-600">Salvando…</span>,
    ok:     <span className="text-xs text-green-600">✓ Salvo</span>,
    error:  <span className="text-xs text-destructive">Erro ao salvar</span>,
    idle:   null,
  }[iStatus];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-4">

      <FotoUpload
        nome={nomeSocial || String(perfil.nome ?? '')}
        foto={foto}
        onFoto={(v) => { setFoto(v); setFeedback(null); }}
        disabled={isAtualizando}
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="nomeSocial" className="text-sm font-medium">Nome social</label>
        <Input
          id="nomeSocial"
          value={nomeSocial}
          onChange={(e) => { setNomeSocial(e.target.value); setFeedback(null); }}
          disabled={isAtualizando}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="celular" className="text-sm font-medium">Celular</label>
        <Input
          id="celular"
          type="tel"
          value={celular}
          onChange={(e) => { setCelular(e.target.value); setFeedback(null); }}
          disabled={isAtualizando}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Interesses</span>
          {iStatusEl}
        </div>

        {interesses.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {interesses.map((nome, i) => (
              <div
                key={`${nome}-${i}`}
                className="flex items-center gap-1.5 bg-[#f5f7fa] border border-border rounded-full pl-3 pr-2 py-1.5"
              >
                <span className="text-xs font-medium text-foreground">{nome}</span>
                <button
                  type="button"
                  onClick={() => removeInteresse(i)}
                  className="text-muted-foreground hover:text-destructive transition-colors text-sm leading-none ml-0.5"
                  aria-label={`Remover ${nome}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="relative">
          <input
            ref={addInputRef}
            value={addInput}
            onChange={(e) => setAddInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addInteresse(); } }}
            placeholder="Digite e pressione Enter para adicionar…"
            disabled={isAtualizando}
            className="w-full border border-border rounded-lg px-3 py-1.5 pr-9 text-sm bg-background outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          />
          <button
            type="button"
            onClick={addInteresse}
            disabled={!addInput.trim() || isAtualizando}
            aria-label="Adicionar interesse"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors disabled:opacity-30"
          >
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <FormFeedback
        type={feedback}
        message={feedback === 'ok' ? 'Perfil atualizado!' : errMsg}
      />

      <Button type="submit" disabled={isAtualizando}>
        {isAtualizando ? 'Salvando…' : 'Salvar'}
      </Button>
    </form>
  );
}
