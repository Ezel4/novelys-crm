import { env } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export function database() {
  if (!env.DB) throw new Error('Base indisponible');
  return drizzle(env.DB, { schema });
}
