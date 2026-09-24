import { Plus } from 'lucide-react';
import { database } from '@/db';
import { campaigns, leads } from '@/db/schema';
import { CreateCampaignDialog } from './campaign-form';
import { CampaignTable } from './campaign-table';

export default async function CampagnesPage() {
  const db = database();
  const [campaignRows, leadRows] = await Promise.all([
    db.select().from(campaigns).orderBy(campaigns.name),
    db.select().from(leads),
  ]);

  const leadCountByCampaign = new Map<string, number>();
  for (const l of leadRows) {
    if (!l.campaignId) continue;
    leadCountByCampaign.set(l.campaignId, (leadCountByCampaign.get(l.campaignId) ?? 0) + 1);
  }

  const rows = campaignRows.map((c) => ({ ...c, leadCount: leadCountByCampaign.get(c.id) ?? 0 }));

  return (
    <>
      <div className="heading">
        <div>
          <div className="eyebrow">
            VOTRE ESPACE COMMERCIAL <span>/</span> FULL ACE
          </div>
          <h1>Campagnes</h1>
          <p>Vos actions marketing et leur génération de leads.</p>
        </div>
        <div className="heading-actions">
          <CreateCampaignDialog
            trigger={
              <button className="primary">
                <Plus size={18} />
                Nouvelle campagne
              </button>
            }
          />
        </div>
      </div>
      <CampaignTable campaigns={rows} />
    </>
  );
}
