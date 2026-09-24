'use client';

import { useState, useTransition } from 'react';
import Papa from 'papaparse';
import { LoaderCircle, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { importLeads } from './actions';

type ParsedRow = { name: string; company?: string; email?: string; phone?: string; source?: string };

export function ImportLeadsDialog({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');

  function handleFile(file: File) {
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data
          .map((r) => ({
            name: r.name ?? r.nom ?? '',
            company: r.company ?? r.entreprise ?? '',
            email: r.email ?? '',
            phone: r.phone ?? r.telephone ?? '',
            source: r.source ?? '',
          }))
          .filter((r) => r.name.trim());
        setRows(parsed);
        if (!parsed.length) toast.error('Aucune ligne valide trouvée. Vérifiez la colonne "name".');
      },
      error: () => toast.error('Impossible de lire ce fichier CSV.'),
    });
  }

  function submit() {
    if (!rows.length) return;
    startTransition(async () => {
      const result = await importLeads(rows);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success(`${result.imported} lead${result.imported > 1 ? 's' : ''} importé${result.imported > 1 ? 's' : ''}${result.skipped ? `, ${result.skipped} ignoré(s)` : ''}.`);
      setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) {
          setRows([]);
          setFileName('');
        }
      }}
    >
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <DialogContent className="form-dialog">
        <DialogTitle>Importer des leads</DialogTitle>
        <DialogDescription>
          Fichier CSV avec en-têtes : name, company, email, phone, source.
        </DialogDescription>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {fileName && <p className="import-filename">{rows.length} ligne{rows.length > 1 ? 's' : ''} détectée{rows.length > 1 ? 's' : ''} dans {fileName}</p>}
        {rows.length > 0 && (
          <div className="import-preview">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Entreprise</TableHead>
                  <TableHead>E-mail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 5).map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>{r.company}</TableCell>
                    <TableCell>{r.email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {rows.length > 5 && <small>… et {rows.length - 5} de plus</small>}
          </div>
        )}
        <div className="form-footer">
          <button type="button" className="secondary" onClick={() => setOpen(false)}>
            Annuler
          </button>
          <button className="primary" disabled={pending || !rows.length} onClick={submit}>
            {pending ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}
            Importer {rows.length ? `(${rows.length})` : ''}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
