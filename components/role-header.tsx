import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import type { User, UserRole } from '@/lib/schemas/user';
import { roleLabels, roleDescriptions } from '@/lib/schemas/user';

const availabilityTone: Record<string, string> = {
  Disponible: 'ok',
  'En tournée': 'busy',
  'En rendez-vous': 'busy',
  Congés: 'off',
};

/**
 * En-tête d'un espace métier : rappelle qui occupe le poste et comment le joindre.
 * C'est la couche humaine qui manquait — un CRM n'est pas qu'une liste de lignes.
 */
export function RoleHeader({ role, user }: { role: UserRole; user: User | null }) {
  return (
    <div className="heading role-heading">
      <div>
        <div className="eyebrow">
          VOTRE ESPACE COMMERCIAL <span>/</span> FULL ACE
        </div>
        <h1>{roleLabels[role]}</h1>
        <p>{roleDescriptions[role]}</p>
      </div>

      {user && (
        <div className="role-person">
          <span className={`role-person-avatar avatar ${user.color}`}>{user.initials}</span>
          <div className="role-person-body">
            <strong>{user.name}</strong>
            <small>{user.jobTitle}</small>
            <span className={`role-person-status status-${availabilityTone[user.availability] ?? 'ok'}`}>
              {user.availability}
            </span>
            <ul className="role-person-contact">
              <li>
                <Mail size={12} /> {user.email}
              </li>
              <li>
                <Phone size={12} /> {user.phone}
              </li>
              <li>
                <MapPin size={12} /> {user.baseCity}
              </li>
              <li>
                <Clock size={12} /> {user.workingHours}
              </li>
            </ul>
            {user.territory && <p className="role-person-territory">Périmètre : {user.territory}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
