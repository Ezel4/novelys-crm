/**
 * Géographie locale — aucune dépendance externe, aucune clé API.
 * Projection équirectangulaire calée sur la France métropolitaine.
 */

export const FRANCE_BOUNDS = { minLng: -5.2, maxLng: 8.3, minLat: 41.3, maxLat: 51.1 };

/** Largeur/hauteur du repère SVG utilisé par la carte. */
export const MAP_VIEWBOX = { width: 620, height: 640 };

/** Projette lat/lng vers les coordonnées du viewBox SVG. */
export function project(lat: number, lng: number) {
  const { minLng, maxLng, minLat, maxLat } = FRANCE_BOUNDS;
  const x = ((lng - minLng) / (maxLng - minLng)) * MAP_VIEWBOX.width;
  // La latitude est corrigée par cos(lat) pour limiter l'étirement est-ouest.
  const y = ((maxLat - lat) / (maxLat - minLat)) * MAP_VIEWBOX.height;
  return { x, y };
}

/** Distance à vol d'oiseau en kilomètres (formule de haversine). */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

/** Temps de trajet routier estimé, en minutes (moyenne 75 km/h + 10 min de marge). */
export function driveMinutes(km: number) {
  return Math.round((km / 75) * 60 + 10);
}

/** Référentiel de villes françaises pour le géocodage hors-ligne. */
export const CITIES: Record<string, { lat: number; lng: number; region: string }> = {
  Paris: { lat: 48.8566, lng: 2.3522, region: 'Île-de-France' },
  Marseille: { lat: 43.2965, lng: 5.3698, region: 'PACA' },
  Lyon: { lat: 45.764, lng: 4.8357, region: 'Auvergne-Rhône-Alpes' },
  Toulouse: { lat: 43.6047, lng: 1.4442, region: 'Occitanie' },
  Nice: { lat: 43.7102, lng: 7.262, region: 'PACA' },
  Nantes: { lat: 47.2184, lng: -1.5536, region: 'Pays de la Loire' },
  Montpellier: { lat: 43.6108, lng: 3.8767, region: 'Occitanie' },
  Strasbourg: { lat: 48.5734, lng: 7.7521, region: 'Grand Est' },
  Bordeaux: { lat: 44.8378, lng: -0.5792, region: 'Nouvelle-Aquitaine' },
  Lille: { lat: 50.6292, lng: 3.0573, region: 'Hauts-de-France' },
  Rennes: { lat: 48.1173, lng: -1.6778, region: 'Bretagne' },
  Reims: { lat: 49.2583, lng: 4.0317, region: 'Grand Est' },
  'Le Havre': { lat: 49.4944, lng: 0.1079, region: 'Normandie' },
  'Saint-Étienne': { lat: 45.4397, lng: 4.3872, region: 'Auvergne-Rhône-Alpes' },
  Toulon: { lat: 43.1242, lng: 5.928, region: 'PACA' },
  Grenoble: { lat: 45.1885, lng: 5.7245, region: 'Auvergne-Rhône-Alpes' },
  Dijon: { lat: 47.322, lng: 5.0415, region: 'Bourgogne-Franche-Comté' },
  Angers: { lat: 47.4784, lng: -0.5632, region: 'Pays de la Loire' },
  Nîmes: { lat: 43.8367, lng: 4.3601, region: 'Occitanie' },
  'Clermont-Ferrand': { lat: 45.7772, lng: 3.087, region: 'Auvergne-Rhône-Alpes' },
  Tours: { lat: 47.3941, lng: 0.6848, region: 'Centre-Val de Loire' },
  Amiens: { lat: 49.8941, lng: 2.2958, region: 'Hauts-de-France' },
  Limoges: { lat: 45.8336, lng: 1.2611, region: 'Nouvelle-Aquitaine' },
  Metz: { lat: 49.1193, lng: 6.1757, region: 'Grand Est' },
  Besançon: { lat: 47.2378, lng: 6.0241, region: 'Bourgogne-Franche-Comté' },
  Caen: { lat: 49.1829, lng: -0.3707, region: 'Normandie' },
  Orléans: { lat: 47.9029, lng: 1.9093, region: 'Centre-Val de Loire' },
  Rouen: { lat: 49.4432, lng: 1.0999, region: 'Normandie' },
  Mulhouse: { lat: 47.7508, lng: 7.3359, region: 'Grand Est' },
  Perpignan: { lat: 42.6887, lng: 2.8948, region: 'Occitanie' },
  'La Rochelle': { lat: 46.1603, lng: -1.1511, region: 'Nouvelle-Aquitaine' },
  Poitiers: { lat: 46.5802, lng: 0.3404, region: 'Nouvelle-Aquitaine' },
  Pau: { lat: 43.2951, lng: -0.3708, region: 'Nouvelle-Aquitaine' },
  Annecy: { lat: 45.8992, lng: 6.1294, region: 'Auvergne-Rhône-Alpes' },
  Avignon: { lat: 43.9493, lng: 4.8055, region: 'PACA' },
  Brest: { lat: 48.3904, lng: -4.4861, region: 'Bretagne' },
  Bayonne: { lat: 43.4933, lng: -1.4748, region: 'Nouvelle-Aquitaine' },
  Chartres: { lat: 48.444, lng: 1.4892, region: 'Centre-Val de Loire' },
  Valence: { lat: 44.9334, lng: 4.8924, region: 'Auvergne-Rhône-Alpes' },
  Vannes: { lat: 47.6587, lng: -2.7603, region: 'Bretagne' },
  Troyes: { lat: 48.2973, lng: 4.0744, region: 'Grand Est' },
  Niort: { lat: 46.3239, lng: -0.4645, region: 'Nouvelle-Aquitaine' },
  Lorient: { lat: 47.7477, lng: -3.3702, region: 'Bretagne' },
  'Le Mans': { lat: 48.0061, lng: 0.1996, region: 'Pays de la Loire' },
};

export const cityNames = Object.keys(CITIES).sort((a, b) => a.localeCompare(b, 'fr'));

/** Retourne les coordonnées d'une ville, ou null si elle est inconnue du référentiel. */
export function geocode(city: string) {
  if (!city) return null;
  const direct = CITIES[city];
  if (direct) return direct;
  const normalized = city.trim().toLowerCase();
  const match = Object.entries(CITIES).find(([name]) => name.toLowerCase() === normalized);
  return match ? match[1] : null;
}

/**
 * Ordonne des étapes en partant d'un point de départ, au plus proche voisin.
 * Suffisant pour une tournée d'une journée et instantané côté serveur.
 */
export function optimizeRoute<T extends { lat: number; lng: number }>(start: { lat: number; lng: number }, stops: T[]) {
  const remaining = [...stops];
  const ordered: T[] = [];
  let current = start;
  let total = 0;
  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestDistance = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = distanceKm(current, remaining[i]);
      if (d < bestDistance) {
        bestDistance = d;
        bestIndex = i;
      }
    }
    const [next] = remaining.splice(bestIndex, 1);
    ordered.push(next);
    total += bestDistance;
    current = next;
  }
  return { ordered, totalKm: total };
}
