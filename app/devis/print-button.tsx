'use client';

import { Printer } from 'lucide-react';

export function PrintButton() {
  return (
    <button type="button" className="primary" onClick={() => window.print()}>
      <Printer size={17} />
      Imprimer / PDF
    </button>
  );
}
