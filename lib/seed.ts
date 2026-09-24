import { accounts, contacts, deals, campaigns, leads, interactions, tasks, users, visits, settings, pickLists, quotes, quoteItems } from '@/db/schema';
import { isoDay } from './dashboard';
import { geocode, distanceKm } from './geo';
import type { database } from '@/db';

/* --- L'équipe : les trois personnes du CRM --- */
const userRows = [
  {
    id: 'u-commercial',
    name: 'Camille Fabre',
    role: 'Commercial' as const,
    jobTitle: 'Commerciale terrain — Grand Ouest',
    email: 'c.fabre@fullace.example',
    phone: '06 42 18 77 05',
    initials: 'CF',
    color: 'blue',
    baseCity: 'Nantes',
    territory: 'Bretagne, Pays de la Loire, Nouvelle-Aquitaine',
    bio: 'Huit ans de vente d’objets personnalisés. Connaît ses clients par leur prénom et prépare chaque tournée la veille au soir.',
    strengths: 'Relation de confiance, négociation, connaissance produit textile',
    workingHours: '8h30 – 18h30',
    availability: 'En tournée' as const,
    monthlyTarget: 25000,
    startedAt: isoDay(-1280),
  },
  {
    id: 'u-adv',
    name: 'Sofiane Mercier',
    role: 'ADV' as const,
    jobTitle: 'Administration des ventes',
    email: 's.mercier@fullace.example',
    phone: '02 40 55 18 22',
    initials: 'SM',
    color: 'sky',
    baseCity: 'Nantes',
    territory: 'Siège — tous comptes',
    bio: 'Garant de la chaîne devis → commande → livraison. Rien ne part sans un dossier complet et une date de besoin réaliste.',
    strengths: 'Rigueur documentaire, chiffrage, coordination production',
    workingHours: '9h – 17h30',
    availability: 'Disponible' as const,
    monthlyTarget: 0,
    startedAt: isoDay(-820),
  },
  {
    id: 'u-dirigeant',
    name: 'Hélène Vasseur',
    role: 'Dirigeant' as const,
    jobTitle: 'Directrice générale',
    email: 'h.vasseur@fullace.example',
    phone: '06 07 33 91 40',
    initials: 'HV',
    color: 'navy',
    baseCity: 'Nantes',
    territory: 'France entière',
    bio: 'Pilote la croissance du groupe. Arbitre sur la marge, la charge de production et l’équilibre du portefeuille clients.',
    strengths: 'Vision long terme, arbitrage marge, développement grands comptes',
    workingHours: '8h – 19h',
    availability: 'En rendez-vous' as const,
    monthlyTarget: 0,
    startedAt: isoDay(-3200),
  },
];

/* --- Comptes : ville, santé, propriétaire --- */
const accountRows = [
  ['atelier', 'Atelier Beaumont', 'Bordeaux', 'Architecture & design', 'Textile', 'AB', 'blue', 'Camille Laurent', 'Responsable communication', 'Collection équipe · 250 polos', 8450, 'Devis envoyé', false, 'Renouvellement des tenues pour l’ouverture du nouvel atelier. Le devis a été transmis ; le logo vectoriel reste à récupérer.', 12, 32600, 'Récupérer le logo vectoriel', 0, 'Bonne', 60],
  ['horizon', 'Horizon Énergies', 'Lyon', 'Énergie', 'Objets publicitaires', 'HE', 'navy', 'Thomas Mercier', 'Responsable achats', 'Welcome packs · 400 unités', 12600, 'À qualifier', true, 'Le client prépare une campagne interne. Le calendrier et la personne qui validera le budget restent à confirmer.', 8, 28400, 'Qualifier le calendrier et le décideur', 0, 'À surveiller', 30],
  ['maison', 'Maison Rivage', 'La Rochelle', 'Hôtellerie', 'Bagagerie', 'MR', 'sky', 'Julie Moreau', 'Directrice marketing', 'Sacs de plage · 500 unités', 6250, 'Devis envoyé', true, 'Réassort saisonnier de sacs personnalisés. Julie a reçu le devis et souhaite comparer les deux options de marquage.', 6, 18950, 'Relancer le devis et valider le marquage', -1, 'Bonne', 70],
  ['studio', 'Studio Octave', 'Nantes', 'Communication', 'Textile', 'SO', 'lavender', 'Léa Dubois', 'Cheffe de projet', 'Collection événement · 150 pièces', 4200, 'Devis à préparer', true, 'Un nouveau projet événementiel est identifié. L’ancien interlocuteur a quitté l’entreprise ; la remplaçante doit être revérifiée.', 4, 12100, 'Vérifier le rôle de la nouvelle interlocutrice', 1, 'À risque', 25],
  ['terres', 'Terres & Sens', 'Angers', 'Agroalimentaire', 'Objets publicitaires', 'TS', 'pale', 'Antoine Petit', 'Responsable communication', 'Coffrets partenaires · 200 unités', 5800, 'Devis à préparer', false, 'Préparation des cadeaux partenaires de fin d’année. La proposition attend un logo exploitable avant chiffrage du marquage.', 9, 24800, 'Demander le fichier du logo', 2, 'Bonne', 45],
  ['collectif', 'Collectif Azur', 'Marseille', 'Association', 'Textile', 'CA', 'ice', 'Sarah Bernard', 'Coordinatrice', 'T-shirts bénévoles · 300 pièces', 3900, 'Gagné', true, 'La commande des bénévoles est confirmée. Préparer le prochain échange pour vérifier la réception et recueillir le retour du client.', 5, 14650, 'Faire le point après livraison', 3, 'Bonne', 100],
] as const;

