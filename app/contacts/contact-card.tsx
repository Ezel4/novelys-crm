'use client';

import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { dayLabel } from '@/lib/dashboard';
import { EditContactDialog } from './contact-form';

type Contact = {
  id: string;
  accountId: string;
  name: string;
  role: string;
  email: string;
  status: 'Vérifié' | 'À revérifier' | 'Parti';
  verified: string | null;
  revision: number;
};

export function ContactCard({
  contact,
  accountName,
  showAccount,
}: {
  contact: Contact;
  accountName: string;
  showAccount: boolean;
}) {
  return (
    <article className={'contact-card ' + (contact.status === 'Parti' ? 'departed' : '')}>
      <span className="avatar">{contact.name.split(' ').map((n) => n[0]).join('')}</span>
      <div>
        <h3>{contact.name}</h3>
        {showAccount && (
          <p>
            <Link href={`/comptes/${contact.accountId}`}>{accountName}</Link>
          </p>
        )}
        <p>{contact.role || 'Rôle à qualifier'}</p>
        <p>{contact.email || 'E-mail non renseigné'}</p>
        <span className={'status ' + (contact.status === 'Vérifié' ? 'verified' : contact.status === 'Parti' ? '' : 'warning')}>
          {contact.status}
        </span>
        {contact.verified && <small>Vérifié le {dayLabel(contact.verified)}</small>}
        <div style={{ marginTop: 10 }}>
          <EditContactDialog
            contact={contact}
            trigger={
              <button className="text-button" type="button">
                <Pencil size={14} />
                Modifier
              </button>
            }
          />
        </div>
      </div>
    </article>
  );
}
