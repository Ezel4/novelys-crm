import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// One client per server instance; Supabase's transaction pooler does not support prepared statements.
let db: ReturnType<typeof createDatabase> | undefined;

function createDatabase(url: string) {
  return drizzle(postgres(url, { prepare: false, max: 5 }), { schema });
}

export function database() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Base indisponible');
  db ??= createDatabase(url);
  return db;
}
