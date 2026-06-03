import ajudaData from '@/data/ajuda.json';
import { AjudaPageClient } from '@/features/ajuda/components/AjudaPageClient';
import type { ItemAjuda } from '@/features/ajuda/components/AjudaResposta';

// Server Component — lê o JSON server-side, não entra no bundle do cliente
export default function AjudaPage() {
  return <AjudaPageClient dados={ajudaData as ItemAjuda[]} />;
}