/* --- Couche humaine des contacts : canal, influence, relation, note personnelle --- */
const contactHuman = [
  { phone: '05 56 44 21 08', preferredChannel: 'Téléphone' as const, bestTime: 'Matin, avant 10h', influence: 'Prescripteur' as const, relationship: 'Solide' as const, personalNote: 'Passionnée de voile, part naviguer chaque mois d’août. Préfère un appel court à un long e-mail.', birthday: '1986-04-12' },
  { phone: '04 72 33 88 19', preferredChannel: 'E-mail' as const, bestTime: 'Fin de journée', influence: 'Utilisateur' as const, relationship: 'Cordiale' as const, personalNote: 'Très process : demande toujours un écrit avant d’engager quoi que ce soit. Ne décide pas seul du budget.', birthday: '1979-11-03' },
  { phone: '05 46 27 65 40', preferredChannel: 'Rendez-vous' as const, bestTime: 'Mardi et jeudi', influence: 'Décideur' as const, relationship: 'Ambassadeur' as const, personalNote: 'Nous recommande régulièrement à d’autres hôteliers de la côte. Sensible à la qualité des finitions.', birthday: '1982-06-27' },
  { phone: '', preferredChannel: 'E-mail' as const, bestTime: '', influence: 'Utilisateur' as const, relationship: 'Froide' as const, personalNote: 'Vient d’arriver en remplacement de Paul Martin. Premier échange à organiser pour se présenter.', birthday: null },
  { phone: '02 41 19 07 52', preferredChannel: 'Téléphone' as const, bestTime: 'Lundi matin', influence: 'Décideur' as const, relationship: 'Solide' as const, personalNote: 'Fils au conservatoire, en parle volontiers. Apprécie qu’on prenne des nouvelles avant de parler chiffres.', birthday: '1974-09-15' },
  { phone: '04 91 55 30 77', preferredChannel: 'LinkedIn' as const, bestTime: 'Mercredi après-midi', influence: 'Décideur' as const, relationship: 'Solide' as const, personalNote: 'Association bénévole : budget serré mais décisions rapides. Toujours reconnaissante d’un geste commercial.', birthday: '1991-01-22' },
];

