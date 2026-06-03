'use client';

import { MailIcon } from 'lucide-react';

export type ItemAjuda = {
  problema:     string;
  categoria:    string;
  subcategoria: string;
  tipo:         string;
  resposta:     string;
  email:        string;
  departamento: string;
};

function renderMarkdown(text: string): React.ReactNode {
  // Converte links markdown [texto](url) e preserva quebras de linha
  const parts = text.split(/(\[.*?\]\(.*?\))/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (match) {
      return (
        <a
          key={i}
          href={match[2]}
          target={match[2].startsWith('mailto:') ? undefined : '_blank'}
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:opacity-80"
        >
          {match[1]}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function AjudaResposta({ item }: { item: ItemAjuda }) {
  const isForm = item.tipo === 'Solicitação via Formulário';

  if (isForm) {
    const subject = encodeURIComponent(item.problema);
    return (
      <div className="flex flex-col gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <p className="text-sm font-semibold text-amber-800">Solicitação via contato</p>
        <p className="text-sm text-amber-700">
          Esta solicitação deve ser enviada diretamente ao departamento responsável.
        </p>
        <div className="flex flex-col gap-1 text-sm text-foreground">
          <span><span className="text-muted-foreground">Departamento:</span> {item.departamento}</span>
          <span><span className="text-muted-foreground">E-mail:</span> {item.email}</span>
        </div>
        <a
          href={`mailto:${item.email}?subject=${subject}`}
          className="inline-flex items-center gap-2 self-start mt-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <MailIcon className="h-4 w-4" />
          Entrar em contato
        </a>
      </div>
    );
  }

  return (
    <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
      {item.resposta.split('\n').map((line, i) => (
        <p key={i} className={line.trim() === '' ? 'mt-2' : ''}>
          {renderMarkdown(line)}
        </p>
      ))}
    </div>
  );
}
