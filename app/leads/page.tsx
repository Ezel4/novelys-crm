import { database } from '@/db';
import { campaigns, leads } from '@/db/schema';
import { Plus, Upload } from 'lucide-react';
import { LeadList } from './lead-list';
import { CreateLeadDialog } from './lead-form';
import { ImportLeadsDialog } from './import-dialog';
import { ExportButton } from '@/components/export-button';
import { exportLeadsCsv } from './actions';

export default async function LeadsPage() {
  const db = database();
  const [leadRows, campaignRows] = await Promise.all([
    db.select().from(leads),
    db.select().from(campaigns),
  ]);

  const campaignById = new Map(campaignRows.map((c) => [c.id, c]));

  const rows = leadRows.map((l) => ({
    id: l.id,
    name: l.name,
    company: l.company,
    email: l.email,
    phone: l.phone,
    status: l.status,
    source: l.source,
    campaignName: l.campaignId ? campaignById.get(l.campaignId)?.name ?? null : null,
    convertedAccountId: l.convertedAccountId,
    revision: l.revision,
  }));

  return (
    <>
      <div className="heading">
        <div>
          <div className="eyebrow">
            VOTRE ESPACE COMMERCIAL <span>/</span> FULL ACE
          </div>
          <h1>Leads</h1>
          <p>Des prospects entrants à qualifier et convertir.</p>
        </div>
        <div className="heading-actions">
          <ExportButton label="Exporter" filename="leads.csv" action={exportLeadsCsv} />
          <ImportLeadsDialog
            trigger={
              <button className="secondary" type="button">
                <Upload size={16} />
                Importer
              </button>
            }
          />
          <CreateLeadDialog
            campaigns={campaignRows.map((c) => ({ id: c.id, name: c.name }))}
            trigger={
              <button className="primary">
                <Plus size={18} />
                Nouveau lead
              </button>
            }
          />
        </div>
      </div>
      <LeadList leads={rows} />
    </>
  );
}
