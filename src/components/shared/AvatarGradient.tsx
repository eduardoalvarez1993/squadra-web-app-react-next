'use client';

import { useState } from 'react';

const GRADIENTS = [
  'from-pink-400 to-blue-400',
  'from-purple-400 to-pink-400',
  'from-blue-400 to-cyan-400',
  'from-amber-400 to-orange-400',
  'from-green-400 to-teal-400',
  'from-rose-400 to-purple-400',
  'from-indigo-400 to-blue-400',
  'from-teal-400 to-green-400',
];

function avatarGradient(nome: string): string {
  const code = nome.charCodeAt(0) || 0;
  return GRADIENTS[code % GRADIENTS.length];
}

function initials(nome: string): string {
  const trimmed = nome.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface AvatarGradientProps {
  nome: string;
  foto?: string | null;
  size?: number;
  className?: string;
}

function toSrc(foto: string): string {
  if (foto.startsWith('data:') || foto.startsWith('http')) return foto;
  return `data:image/jpeg;base64,${foto}`;
}

export function AvatarGradient({ nome, foto = null, size = 40, className }: AvatarGradientProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const outerStyle = {
    width:    size,
    height:   size,
    minWidth: size,
    minHeight: size,
    padding:  Math.max(1.5, size * 0.06),
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #f02fc2, #7c3aed, #6094ea)',
    display: 'inline-flex',
    boxSizing: 'border-box' as const,
    flexShrink: 0,
  };

  if (foto && !imgFailed) {
    return (
      <div style={outerStyle} className={className}>
        {/* img nativo — suporta base64 e URLs externas sem config de domínio */}
        <img
          src={toSrc(foto)}
          alt={nome}
          width={size}
          height={size}
          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br text-white font-semibold select-none ${avatarGradient(nome)}${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size, fontSize: Math.round(size * 0.36) }}
      aria-label={nome}
    >
      {initials(nome)}
    </div>
  );
}
