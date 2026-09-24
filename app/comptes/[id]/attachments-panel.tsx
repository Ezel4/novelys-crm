'use client';

import { useState, useTransition } from 'react';
import { Link as LinkIcon, Plus, Trash2, LoaderCircle, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Attachment, AttachmentMedia, AttachmentContent, AttachmentTitle, AttachmentDescription, AttachmentActions, AttachmentAction, AttachmentGroup } from '@/components/ui/attachment';
import { addAttachment, deleteAttachment } from '@/app/attachments/actions';

export type AttachmentRow = { id: string; filename: string; url: string; revision: number };

function AddLinkDialog({ accountId }: { accountId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [filename, setFilename] = useState('');
  const [url, setUrl] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!filename.trim() || !url.trim()) return;
    startTransition(async () => {
      const result = await addAttachment({ accountId, dealId: null, filename, url });
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      toast.success('Lien ajouté.');
      setOpen(false);
      setFilename('');
      setUrl('');
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setFilename('');
          setUrl('');
        }
      }}
    >
      <span onClick={() => setOpen(true)}>
        <button type="button" className="secondary">
          <Plus size={16} />
          Ajouter un lien
        </button>
      </span>
      <DialogContent className="form-dialog">
        <DialogTitle>Ajouter un document</DialogTitle>
        <DialogDescription>Enregistrez un lien vers un fichier externe (Drive, Dropbox…).</DialogDescription>
        <form onSubmit={submit}>
          <label htmlFor="att-name">Nom du document
            <input id="att-name" required maxLength={200} value={filename} onChange={(e) => setFilename(e.target.value)} />
          </label>
          <label htmlFor="att-url">Lien
            <input id="att-url" required type="url" maxLength={2000} placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
          </label>
          <div className="form-footer">
            <button type="button" className="secondary" onClick={() => setOpen(false)}>
              Annuler
            </button>
            <button className="primary" disabled={pending}>
              {pending ? <LoaderCircle className="spin" size={16} /> : <Check size={16} />}
              Ajouter
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AttachmentItem({ attachment, accountId }: { attachment: AttachmentRow; accountId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Attachment orientation="horizontal">
      <AttachmentMedia>
        <LinkIcon size={16} />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{attachment.filename}</AttachmentTitle>
        <AttachmentDescription>{attachment.url}</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction asChild title="Ouvrir">
          <a href={attachment.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={14} />
          </a>
        </AttachmentAction>
        <AttachmentAction
          title="Supprimer"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await deleteAttachment(attachment.id, attachment.revision, accountId);
              if ('error' in result) toast.error(result.error);
              else toast.success('Document supprimé.');
            })
          }
        >
          <Trash2 size={14} />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  );
}

export function AttachmentsPanel({ accountId, attachments }: { accountId: string; attachments: AttachmentRow[] }) {
  return (
    <section className="sheet-section">
      <div className="panel-title">
        <h3>Documents</h3>
        <AddLinkDialog accountId={accountId} />
      </div>
      <AttachmentGroup className="flex-col">
        {attachments.map((a) => (
          <AttachmentItem key={a.id} attachment={a} accountId={accountId} />
        ))}
      </AttachmentGroup>
      {!attachments.length && <div className="empty">Aucun document lié à ce compte.</div>}
    </section>
  );
}
