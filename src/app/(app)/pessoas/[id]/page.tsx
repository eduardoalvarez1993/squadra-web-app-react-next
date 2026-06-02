'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AvatarGradient } from '@/components/shared/AvatarGradient';
import { ErrorSection } from '@/components/shared/ErrorSection';
import { Skeleton } from '@/components/shared/Skeleton';
import { SimularBtn } from '@/features/pessoas/components/SimularBtn';
import type { PessoaData } from '@/services/squadra-client';

interface Props {
  params: Promise<{ id: string }>;
}

export default function PessoaDetailPage({ params }: Props) {
  const { id } = use(params);

  const { data, isLoading, isError, refetch } = useQuery<PessoaData>({
    queryKey: ['pessoas', id],
    queryFn:  async () => {
      const res = await fetch(`/api/pessoas/${id}`);
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto">
        <Skeleton height="80px" width="100%" />
        <Skeleton height="120px" width="100%" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-4">
        <ErrorSection message="Colaborador não encontrado." onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <AvatarGradient nome={data.nomeSocial || data.nome} foto={data.foto} size={56} />
        <div>
          <h1 className="text-xl font-semibold">{data.nomeSocial || data.nome}</h1>
          <p className="text-sm text-muted-foreground">{data.cargo}</p>
          {data.email && <p className="text-xs text-muted-foreground">{data.email}</p>}
        </div>
      </div>

      <div className="bg-card border border-border rounded-card p-4 flex flex-col gap-2">
        {data.celular && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground w-20">Celular</span>
            <span>{data.celular}</span>
          </div>
        )}
        {data.login && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground w-20">Login</span>
            <span>{data.login}</span>
          </div>
        )}
      </div>

      <SimularBtn pessoaId={data.id} nomePessoa={data.nomeSocial || data.nome} />
    </div>
  );
}
