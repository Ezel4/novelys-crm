'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { MapPin, Route, Clock, Navigation, CalendarDays } from 'lucide-react';
import { project, MAP_VIEWBOX, distanceKm, driveMinutes } from '@/lib/geo';
import { FRANCE_OUTLINE, CORSICA_OUTLINE, REGION_HINTS } from '@/lib/france-outline';
import { money, dayLabel } from '@/lib/dashboard';

export type MapStop = {
  id: string;
  label: string;
  city: string;
  lat: number;
  lng: number;
  date: string;
  startTime: string;
  durationMin: number;
  purpose: string;
  status: string;
  accountId: string | null;
  accountName: string | null;
  contactName: string | null;
  dealAmount: number;
  notes: string;
};

export type MapBase = { city: string; lat: number; lng: number };

const purposeColors: Record<string, string> = {
  'Découverte': '#7c5cf0',
  'Relance': '#d98324',
  'Présentation devis': '#1947d1',
  'Signature': '#1f9d6b',
  'Suivi livraison': '#4a9fd8',
};

function toPath(points: [number, number][]) {
  return points
    .map(([lng, lat], i) => {
      const { x, y } = project(lat, lng);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export function TourMap({ stops, base }: { stops: MapStop[]; base: MapBase }) {
  const dates = useMemo(() => [...new Set(stops.map((s) => s.date))].sort(), [stops]);
  const [activeDate, setActiveDate] = useState<string>('all');
  const [selected, setSelected] = useState<string | null>(null);

  const visible = useMemo(
    () => (activeDate === 'all' ? stops : stops.filter((s) => s.date === activeDate)),
    [stops, activeDate]
  );

  /** L'itinéraire ne se trace que pour une journée précise : une semaine entière n'a pas de tracé lisible. */
  const route = useMemo(() => {
    if (activeDate === 'all') return null;
    const ordered = [...visible].sort((a, b) => a.startTime.localeCompare(b.startTime));
    let previous = { lat: base.lat, lng: base.lng };
    let total = 0;
    const legs = ordered.map((stop) => {
      const km = distanceKm(previous, stop);
      total += km;
      previous = { lat: stop.lat, lng: stop.lng };
      return { stop, km, minutes: driveMinutes(km) };
    });
    const backHome = distanceKm(previous, base);
    return { legs, total: total + backHome, backHome, ordered };
  }, [visible, activeDate, base]);

  const basePoint = project(base.lat, base.lng);
  const selectedStop = visible.find((s) => s.id === selected) ?? null;

  const totalVisitMinutes = visible.reduce((s, v) => s + v.durationMin, 0);
  const pipelineOnRoute = visible.reduce((s, v) => s + v.dealAmount, 0);

  return (
    <section className="panel tour-map-panel">
      <div className="panel-title">
        <h2>
          <Route size={16} /> Carte des tournées
        </h2>
        <div className="tour-date-filter">
          <button
            type="button"
            className={activeDate === 'all' ? 'active' : ''}
            onClick={() => {
              setActiveDate('all');
              setSelected(null);
            }}
          >
            Toutes
          </button>
          {dates.map((d) => (
            <button
              key={d}
              type="button"
              className={activeDate === d ? 'active' : ''}
              onClick={() => {
                setActiveDate(d);
                setSelected(null);
              }}
            >
              {dayLabel(d)}
            </button>
          ))}
        </div>
      </div>

      <div className="tour-map-grid">
        <div className="tour-map-canvas">
          <svg
            viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
            role="img"
            aria-label={`Carte de France avec ${visible.length} étape${visible.length > 1 ? 's' : ''} de tournée`}
          >
            <defs>
              <linearGradient id="landFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#eef2fb" />
                <stop offset="100%" stopColor="#e2e9f7" />
              </linearGradient>
            </defs>

            <path d={`${toPath(FRANCE_OUTLINE)} Z`} className="map-land" fill="url(#landFill)" />
            <path d={`${toPath(CORSICA_OUTLINE)} Z`} className="map-land" fill="url(#landFill)" />
            {REGION_HINTS.map((line, i) => (
              <path key={i} d={toPath(line)} className="map-region-hint" />
            ))}

            {/* Itinéraire du jour sélectionné */}
            {route && route.ordered.length > 0 && (
              <g className="map-route">
                <path
                  d={[
                    `M${basePoint.x.toFixed(1)},${basePoint.y.toFixed(1)}`,
                    ...route.ordered.map((s) => {
                      const p = project(s.lat, s.lng);
                      return `L${p.x.toFixed(1)},${p.y.toFixed(1)}`;
                    }),
                    `L${basePoint.x.toFixed(1)},${basePoint.y.toFixed(1)}`,
                  ].join(' ')}
                />
              </g>
            )}

            {/* Point de départ */}
            <g className="map-base" transform={`translate(${basePoint.x.toFixed(1)},${basePoint.y.toFixed(1)})`}>
              <circle r="9" />
              <circle r="4" className="map-base-core" />
              <text y="-15">{base.city}</text>
            </g>

            {/* Étapes */}
            {visible.map((stop) => {
              const p = project(stop.lat, stop.lng);
              const order = route?.ordered.findIndex((s) => s.id === stop.id) ?? -1;
              const isSelected = selected === stop.id;
              return (
                <g
                  key={stop.id}
                  className={`map-stop${isSelected ? ' selected' : ''}${stop.status === 'Annulée' ? ' cancelled' : ''}`}
                  transform={`translate(${p.x.toFixed(1)},${p.y.toFixed(1)})`}
                  onClick={() => setSelected(isSelected ? null : stop.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${stop.accountName ?? stop.label} à ${stop.city}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelected(isSelected ? null : stop.id);
                    }
                  }}
                >
                  <circle r={isSelected ? 13 : 10} fill={purposeColors[stop.purpose] ?? '#1947d1'} />
                  {order >= 0 ? (
                    <text className="map-stop-order" dy="4">
                      {order + 1}
                    </text>
                  ) : (
                    <circle r="3" fill="#fff" />
                  )}
                  <text className="map-stop-label" y={-17}>
                    {stop.city}
                  </text>
                </g>
              );
            })}
          </svg>

          <ul className="map-legend">
            {Object.entries(purposeColors).map(([purpose, color]) => (
              <li key={purpose}>
                <span className="legend-dot" style={{ background: color }} /> {purpose}
              </li>
            ))}
          </ul>
        </div>

        <div className="tour-map-side">
          <div className="tour-stats">
            <div className="tour-stat">
              <span className="tour-stat-label">Étapes</span>
              <strong>{visible.length}</strong>
            </div>
            <div className="tour-stat">
              <span className="tour-stat-label">Distance</span>
              <strong>{route ? `${route.total} km` : '—'}</strong>
            </div>
            <div className="tour-stat">
              <span className="tour-stat-label">Temps sur place</span>
              <strong>
                {Math.floor(totalVisitMinutes / 60)} h {String(totalVisitMinutes % 60).padStart(2, '0')}
              </strong>
            </div>
            <div className="tour-stat">
              <span className="tour-stat-label">Pipe visité</span>
              <strong>{money(pipelineOnRoute)}</strong>
            </div>
          </div>

          {selectedStop ? (
            <div className="tour-detail">
              <div className="tour-detail-head">
                <span className="tour-chip" style={{ background: purposeColors[selectedStop.purpose] ?? '#1947d1' }}>
                  {selectedStop.purpose}
                </span>
                <button type="button" className="tour-detail-close" onClick={() => setSelected(null)}>
                  Fermer
                </button>
              </div>
              <h3>{selectedStop.accountName ?? selectedStop.label}</h3>
              <p className="tour-detail-meta">
                <MapPin size={13} /> {selectedStop.city} · <CalendarDays size={13} /> {dayLabel(selectedStop.date)}
                {selectedStop.startTime ? ` à ${selectedStop.startTime}` : ''} · <Clock size={13} />{' '}
                {selectedStop.durationMin} min
              </p>
              {selectedStop.contactName && (
                <p className="tour-detail-contact">Interlocuteur : {selectedStop.contactName}</p>
              )}
              {selectedStop.dealAmount > 0 && (
                <p className="tour-detail-amount">Affaire en jeu : {money(selectedStop.dealAmount)}</p>
              )}
              {selectedStop.notes && <p className="tour-detail-notes">{selectedStop.notes}</p>}
              {selectedStop.accountId && (
                <Link className="tour-detail-link" href={`/comptes/${selectedStop.accountId}`}>
                  Ouvrir la fiche compte
                </Link>
              )}
            </div>
          ) : route ? (
            <ol className="tour-legs">
              <li className="tour-leg start">
                <span className="tour-leg-marker">
                  <Navigation size={13} />
                </span>
                <div>
                  <strong>Départ · {base.city}</strong>
                  <small>Début de tournée</small>
                </div>
              </li>
              {route.legs.map(({ stop, km, minutes }, i) => (
                <li key={stop.id}>
                  <span className="tour-leg-marker" style={{ background: purposeColors[stop.purpose] ?? '#1947d1' }}>
                    {i + 1}
                  </span>
                  <div>
                    <strong>{stop.accountName ?? stop.label}</strong>
                    <small>
                      {stop.city} · {km} km · {minutes} min de route
                      {stop.startTime ? ` · arrivée prévue ${stop.startTime}` : ''}
                    </small>
                  </div>
                </li>
              ))}
              <li className="tour-leg end">
                <span className="tour-leg-marker">
                  <Navigation size={13} />
                </span>
                <div>
                  <strong>Retour · {base.city}</strong>
                  <small>
                    {route.backHome} km · {driveMinutes(route.backHome)} min
                  </small>
                </div>
              </li>
            </ol>
          ) : (
            <div className="tour-hint">
              <p>Sélectionnez une journée pour afficher l’itinéraire optimisé et le détail des trajets.</p>
              <ul className="tour-upcoming">
                {stops.slice(0, 6).map((s) => (
                  <li key={s.id}>
                    <span className="tour-dot" style={{ background: purposeColors[s.purpose] ?? '#1947d1' }} />
                    <div>
                      <strong>{s.accountName ?? s.label}</strong>
                      <small>
                        {dayLabel(s.date)} · {s.city} · {s.purpose}
                      </small>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
