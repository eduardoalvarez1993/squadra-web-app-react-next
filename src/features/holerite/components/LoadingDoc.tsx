import { Skeleton } from '@/components/shared/Skeleton';

export function LoadingDoc() {
  return (
    <div className="flex flex-col gap-2 p-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-4 w-1/2" />
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full" />
      ))}
    </div>
  );
}
