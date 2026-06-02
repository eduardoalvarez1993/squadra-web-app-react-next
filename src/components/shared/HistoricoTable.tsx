interface Column {
  key: string;
  label: string;
}

interface HistoricoTableProps {
  columns: Column[];
  rows: Record<string, React.ReactNode>[];
  emptyLabel?: string;
}

export function HistoricoTable({
  columns,
  rows,
  emptyLabel = 'Nenhum registro encontrado.',
}: HistoricoTableProps) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">{emptyLabel}</p>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className="whitespace-nowrap py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-muted/40 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className="whitespace-nowrap py-3 px-4">
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