/* --- Devis : un par étape du cycle, dans l'ordre chronologique d'émission --- */
// Lignes : [libellé, quantité, prix unitaire HT, remise %]. Validité : 30 jours après émission.
const quoteRows = [
  {
    id: 'quote-demo-1', accountId: 'horizon', dealId: 'deal-lost-1', contactId: 'contact-1', status: 'Refusé' as const, issuedOffset: -75,
    notes: 'Refusé : une offre concurrente arrivait 12 % moins cher sur le même panier.',
    items: [
      ['Mug céramique 33 cl, marquage 1 couleur', 300, 6.9, 0],
      ['Carnet A5 couverture personnalisée', 300, 8.5, 0],
      ['Stylo métal gravé laser', 300, 3.2, 0],
      ['Tote bag coton 140 g/m², impression 1 couleur', 300, 5.9, 0],
      ['Frais techniques (calage, BAT)', 1, 150, 0],
    ],
  },
  {
    id: 'quote-demo-2', accountId: 'studio', dealId: 'deal-lost-2', contactId: 'contact-old', status: 'Expiré' as const, issuedOffset: -52,
    notes: 'Non signé : le délai de production ne tenait pas la date du festival.',
    items: [
      ['Tote bag coton bio 180 g/m², sérigraphie 2 couleurs', 500, 5.4, 0],
      ['Écran de sérigraphie', 2, 65, 0],
      ['Livraison express', 1, 290, 0],
    ],
  },
  {
    id: 'quote-demo-3', accountId: 'collectif', dealId: 'deal-5', contactId: 'contact-5', status: 'Accepté' as const, issuedOffset: -24,
    notes: 'Signé par Sarah Bernard. Geste commercial association : 3 % sur les t-shirts.',
    items: [
      ['T-shirt coton 150 g/m², impression cœur + dos', 300, 12, 3],
      ['Écran de sérigraphie', 3, 65, 0],
      ['Livraison Marseille', 1, 190, 0],
    ],
  },
  {
    id: 'quote-demo-4', accountId: 'atelier', dealId: 'deal-0', contactId: 'contact-0', status: 'Envoyé' as const, issuedOffset: -12,
    notes: 'Logo vectoriel à recevoir avant lancement. Répartition des tailles (S → XXL) à confirmer.',
    items: [
      ['Polo piqué 210 g/m², broderie cœur', 250, 24.5, 0],
      ['Broderie dos, logo grand format', 250, 7.8, 0],
      ['Programmation broderie', 2, 95, 0],
      ['Livraison Bordeaux', 1, 180, 0],
    ],
  },
  {
    id: 'quote-demo-5', accountId: 'maison', dealId: 'deal-2', contactId: 'contact-2', status: 'Envoyé' as const, issuedOffset: -9,
    notes: 'Option A — sérigraphie 2 couleurs. À comparer avec l’option B en broderie.',
    items: [
      ['Sac de plage jute & coton, sérigraphie 2 couleurs', 500, 10.9, 0],
      ['Écran de sérigraphie', 2, 65, 0],
      ['Livraison La Rochelle', 1, 210, 0],
    ],
  },
  {
    id: 'quote-demo-6', accountId: 'maison', dealId: 'deal-2', contactId: 'contact-2', status: 'Envoyé' as const, issuedOffset: -9,
    notes: 'Option B — broderie ton sur ton, rendu plus premium.',
    items: [
      ['Sac de plage jute & coton, broderie 1 position', 500, 11.8, 0],
      ['Programmation broderie', 1, 95, 0],
      ['Livraison La Rochelle', 1, 210, 0],
    ],
  },
  {
    id: 'quote-demo-7', accountId: 'terres', dealId: 'deal-4', contactId: 'contact-4', status: 'Brouillon' as const, issuedOffset: -2,
    notes: 'Marquage à chiffrer à réception du logo vectoriel.',
    items: [
      ['Coffret kraft aimanté, étiquette personnalisée', 200, 9.5, 0],
      ['Gourde inox 50 cl, gravure laser', 200, 12.4, 0],
      ['Carnet liège A6', 200, 5.8, 0],
      ['Mise en coffret et calage', 200, 1.2, 0],
    ],
  },
  {
    id: 'quote-demo-8', accountId: 'studio', dealId: 'deal-3', contactId: 'contact-3', status: 'Brouillon' as const, issuedOffset: -1,
    notes: 'Répartition sweats / t-shirts provisoire, à valider avec Léa Dubois.',
    items: [
      ['Sweat zippé 280 g/m², broderie cœur', 90, 32, 0],
      ['T-shirt coton bio, impression 1 couleur', 60, 13.5, 0],
      ['Programmation broderie', 1, 95, 0],
      ['Livraison sur site (Nantes)', 1, 120, 0],
    ],
  },
] as const;

