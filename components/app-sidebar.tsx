'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building2, Users, Target, Briefcase, FileText, Megaphone, MessageSquare, ListTodo, BarChart3, Route, ClipboardCheck, Crown, Settings } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { GlobalSearchTrigger } from '@/components/global-search';

const spaces = [
  { href: '/commercial', label: 'Commercial', icon: Route, hint: 'Tournées & portefeuille' },
  { href: '/adv', label: 'ADV', icon: ClipboardCheck, hint: 'Devis & commandes' },
  { href: '/dirigeant', label: 'Dirigeant', icon: Crown, hint: 'Pilotage & équipe' },
];

const items = [
  { href: '/', label: 'Priorités', icon: LayoutDashboard },
  { href: '/comptes', label: 'Comptes', icon: Building2 },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/leads', label: 'Leads', icon: Target },
  { href: '/affaires', label: 'Affaires', icon: Briefcase },
  { href: '/devis', label: 'Devis', icon: FileText },
  { href: '/campagnes', label: 'Campagnes', icon: Megaphone },
  { href: '/interactions', label: 'Interactions', icon: MessageSquare },
  { href: '/taches', label: 'Tâches', icon: ListTodo },
  { href: '/rapports', label: 'Rapports', icon: BarChart3 },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar side="left">
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-3 px-2 py-1" aria-label="NOVELYS accueil">
          <span className="brand-mark flex size-9 shrink-0 items-center justify-center rounded-md">
            <img src="/novelys-mark.png" alt="" className="size-7 object-contain" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-widest">NOVELYS</span>
            <small className="text-[10px] tracking-wide text-muted-foreground">CRM · FULL ACE</small>
          </span>
        </Link>
        <GlobalSearchTrigger />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Espaces métier</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {spaces.map(({ href, label, icon: Icon, hint }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton asChild isActive={pathname === href} className="space-link">
                    <Link href={href}>
                      <Icon />
                      <span className="space-link-text">
                        <span>{label}</span>
                        <small>{hint}</small>
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton asChild isActive={pathname === href}>
                    <Link href={href}>
                      <Icon />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Configuration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/parametres'}>
                  <Link href="/parametres">
                    <Settings />
                    <span>Paramètres</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-3 px-2 py-1 text-sm">
          <span className="avatar owner flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
            FA
          </span>
          <span className="text-muted-foreground">GROUPE FULL ACE</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
