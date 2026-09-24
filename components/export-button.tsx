'use client';

import { useTransition } from 'react';
import { Download, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';

export function ExportButton({ label, filename, action }: { label: string; filename: string; action: () => Promise<string> }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        const csv = await action();
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        toast.error("Export impossible. Réessayez.");
      }
    });
  }

  return (
    <button type="button" className="secondary" onClick={handleClick} disabled={pending}>
      {pending ? <LoaderCircle className="spin" size={16} /> : <Download size={16} />}
      {label}
    </button>
  );
}
