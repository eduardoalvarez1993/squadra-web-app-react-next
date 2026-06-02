'use client';

import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { ASSETS } from '@/lib/assets';

interface FluenciaModalProps {
  open:    boolean;
  onClose: () => void;
}

const FLUENCIA_URL = 'https://fluencia.squadra.com.br';

export function FluenciaModal({ open, onClose }: FluenciaModalProps) {
  function handleIr() {
    window.open(FLUENCIA_URL, '_blank', 'noopener,noreferrer');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm p-0 overflow-hidden gap-0">
        <DialogTitle className="sr-only">FluencIA — plataforma de IA da Squadra</DialogTitle>

        {/* Topo branco com logo */}
        <div className="bg-white border-b border-border px-6 pt-8 pb-6 flex flex-col items-center gap-4">
          <Image
            src={ASSETS.fluenciaLogo}
            alt="FluencIA"
            width={160}
            height={48}
            className="h-10 w-auto object-contain drop-shadow-md"
            priority
          />
        </div>

        {/* Corpo */}
        <div className="flex flex-col items-center gap-5 px-6 pt-6 pb-7 text-center">
          <p className="text-base font-semibold text-foreground">
            Você será direcionado para o FluencIA
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            O ponto de encontro da nossa jornada com a Inteligência Artificial,
            um espaço vivo para reunir iniciativas, experiências e aprendizados
            sobre IA na Squadra, aberto a todos os Squaders.
          </p>

          {/* Botão gradiente */}
          <button
            onClick={handleIr}
            className="w-full rounded-xl py-3 px-6 font-semibold text-white text-sm
              bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-500
              hover:from-violet-700 hover:via-purple-600 hover:to-indigo-600
              active:scale-[0.98] transition-all duration-150 shadow-md shadow-purple-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
          >
            Ir Para FluencIA ✦
          </button>

          <button
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Agora não
          </button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