/** Ajoute les devis de démonstration, y compris aux bases initialisées avant leur création. */
async function seedDemoQuotes(db: ReturnType<typeof database>) {
  const existing = await db.select({ id: quotes.id }).from(quotes).limit(1);
  if (existing.length > 0) return;

  // Les affaires ou contacts de démonstration ont pu être supprimés depuis.
  const [dealRows, contactRows] = await Promise.all([
    db.select({ id: deals.id }).from(deals),
    db.select({ id: contacts.id }).from(contacts),
  ]);
  const dealIds = new Set(dealRows.map((d) => d.id));
  const contactIds = new Set(contactRows.map((c) => c.id));

  const perYear = new Map<string, number>();
  for (const q of quoteRows) {
    if (!dealIds.has(q.dealId)) continue;
    const issueDate = isoDay(q.issuedOffset);
    const year = issueDate.slice(0, 4);
    const n = (perYear.get(year) ?? 0) + 1;
    perYear.set(year, n);

    await db.insert(quotes).values({
      id: q.id,
      number: `DEV-${year}-${String(n).padStart(3, '0')}`,
      accountId: q.accountId,
      dealId: q.dealId,
      contactId: contactIds.has(q.contactId) ? q.contactId : null,
      status: q.status,
      issueDate,
      validUntil: isoDay(q.issuedOffset + 30),
      vatRate: 20,
      notes: q.notes,
      revision: 0,
    });
    await db.insert(quoteItems).values(
      q.items.map(([label, quantity, unitPrice, discount], position) => ({
        id: `${q.id}-${position}`,
        quoteId: q.id,
        position,
        label,
        quantity,
        unitPrice,
        discount,
      }))
    );
  }
}

