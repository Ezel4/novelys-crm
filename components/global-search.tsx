'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Users, Briefcase, Target, ListTodo, Search } from 'lucide-react';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { searchAction } from '@/app/search/actions';
import type { SearchResult } from '@/lib/search';

const icons = { compte: Building2, contact: Users, affaire: Briefcase, lead: Target, tache: ListTodo } as const;
const groupLabels = { compte: 'Comptes', contact: 'Contacts', affaire: 'Affaires', lead: 'Leads', tache: 'Tâches' } as const;

export function GlobalSearchTrigger() {
  return (
    <button
      type="button"
      className="global-search-trigger"
      onClick={() => document.dispatchEvent(new CustomEvent('novelys:open-search'))}
      aria-label="Rechercher"
    >
      <Search size={16} />
      <span>Rechercher</span>
      <kbd>Ctrl K</kbd>
    </button>
  );
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    function onOpenRequest() {
      setOpen(true);
    }
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('novelys:open-search', onOpenRequest);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('novelys:open-search', onOpenRequest);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      startTransition(async () => {
        setResults(query.length >= 2 ? await searchAction(query) : []);
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [query, open]);

  function handleOpenChange(v: boolean) {
    setOpen(v);
    if (!v) setQuery('');
  }

  const grouped = (Object.keys(groupLabels) as (keyof typeof groupLabels)[])
    .map((type) => ({ type, items: results.filter((r) => r.type === type) }))
    .filter((g) => g.items.length);

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange} title="Recherche" description="Rechercher un compte, contact, affaire, lead ou tâche">
        <CommandInput placeholder="Rechercher un compte, contact, affaire, lead, tâche…" value={query} onValueChange={setQuery} />
        <CommandList>
          {query.length >= 2 && !results.length && <CommandEmpty>Aucun résultat.</CommandEmpty>}
          {grouped.map((g) => {
            const Icon = icons[g.type];
            return (
              <CommandGroup key={g.type} heading={groupLabels[g.type]}>
                {g.items.map((item) => (
                  <CommandItem
                    key={g.type + item.id}
                    value={g.type + item.id + item.label}
                    onSelect={() => {
                      setOpen(false);
                      router.push(item.href);
                    }}
                  >
                    <Icon />
                    <span>{item.label}</span>
                    <span className="text-muted-foreground ml-auto text-xs">{item.sublabel}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            );
          })}
      </CommandList>
    </CommandDialog>
  );
}
