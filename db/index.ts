import { env } from 'cloudflare:workers';
export function database(){if(!env.DB)throw new Error('Base indisponible');return env.DB;}