export async function seedDemoData(db: ReturnType<typeof database>) {
  const existing = await db.select({ id: accounts.id }).from(accounts).limit(1);
  if (existing.length > 0) return seedDemoQuotes(db);

  for (const u of userRows) {
    await db.insert(users).values({ ...u, active: true, revision: 0 });
  }

  for (let i = 0; i < accountRows.length; i++) {
    const r = accountRows[i];
    const [id, name, city, sector, family, initials, color, contactName, contactRole, dealName, dealAmount, dealStage, dealLogo, summary, orders, revenue, next, dueOffset, health, probability] = r;

    // Le portefeuille terrain appartient à la commerciale ; la direction suit les grands comptes.
    const ownerId = i === 1 ? 'u-dirigeant' : 'u-commercial';
    const coords = geocode(city);

    await db.insert(accounts).values({
      id,
      name,
      city,
      sector,
      family,
      initials,
      color,
      summary,
      orders,
      revenue,
      lastOrder: isoDay(-30 - i * 7),
      next,
      due: isoDay(dueOffset),
      ownerId,
      lat: coords?.lat ?? 0,
      lng: coords?.lng ?? 0,
      health,
      paymentTerms: i === 3 ? '45 jours' : '30 jours',
      revision: 0,
    });

    const contactId = `contact-${i}`;
    const human = contactHuman[i];
    await db.insert(contacts).values({
      id: contactId,
      accountId: id,
      name: contactName,
      role: contactRole,
      email: `contact@${id}.example`,
      status: i === 3 ? 'À revérifier' : 'Vérifié',
      verified: i === 3 ? null : isoDay(-7 - i),
      ...human,
      revision: 0,
    });

    if (i === 3) {
      await db.insert(contacts).values({
        id: 'contact-old',
        accountId: id,
        name: 'Paul Martin',
        role: 'Ancien chef de projet',
        email: 'paul@studio.example',
        status: 'Parti',
        verified: null,
        phone: '',
        preferredChannel: 'E-mail',
        bestTime: '',
        influence: 'Utilisateur',
        relationship: 'Froide',
        personalNote: 'A quitté l’entreprise en début d’année. Ne plus contacter.',
        birthday: null,
        revision: 0,
      });
    }

    const dealId = `deal-${i}`;
    await db.insert(deals).values({
      id: dealId,
      accountId: id,
      contactId,
      name: dealName,
      amount: dealAmount,
      stage: dealStage,
      decisionMaker: i === 1 ? '' : contactName,
      deadline: i === 1 ? null : isoDay(15 + i * 4),
      logo: dealLogo,
      ownerId,
      probability,
      lossReason: '',
      revision: 0,
    });

    await db.insert(interactions).values({
      id: `initial-${i}`,
      accountId: id,
      contactId,
      dealId,
      leadId: null,
      date: isoDay(-2 - i) + 'T10:30:00Z',
      type: i % 2 ? 'Appel' : 'E-mail',
      contactName,
      result: summary,
      next,
      due: isoDay(dueOffset),
      revision: 0,
    });
  }

  // Deux affaires perdues : sans motif de perte, le dirigeant n'a rien à analyser.
  await db.insert(deals).values([
    { id: 'deal-lost-1', accountId: 'horizon', contactId: null, name: 'Goodies séminaire 2025', amount: 7400, stage: 'Perdu', decisionMaker: 'Thomas Mercier', deadline: isoDay(-45), logo: true, ownerId: 'u-commercial', probability: 0, lossReason: 'Prix trop élevé', revision: 0 },
    { id: 'deal-lost-2', accountId: 'studio', contactId: null, name: 'Tote bags festival', amount: 3100, stage: 'Perdu', decisionMaker: '', deadline: isoDay(-22), logo: false, ownerId: 'u-commercial', probability: 0, lossReason: 'Délai de production trop long', revision: 0 },
  ]);

  await db.insert(campaigns).values([
    { id: 'camp-salon-textile', name: 'Salon Textile Pro 2026', type: 'Salon', status: 'Terminée', startDate: isoDay(-40), endDate: isoDay(-37), budget: 3200, accountId: null, revision: 0 },
    { id: 'camp-newsletter-printemps', name: 'Newsletter printemps', type: 'Email', status: 'Active', startDate: isoDay(-5), endDate: isoDay(10), budget: 450, accountId: null, revision: 0 },
    { id: 'camp-linkedin-pme', name: 'Campagne LinkedIn PME', type: 'Réseaux sociaux', status: 'Planifiée', startDate: isoDay(7), endDate: isoDay(37), budget: 1800, accountId: null, revision: 0 },
  ]);

  await db.insert(leads).values([
    { id: 'lead-1', name: 'Nicolas Fabre', company: 'Verrerie du Sud', email: 'n.fabre@verreriedusud.example', phone: '06 12 34 56 78', status: 'Nouveau', source: 'Salon Textile Pro 2026', campaignId: 'camp-salon-textile', convertedAccountId: null, revision: 0 },
    { id: 'lead-2', name: 'Amandine Roy', company: 'Café des Alpes', email: 'amandine.roy@cafedesalpes.example', phone: '06 98 76 54 32', status: 'Contacté', source: 'Newsletter printemps', campaignId: 'camp-newsletter-printemps', convertedAccountId: null, revision: 0 },
    { id: 'lead-3', name: 'Karim Belaïd', company: 'Nova Sport', email: 'k.belaid@novasport.example', phone: '07 11 22 33 44', status: 'Qualifié', source: 'Recommandation', campaignId: null, convertedAccountId: null, revision: 0 },
    { id: 'lead-4', name: 'Élodie Chauvet', company: 'Brasserie Caravelle', email: 'e.chauvet@caravelle.example', phone: '06 55 09 13 87', status: 'Nouveau', source: 'Salon Textile Pro 2026', campaignId: 'camp-salon-textile', convertedAccountId: null, revision: 0 },
    { id: 'lead-5', name: 'Marc Delaunay', company: 'Groupe Solane', email: 'm.delaunay@solane.example', phone: '07 62 40 55 11', status: 'Nouveau', source: 'Site web', campaignId: null, convertedAccountId: null, revision: 0 },
  ]);

  /* --- Tâches réparties entre les trois postes --- */
  const taskRows = [
    { id: 'task-1', title: 'Rappeler Camille Laurent pour le logo vectoriel', description: 'Le devis est bloqué tant que le fichier n’est pas reçu.', dueDate: isoDay(0), status: 'À faire', priority: 'Haute', ownerId: 'u-commercial', accountId: 'atelier', dealId: 'deal-0', revision: 0 },
    { id: 'task-2', title: 'Préparer la tournée Grand Ouest de jeudi', description: 'Confirmer les trois rendez-vous et imprimer les échantillons.', dueDate: isoDay(1), status: 'À faire', priority: 'Normale', ownerId: 'u-commercial', accountId: null, dealId: null, revision: 0 },
    { id: 'task-3', title: 'Relancer Maison Rivage sur le devis', description: 'Julie compare deux options de marquage depuis une semaine.', dueDate: isoDay(-1), status: 'À faire', priority: 'Haute', ownerId: 'u-commercial', accountId: 'maison', dealId: 'deal-2', revision: 0 },
    { id: 'task-4', title: 'Chiffrer le marquage Terres & Sens', description: 'En attente du logo exploitable pour finaliser la proposition.', dueDate: isoDay(2), status: 'À faire', priority: 'Normale', ownerId: 'u-adv', accountId: 'terres', dealId: 'deal-4', revision: 0 },
    { id: 'task-5', title: 'Vérifier les coordonnées de Studio Octave', description: 'Nouvelle interlocutrice à qualifier, e-mail et téléphone manquants.', dueDate: isoDay(0), status: 'À faire', priority: 'Haute', ownerId: 'u-adv', accountId: 'studio', dealId: null, revision: 0 },
    { id: 'task-6', title: 'Lancer la production Collectif Azur', description: 'Commande signée, transmettre le bon de fabrication à l’atelier.', dueDate: isoDay(1), status: 'À faire', priority: 'Normale', ownerId: 'u-adv', accountId: 'collectif', dealId: 'deal-5', revision: 0 },
    { id: 'task-7', title: 'Revue de pipeline mensuelle', description: 'Passer en revue les affaires ouvertes avec Camille et Sofiane.', dueDate: isoDay(3), status: 'À faire', priority: 'Normale', ownerId: 'u-dirigeant', accountId: null, dealId: null, revision: 0 },
    { id: 'task-8', title: 'Arbitrer la remise Horizon Énergies', description: 'Le compte est à surveiller : décider de la marge plancher acceptable.', dueDate: isoDay(0), status: 'À faire', priority: 'Haute', ownerId: 'u-dirigeant', accountId: 'horizon', dealId: 'deal-1', revision: 0 },
  ] as const;
  for (let i = 0; i < taskRows.length; i += 4) {
    await db.insert(tasks).values([...taskRows.slice(i, i + 4)]);
  }

  /* --- Tournée commerciale : une boucle Grand Ouest au départ de Nantes --- */
  const base = geocode('Nantes')!;
  const visitPlan = [
    { id: 'visit-1', accountId: 'studio', contactId: 'contact-3', city: 'Nantes', label: 'Studio Octave — première rencontre', date: isoDay(1), startTime: '09:00', durationMin: 60, purpose: 'Découverte' as const, status: 'Confirmée' as const, notes: 'Se présenter à la nouvelle cheffe de projet et requalifier le besoin événementiel.' },
    { id: 'visit-2', accountId: 'terres', contactId: 'contact-4', city: 'Angers', label: 'Terres & Sens — récupérer le logo', date: isoDay(1), startTime: '11:30', durationMin: 45, purpose: 'Relance' as const, status: 'Confirmée' as const, notes: 'Repartir avec le fichier vectoriel pour débloquer le chiffrage du marquage.' },
    { id: 'visit-3', accountId: 'maison', contactId: 'contact-2', city: 'La Rochelle', label: 'Maison Rivage — présentation devis', date: isoDay(1), startTime: '15:00', durationMin: 90, purpose: 'Présentation devis' as const, status: 'Planifiée' as const, notes: 'Apporter les deux échantillons de marquage pour trancher sur place.' },
    { id: 'visit-4', accountId: 'atelier', contactId: 'contact-0', city: 'Bordeaux', label: 'Atelier Beaumont — signature', date: isoDay(2), startTime: '10:00', durationMin: 60, purpose: 'Signature' as const, status: 'Planifiée' as const, notes: 'Devis envoyé, signature attendue pour l’ouverture du nouvel atelier.' },
    { id: 'visit-5', accountId: 'collectif', contactId: 'contact-5', city: 'Marseille', label: 'Collectif Azur — suivi livraison', date: isoDay(8), startTime: '14:00', durationMin: 45, purpose: 'Suivi livraison' as const, status: 'Planifiée' as const, notes: 'Vérifier la réception des t-shirts et recueillir le retour des bénévoles.' },
  ];

  let previous: { lat: number; lng: number } = base;
  for (const v of visitPlan) {
    const coords = geocode(v.city);
    const point = { lat: coords?.lat ?? 0, lng: coords?.lng ?? 0 };
    await db.insert(visits).values({
      ...v,
      userId: 'u-commercial',
      lat: point.lat,
      lng: point.lng,
      distanceKm: distanceKm(previous, point),
      revision: 0,
    });
    previous = point;
  }

  /* --- Paramètres par défaut du CRM --- */
  // D1 plafonne le nombre de variables liées par requête : on insère par lots.
  const settingRows = [
    { key: 'company.name', section: 'societe', value: 'GROUPE FULL ACE' },
    { key: 'company.legalForm', section: 'societe', value: 'SAS' },
    { key: 'company.siret', section: 'societe', value: '812 457 903 00024' },
    { key: 'company.vatNumber', section: 'societe', value: 'FR 42 812457903' },
    { key: 'company.address', section: 'societe', value: '14 rue des Ateliers, 44000 Nantes' },
    { key: 'company.phone', section: 'societe', value: '02 40 00 00 00' },
    { key: 'company.email', section: 'societe', value: 'contact@fullace.example' },
    { key: 'company.website', section: 'societe', value: 'www.fullace.example' },

    { key: 'sales.currency', section: 'commercial', value: 'EUR' },
    { key: 'sales.defaultVatRate', section: 'commercial', value: '20' },
    { key: 'sales.quoteValidityDays', section: 'commercial', value: '30' },
    { key: 'sales.quotePrefix', section: 'commercial', value: 'DEV' },
    { key: 'sales.defaultPaymentTerms', section: 'commercial', value: '30 jours' },
    { key: 'sales.minMargin', section: 'commercial', value: '25' },
    { key: 'sales.maxDiscount', section: 'commercial', value: '15' },

    { key: 'followup.relanceDays', section: 'relances', value: '7' },
    { key: 'followup.dormantDays', section: 'relances', value: '45' },
    { key: 'followup.contactRecheckDays', section: 'relances', value: '90' },
    { key: 'followup.quoteReminderDays', section: 'relances', value: '5' },

    { key: 'tour.startCity', section: 'tournees', value: 'Nantes' },
    { key: 'tour.maxDailyKm', section: 'tournees', value: '450' },
    { key: 'tour.avgSpeed', section: 'tournees', value: '75' },
    { key: 'tour.visitDuration', section: 'tournees', value: '60' },
    { key: 'tour.workdayStart', section: 'tournees', value: '08:30' },
    { key: 'tour.workdayEnd', section: 'tournees', value: '18:30' },

    { key: 'notify.dailyDigest', section: 'notifications', value: 'true' },
    { key: 'notify.quoteAccepted', section: 'notifications', value: 'true' },
    { key: 'notify.dealLost', section: 'notifications', value: 'true' },
    { key: 'notify.overdueTasks', section: 'notifications', value: 'true' },
    { key: 'notify.weeklyReport', section: 'notifications', value: 'false' },

    { key: 'data.duplicateCheck', section: 'donnees', value: 'true' },
    { key: 'data.requireLogoBeforeQuote', section: 'donnees', value: 'true' },
    { key: 'data.requirePhoneOnContact', section: 'donnees', value: 'false' },
    { key: 'data.retentionMonths', section: 'donnees', value: '60' },
  ];
  for (let i = 0; i < settingRows.length; i += 10) {
    await db.insert(settings).values(settingRows.slice(i, i + 10));
  }

  /* --- Listes de valeurs personnalisables --- */
  const lists: [string, string[]][] = [
    ['secteurs', ['Architecture & design', 'Énergie', 'Hôtellerie', 'Communication', 'Agroalimentaire', 'Association', 'Industrie', 'Distribution']],
    ['familles', ['Textile', 'Objets publicitaires', 'Bagagerie', 'Papeterie', 'Signalétique']],
    ['sources', ['Salon', 'Site web', 'Recommandation', 'Newsletter', 'LinkedIn', 'Prospection directe']],
    ['motifs-perte', ['Prix trop élevé', 'Délai de production trop long', 'Concurrent déjà en place', 'Projet annulé', 'Sans réponse']],
  ];
  for (const [list, values] of lists) {
    for (let i = 0; i < values.length; i++) {
      await db.insert(pickLists).values({ id: `${list}-${i}`, list, value: values[i], position: i, active: true });
    }
  }

  await seedDemoQuotes(db);
}
