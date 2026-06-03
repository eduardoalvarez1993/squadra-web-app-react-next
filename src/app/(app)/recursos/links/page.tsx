'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  SearchIcon, ExternalLinkIcon, CopyIcon, CheckIcon, ArrowLeftIcon,
  MonitorIcon, FolderOpenIcon, GlobeIcon, ShieldIcon,
  LayersIcon, ClockIcon, Building2Icon, GitBranchIcon, HeadphonesIcon,
  FileTextIcon, ImageIcon, BookOpenIcon, RssIcon,
  PlayCircleIcon, CameraIcon, NetworkIcon, ShieldCheckIcon,
  type LucideIcon,
} from 'lucide-react';
import linksData from '@/data/links.json';

type LinkItem = { texto: string; link: string | null; icone: string };
type GrupoItem = { grupo: string; icone: string; items: LinkItem[] };

const ICON_MAP: Record<string, LucideIcon> = {
  Monitor:      MonitorIcon,
  FolderOpen:   FolderOpenIcon,
  Globe:        GlobeIcon,
  Shield:       ShieldIcon,
  Layers:       LayersIcon,
  Clock:        ClockIcon,
  Building2:    Building2Icon,
  GitBranch:    GitBranchIcon,
  Headphones:   HeadphonesIcon,
  FileText:     FileTextIcon,
  Image:        ImageIcon,
  BookOpen:     BookOpenIcon,
  Rss:          RssIcon,
  Linkedin:     NetworkIcon,
  Youtube:      PlayCircleIcon,
  Instagram:    CameraIcon,
  ShieldCheck:  ShieldCheckIcon,
};

function LucideIconComp({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? GlobeIcon;
  return <Icon className={className} />;
}

function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
      aria-label="Copiar URL"
      title="Copiar URL"
    >
      {copied
        ? <CheckIcon className="h-3.5 w-3.5 text-green-500" />
        : <CopyIcon  className="h-3.5 w-3.5" />
      }
    </button>
  );
}

export default function LinksPage() {
  const [busca, setBusca] = useState('');
  const q = busca.toLowerCase().trim();

  const grupos = (linksData as GrupoItem[])
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => !q || i.texto.toLowerCase().includes(q)),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto pb-24">
      <div className="flex items-center gap-2">
        <Link href="/recursos" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors" aria-label="Voltar">
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-semibold">Links Importantes</h1>
      </div>

      {/* Busca */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          type="search"
          placeholder="Buscar link..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
        />
      </div>

      {grupos.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhum link encontrado.</p>
      )}

      {/* Grupos */}
      {grupos.map((grupo) => (
        <div key={grupo.grupo} className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
            <LucideIconComp name={grupo.icone} className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {grupo.grupo}
            </span>
          </div>

          <ul className="divide-y divide-border">
            {grupo.items.map((item) => (
              <li key={item.texto}>
                {item.link ? (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 px-4 py-3 hover:bg-accent/40 transition-colors"
                  >
                    <LucideIconComp name={item.icone} className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1 text-sm text-foreground">{item.texto}</span>
                    <CopyButton url={item.link} />
                    <ExternalLinkIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  </a>
                ) : (
                  <div className="flex items-center gap-3 px-4 py-3 opacity-40 cursor-not-allowed">
                    <LucideIconComp name={item.icone} className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1 text-sm text-foreground">{item.texto}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
