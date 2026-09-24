'use server';

import { globalSearch, type SearchResult } from '@/lib/search';

export async function searchAction(query: string): Promise<SearchResult[]> {
  return globalSearch(query);
}
