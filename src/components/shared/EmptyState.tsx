import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { InboxIcon } from 'lucide-react';

interface EmptyStateProps {
  image?: string;
  title: string;
  description?: string;
  action?: () => void;
  actionLabel?: string;
}

export function EmptyState({ image, title, description, action, actionLabel }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-12 px-4 text-center">
      {image ? (
        <Image src={image} alt="" width={120} height={120} className="h-28 w-auto" />
      ) : (
        <InboxIcon className="h-12 w-12 text-muted-foreground" />
      )}
      <p className="font-medium text-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground max-w-xs">{description}</p>}
      {action && actionLabel && (
        <Button variant="outline" onClick={action}>{actionLabel}</Button>
      )}
    </div>
  );
}
