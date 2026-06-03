import Link from 'next/link';
import { LinkIcon, PlayCircleIcon, HelpCircleIcon, ChevronRightIcon } from 'lucide-react';

const CARDS = [
  {
    href:      '/recursos/links',
    icon:      <LinkIcon className="h-6 w-6 text-cyan-500" />,
    titulo:    'Links Importantes',
    descricao: 'Sistemas internos, materiais de apoio e redes sociais da Squadra.',
  },
  {
    href:      '/recursos/videos',
    icon:      <PlayCircleIcon className="h-6 w-6 text-pink-500" />,
    titulo:    'Vídeos',
    descricao: 'Conteúdos e tutoriais institucionais da Squadra.',
  },
  {
    href:      '/recursos/ajuda',
    icon:      <HelpCircleIcon className="h-6 w-6 text-violet-500" />,
    titulo:    'Ajuda',
    descricao: 'Dúvidas frequentes, suporte interno e contato com os departamentos.',
  },
];

export default function RecursosPage() {
  return (
    <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto pb-24">
      <h1 className="text-xl font-semibold">Extras</h1>

      <div className="flex flex-col gap-3">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="flex items-center gap-4 bg-white border border-border rounded-xl px-5 py-4 hover:bg-accent/40 transition-colors group"
          >
            <div className="flex-shrink-0">{card.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">{card.titulo}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{card.descricao}</p>
            </div>
            <ChevronRightIcon className="h-4 w-4 text-muted-foreground flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        ))}
      </div>
    </div>
  );
}
