import { type FormEvent, type ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Clock3,
  CloudRain,
  Command,
  Compass,
  FileWarning,
  Fuel,
  Gauge,
  Globe2,
  HardHat,
  LayoutDashboard,
  LifeBuoy,
  Map as MapIcon,
  Menu,
  MessageSquareWarning,
  Navigation,
  Package,
  Radio,
  RefreshCw,
  Route as RouteIcon,
  Settings2,
  ShieldAlert,
  Siren,
  SlidersHorizontal,
  Truck,
  Users,
  Wifi,
  WifiOff,
  X,
  Zap,
} from 'lucide-react';
import {
  getGetDashboardQueryKey,
  getListAlertsQueryKey,
  getListIncidentsQueryKey,
  useActionAlert,
  useCalculateRoutes,
  useCreateIncident,
  useCreateMission,
  useGetAnalytics,
  useGetDashboard,
  useHealthCheck,
  useListAlerts,
  useListDeliveries,
  useListDistricts,
  useListIncidents,
  useListVehicles,
  useResetSimulation,
  useSimulateDisruption,
} from '@workspace/api-client-react';
import NotFound from '@/pages/not-found';
import { Route, Switch, Link, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

const navItems = [
  { href: '/', label: 'Command center', icon: LayoutDashboard },
  { href: '/routes', label: 'Routes', icon: RouteIcon },
  { href: '/fleet', label: 'Fleet', icon: Truck },
  { href: '/supplies', label: 'Supplies', icon: Package },
  { href: '/incidents', label: 'Incidents', icon: ShieldAlert },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

const operationalItems = [
  { href: '/emergency', label: 'Emergency mode', icon: Siren },
  { href: '/field', label: 'Field mode', icon: Radio },
  { href: '/settings', label: 'Settings', icon: Settings2 },
];

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

function formatTime(value?: string) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function toneClass(tone?: string) {
  const normalized = (tone || '').toLowerCase();
  if (normalized.includes('critical') || normalized.includes('red')) return 'critical';
  if (normalized.includes('warning') || normalized.includes('amber') || normalized.includes('high')) return 'warning';
  if (normalized.includes('success') || normalized.includes('green') || normalized.includes('stable')) return 'good';
  return 'info';
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {eyebrow}
        </div>
        <h1 className="text-3xl font-extrabold tracking-[-0.04em] text-foreground md:text-[38px]">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

function Button({ children, className, variant = 'primary', onClick, disabled, type = 'button', testId }: { children: ReactNode; className?: string; variant?: 'primary' | 'quiet' | 'danger' | 'outline'; onClick?: () => void; disabled?: boolean; type?: 'button' | 'submit'; testId?: string }) {
  return (
    <button data-testid={testId} type={type} disabled={disabled} onClick={onClick} className={cn(
      'inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-bold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50',
      variant === 'primary' && 'bg-primary text-primary-foreground shadow-[0_5px_0_hsl(var(--primary)/.2)] hover:-translate-y-0.5',
      variant === 'quiet' && 'bg-secondary text-secondary-foreground hover:bg-secondary/70',
      variant === 'outline' && 'border border-border bg-card text-foreground hover:border-primary/50 hover:bg-secondary/50',
      variant === 'danger' && 'bg-destructive text-destructive-foreground hover:brightness-105',
      className,
    )}>{children}</button>
  );
}

function Badge({ children, tone = 'info' }: { children: ReactNode; tone?: string }) {
  const palette = toneClass(tone);
  return <span className={cn('status-badge', palette)}>{children}</span>;
}

function Card({ children, className, title, subtitle, action, testId }: { children: ReactNode; className?: string; title?: string; subtitle?: string; action?: ReactNode; testId?: string }) {
  return (
    <section data-testid={testId} className={cn('rounded-lg border border-card-border bg-card shadow-[0_10px_26px_hsl(198_35%_15%/.035)]', className)}>
      {(title || subtitle || action) && <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4">
        <div>
          {title && <h2 className="text-[13px] font-extrabold uppercase tracking-[0.09em] text-foreground">{title}</h2>}
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>}
      {children}
    </section>
  );
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-secondary/80', className)} />;
}

function QueryState({ loading, error, onRetry, children }: { loading?: boolean; error?: boolean; onRetry?: () => void; children: ReactNode }) {
  if (loading) return <div className="grid gap-3"><Skeleton className="h-28" /><Skeleton className="h-40" /></div>;
  if (error) return <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center"><FileWarning className="mx-auto mb-3 text-destructive" size={26} /><p className="font-bold">Operational data unavailable</p><p className="mt-1 text-sm text-muted-foreground">The command center could not reach the data service.</p>{onRetry && <Button variant="outline" onClick={onRetry} className="mt-4" testId="button-retry-query">Retry connection</Button>}</div>;
  return <>{children}</>;
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [location] = useLocation();
  const health = useHealthCheck();
  return (
    <aside className={cn('fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:translate-x-0', open ? 'translate-x-0' : '-translate-x-full')}>
      <div className="flex h-[78px] items-center justify-between border-b border-sidebar-border px-6">
        <Link href="/" data-testid="link-brand" className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded bg-sidebar-primary text-sidebar-primary-foreground"><Command size={20} strokeWidth={2.5} /></div>
          <div><div className="text-[15px] font-extrabold tracking-[0.14em]">DOR NER</div><div className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-sidebar-accent-foreground">Resilience grid</div></div>
        </Link>
        <button data-testid="button-close-nav" onClick={onClose} className="rounded p-1 text-sidebar-foreground/60 hover:bg-sidebar-accent lg:hidden"><X size={18} /></button>
      </div>
      <div className="px-4 pt-6">
        <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/45">Operations</div>
        <nav className="space-y-1">
          {navItems.map((item) => { const Icon = item.icon; const active = location === item.href; return <Link key={item.href} href={item.href} onClick={onClose} data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`} className={cn('group flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-semibold transition', active ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground')}><Icon size={17} /><span>{item.label}</span>{item.href === '/alerts' && <span className={cn('ml-auto h-5 min-w-5 rounded px-1.5 text-center text-[10px] leading-5', active ? 'bg-sidebar-primary-foreground/15' : 'bg-accent text-accent-foreground')}>4</span>}</Link>; })}
        </nav>
        <div className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/45">Response tools</div>
        <nav className="space-y-1">
          {operationalItems.map((item) => { const Icon = item.icon; const active = location === item.href; return <Link key={item.href} href={item.href} onClick={onClose} data-testid={`link-nav-${item.label.toLowerCase().replaceAll(' ', '-')}`} className={cn('flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-semibold transition', active ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground')}><Icon size={17} /><span>{item.label}</span></Link>; })}
        </nav>
      </div>
      <div className="mt-auto border-t border-sidebar-border p-4">
        <div className="mb-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.15em] text-sidebar-foreground/45"><span>System status</span><span className="font-mono text-sidebar-accent-foreground">{health.data?.status === 'ok' ? 'nominal' : 'standby'}</span></div>
        <div className="rounded-md border border-sidebar-border bg-sidebar-accent/50 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold"><span className="animate-pulse-dot h-2 w-2 rounded-full bg-sidebar-primary" /> Regional network online</div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-sidebar-foreground/45"><span>Last heartbeat</span><span className="font-mono">00:00:12</span></div>
        </div>
        <div className="mt-4 flex items-center gap-3"><div className="grid h-8 w-8 place-items-center rounded-full bg-sidebar-primary/15 text-xs font-extrabold text-sidebar-accent-foreground">AK</div><div className="min-w-0"><div className="truncate text-xs font-bold">A. K. Sharma</div><div className="truncate text-[10px] text-sidebar-foreground/45">Regional operations lead</div></div><ChevronDown size={15} className="ml-auto text-sidebar-foreground/45" /></div>
      </div>
    </aside>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const [mobileNav, setMobileNav] = useState(false);
  const [location] = useLocation();
  const title = navItems.concat(operationalItems).find((item) => item.href === location)?.label || 'Command center';
  return (
    <div className="noise min-h-[100dvh] bg-background">
      <Sidebar open={mobileNav} onClose={() => setMobileNav(false)} />
      {mobileNav && <button aria-label="Close navigation" data-testid="button-nav-scrim" onClick={() => setMobileNav(false)} className="fixed inset-0 z-30 bg-sidebar/45 lg:hidden" />}
      <main className="min-h-[100dvh] lg:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-[70px] items-center justify-between border-b border-border/80 bg-background/90 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3"><button data-testid="button-open-nav" onClick={() => setMobileNav(true)} className="rounded-md border border-border bg-card p-2 lg:hidden"><Menu size={18} /></button><div className="hidden text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground md:block">Regional operations / <span className="text-foreground">{title}</span></div><div className="text-xs font-bold md:hidden">{title}</div></div>
          <div className="flex items-center gap-3"><div className="hidden items-center gap-2 text-[11px] font-semibold text-muted-foreground sm:flex"><span className="h-2 w-2 rounded-full bg-primary" /> Live feed <span className="font-mono">08:42 IST</span></div><Link href="/alerts" data-testid="link-header-alerts" className="relative rounded-md border border-border bg-card p-2 text-muted-foreground hover:text-foreground"><Bell size={17} /><span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-extrabold text-accent-foreground">4</span></Link><Link href="/emergency" data-testid="link-header-emergency" className="inline-flex h-9 items-center gap-2 rounded-md bg-destructive px-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-destructive-foreground"><Siren size={14} /> <span className="hidden sm:inline">Emergency mode</span></Link></div>
        </header>
        <div className="mx-auto max-w-[1600px] p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}

function MapPanel({ map }: { map?: any }) {
  const states = map?.states || [];
  const vehicles = map?.vehicles || [];
  const incidents = map?.incidents || [];
  const hubs = map?.hubs || [];
  return (
    <div className="map-contour relative h-[390px] overflow-hidden rounded-b-lg border-t border-border/70 md:h-[445px]">
      <div className="grid-lines absolute inset-0 opacity-40" />
      <svg className="absolute inset-0 h-full w-full opacity-60" viewBox="0 0 1000 600" preserveAspectRatio="none">
        <path d="M110 80 C230 120, 310 40, 410 130 S580 330, 690 260 S840 190, 920 330" fill="none" stroke="hsl(163 64% 34% / .65)" strokeWidth="4" strokeDasharray="12 8" />
        <path d="M55 420 C210 350, 310 480, 470 370 S680 290, 930 480" fill="none" stroke="hsl(37 91% 55% / .75)" strokeWidth="3" strokeDasharray="7 10" />
        <path d="M180 80 L420 500 M390 80 L770 430 M750 100 L570 510" fill="none" stroke="hsl(199 37% 25% / .17)" strokeWidth="2" />
      </svg>
      <div className="absolute left-5 top-5 rounded-md border border-border/70 bg-card/85 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] backdrop-blur"><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-primary" /> NER network view</div><div className="mt-1 font-mono text-muted-foreground">06 states / 18 corridors</div></div>
      <div className="absolute right-4 top-4 flex flex-col gap-1 rounded-md border border-border/70 bg-card/85 p-1 backdrop-blur"><button data-testid="button-map-zoom-in" className="grid h-7 w-7 place-items-center text-sm font-bold hover:bg-secondary">+</button><button data-testid="button-map-zoom-out" className="grid h-7 w-7 place-items-center border-t border-border text-sm font-bold hover:bg-secondary">−</button></div>
      {states.map((state: any, index: number) => <div key={state.name || index} data-testid={`map-state-${state.shortName || index}`} className="absolute -translate-x-1/2 -translate-y-1/2 text-center" style={{ left: `${Math.max(10, Math.min(90, state.x || (18 + index * 13)))}%`, top: `${Math.max(15, Math.min(85, state.y || (25 + (index % 3) * 25)))}%` }}><div className={cn('mx-auto h-3 w-3 rounded-full border-2 border-card shadow-sm', toneClass(state.status) === 'critical' ? 'bg-destructive' : toneClass(state.status) === 'warning' ? 'bg-accent' : 'bg-primary')} /><span className="mt-1 block text-[10px] font-extrabold tracking-wide text-foreground/75">{state.shortName}</span></div>)}
      {hubs.map((hub: any, index: number) => <div key={hub.name || index} data-testid={`map-hub-${index}`} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${hub.x || 22 + index * 25}%`, top: `${hub.y || 70 - index * 12}%` }}><div className="grid h-7 w-7 place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow"><Package size={13} /></div></div>)}
      {vehicles.slice(0, 8).map((vehicle: any, index: number) => <div key={vehicle.id || index} data-testid={`map-vehicle-${vehicle.id || index}`} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${vehicle.x || 30 + index * 8}%`, top: `${vehicle.y || 35 + (index % 4) * 11}%` }}><div className="grid h-5 w-5 place-items-center rounded-full border border-card bg-foreground text-background"><Truck size={10} /></div></div>)}
      {incidents.slice(0, 6).map((incident: any, index: number) => <div key={incident.id || index} data-testid={`map-incident-${incident.id || index}`} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${incident.x || 40 + index * 8}%`, top: `${incident.y || 24 + index * 9}%` }}><div className="animate-pulse-dot grid h-6 w-6 place-items-center rounded-full border border-card bg-destructive text-destructive-foreground"><AlertTriangle size={12} /></div></div>)}
      <div className="absolute bottom-4 left-4 flex flex-wrap gap-3 rounded-md border border-border/70 bg-card/90 px-3 py-2 text-[10px] font-semibold backdrop-blur"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-primary" /> Stable</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-accent" /> Watch</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-destructive" /> Incident</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-foreground" /> Vehicle</span></div>
      <div className="absolute bottom-4 right-4 hidden rounded-md border border-border/70 bg-card/90 px-3 py-2 text-[10px] font-mono text-muted-foreground backdrop-blur md:block">SOURCE: DOR NER TELEMETRY · 08:42:16 IST</div>
    </div>
  );
}

function KpiStrip({ kpis }: { kpis?: any }) {
  const values = [{ label: 'Accessibility', value: `${kpis?.accessibility ?? 94.6}%`, icon: Globe2, tone: 'good' }, { label: 'Active vehicles', value: kpis?.activeVehicles ?? 42, icon: Truck, tone: 'info' }, { label: 'Deliveries in motion', value: kpis?.deliveries ?? 128, icon: Package, tone: 'info' }, { label: 'Critical deliveries', value: kpis?.criticalDeliveries ?? 7, icon: AlertTriangle, tone: 'warning' }, { label: 'Risk corridors', value: kpis?.riskCorridors ?? 3, icon: RouteIcon, tone: 'critical' }, { label: 'Avg. delay', value: `${kpis?.averageDelay ?? 21} min`, icon: Clock3, tone: 'warning' }];
  return <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3 xl:grid-cols-6">{values.map((item) => { const Icon = item.icon; return <div key={item.label} data-testid={`kpi-${item.label.toLowerCase().replaceAll(' ', '-')}`} className="bg-card px-4 py-4"><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{item.label}</span><Icon size={15} className={cn(item.tone === 'critical' ? 'text-destructive' : item.tone === 'warning' ? 'text-accent-foreground' : item.tone === 'good' ? 'text-primary' : 'text-muted-foreground')} /></div><div className="mt-2 text-2xl font-extrabold tracking-[-0.05em]">{item.value}</div><div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-primary"><ArrowDownRight size={12} className="rotate-180" /> live snapshot</div></div>; })}</div>;
}

function Home() {
  const dashboardQuery = useGetDashboard();
  const simulate = useSimulateDisruption();
  const reset = useResetSimulation();
  const queryClient = useQueryClient();
  const [simulation, setSimulation] = useState<any>(null);
  const dashboard = simulation?.dashboard || dashboardQuery.data;
  const runSimulation = () => simulate.mutate(undefined, { onSuccess: (result) => { setSimulation(result); queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() }); } });
  const resetSimulation = () => reset.mutate(undefined, { onSuccess: () => { setSimulation(null); queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() }); } });
  return <QueryState loading={dashboardQuery.isLoading} error={dashboardQuery.isError} onRetry={() => dashboardQuery.refetch()}><div className="animate-rise">
    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary"><span className="animate-pulse-dot h-2 w-2 rounded-full bg-primary" /> Regional command center <Badge tone={dashboard?.mode === 'disruption' ? 'critical' : 'good'}>{dashboard?.mode === 'disruption' ? 'SIMULATION ACTIVE' : 'LIVE / BASELINE'}</Badge></div><h1 className="mt-2 text-3xl font-extrabold tracking-[-0.05em] md:text-[42px]">Read the region.<br /><span className="text-primary">Move what matters.</span></h1><p className="mt-2 text-sm text-muted-foreground">North Eastern Region · operational snapshot at {formatTime(dashboard?.updatedAt) || '08:42 IST'}</p></div><div className="flex gap-2">{dashboard?.mode === 'disruption' ? <Button variant="quiet" disabled={reset.isPending} onClick={resetSimulation} testId="button-reset-simulation"><RefreshCw size={15} /> {reset.isPending ? 'Restoring…' : 'Reset baseline'}</Button> : <Button variant="danger" disabled={simulate.isPending} onClick={runSimulation} testId="button-run-simulation"><Zap size={15} /> {simulate.isPending ? 'Running model…' : 'Simulate Manipur rainfall'}</Button>}</div></div>
    {simulation?.headline && <div data-testid="simulation-headline" className="mb-5 flex items-start gap-3 rounded-lg border border-accent/50 bg-accent/10 p-4"><Zap size={18} className="mt-0.5 text-accent-foreground" /><div><div className="text-[11px] font-extrabold uppercase tracking-[0.13em] text-accent-foreground">Model output · simulation data</div><div className="mt-1 text-sm font-bold">{simulation.headline}</div><div className="mt-2 flex flex-wrap gap-2">{(simulation.chain || []).map((step: string, index: number) => <span key={step} className="rounded bg-card/70 px-2 py-1 text-xs text-muted-foreground">{index + 1}. {step}</span>)}</div></div></div>}
    <KpiStrip kpis={dashboard?.kpis} />
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.5fr_1fr]"><Card title="Live regional picture" subtitle="Corridors, hubs, incidents and vehicle positions" action={<span className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-primary"><span className="h-2 w-2 rounded-full bg-primary" /> Updating</span>} testId="card-live-map"><MapPanel map={dashboard?.map} /></Card><PredictionPanel predictions={dashboard?.predictions} /></div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_1fr_1fr]"><SupplyRiskPanel risks={dashboard?.supplyRisks} /><ActivityPanel activity={dashboard?.activity} /><ImpactPanel impact={dashboard?.impact} /></div>
  </div></QueryState>;
}

function PredictionPanel({ predictions }: { predictions?: any[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const items = predictions || [];
  return <Card title="Risk intelligence" subtitle="Explainable predictions · next 24 hours" action={<Link href="/routes" data-testid="link-view-routes" className="text-[11px] font-bold text-primary hover:underline">View routes <ArrowRight className="inline" size={13} /></Link>} testId="card-risk-intelligence"><div className="divide-y divide-border/70">{items.length ? items.slice(0, 4).map((item) => <div key={item.id} className="px-5 py-4" data-testid={`prediction-${item.id}`}><div className="flex items-start gap-3"><div className={cn('mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md', toneClass(item.level) === 'critical' ? 'bg-destructive/10 text-destructive' : 'bg-accent/15 text-accent-foreground')}><CloudRain size={16} /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="text-sm font-bold">{item.title}</div><Badge tone={item.level}>{item.level}</Badge></div><div className="mt-1 text-xs text-muted-foreground">{item.corridor} · {item.window} · <span className="font-mono">{item.probability}% probability</span></div><button data-testid={`button-expand-prediction-${item.id}`} onClick={() => setExpanded(expanded === item.id ? null : item.id)} className="mt-2 text-[11px] font-bold text-primary">{expanded === item.id ? 'Hide rationale' : 'Explain decision'} <ChevronDown size={12} className={cn('inline transition-transform', expanded === item.id && 'rotate-180')} /></button>{expanded === item.id && <div className="mt-3 rounded-md bg-secondary/60 p-3 text-xs leading-5"><div className="font-bold">Factors</div><ul className="mt-1 list-inside list-disc text-muted-foreground">{(item.factors || []).map((factor: string) => <li key={factor}>{factor}</li>)}</ul><div className="mt-2 font-bold">Recommendation</div><p className="text-muted-foreground">{item.recommendation}</p><div className="mt-2 font-bold">Fallback</div><p className="text-muted-foreground">{item.alternative}</p></div>}</div></div></div>) : <EmptyState label="No active predictions" compact />}</div></Card>;
}

function SupplyRiskPanel({ risks }: { risks?: any[] }) {
  return <Card title="Supply under watch" subtitle="Stock cover and next movement" action={<Link href="/supplies" data-testid="link-view-supplies" className="text-[11px] font-bold text-primary hover:underline">District view <ArrowRight className="inline" size={13} /></Link>} testId="card-supply-risks"><div className="divide-y divide-border/70">{(risks || []).slice(0, 4).map((risk, index) => <div key={`${risk.district}-${risk.item}`} data-testid={`supply-risk-${index}`} className="px-5 py-3.5"><div className="flex items-center justify-between gap-3"><div><div className="text-sm font-bold">{risk.item}</div><div className="mt-0.5 text-[11px] text-muted-foreground">{risk.district} · inbound {risk.incomingEta}</div></div><Badge tone={risk.risk}>{risk.daysRemaining}d cover</Badge></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary"><div className={cn('h-full rounded-full', risk.daysRemaining <= 3 ? 'bg-destructive' : risk.daysRemaining <= 7 ? 'bg-accent' : 'bg-primary')} style={{ width: `${Math.min(100, risk.daysRemaining * 10)}%` }} /></div></div>)}{!risks?.length && <EmptyState label="No supply risks reported" compact />}</div></Card>;
}

function ActivityPanel({ activity }: { activity?: any[] }) {
  return <Card title="Activity log" subtitle="Latest decisions and field signals" testId="card-activity"><div className="divide-y divide-border/70">{(activity || []).slice(0, 5).map((event) => <div key={event.id} className="flex gap-3 px-5 py-3"><div className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', toneClass(event.tone) === 'critical' ? 'bg-destructive' : toneClass(event.tone) === 'warning' ? 'bg-accent' : 'bg-primary')} /><div className="min-w-0"><div className="text-xs font-bold">{event.title}</div><div className="mt-0.5 text-[11px] leading-4 text-muted-foreground">{event.detail}</div><div className="mt-1 font-mono text-[9px] text-muted-foreground/70">{event.time}</div></div></div>)}{!activity?.length && <EmptyState label="No recent activity" compact />}</div></Card>;
}

function ImpactPanel({ impact }: { impact?: any }) {
  return <Card title="Resilience impact" subtitle="What the network has protected" testId="card-impact"><div className="grid grid-cols-2 gap-px bg-border">{[{ label: 'Deliveries protected', value: impact?.deliveriesProtected ?? 0, icon: Package }, { label: 'Vehicles rerouted', value: impact?.vehiclesRerouted ?? 0, icon: Navigation }, { label: 'Risk avoided', value: impact?.riskAvoided ?? '—', icon: ShieldAlert }, { label: 'Response time', value: impact?.responseTime ?? '—', icon: Clock3 }].map((item) => { const Icon = item.icon; return <div key={item.label} className="bg-card p-4"><Icon size={15} className="text-primary" /><div className="mt-2 text-lg font-extrabold">{item.value}</div><div className="mt-1 text-[10px] font-semibold leading-4 text-muted-foreground">{item.label}</div></div>; })}</div></Card>;
}

function EmptyState({ label, compact = false }: { label: string; compact?: boolean }) {
  return <div className={cn('text-center text-sm text-muted-foreground', compact ? 'px-5 py-8' : 'p-14')}><CircleDot className="mx-auto mb-2 opacity-40" size={22} /><div>{label}</div></div>;
}

function RoutesPage() {
  const deliveries = useListDeliveries();
  const calculate = useCalculateRoutes();
  const [form, setForm] = useState({ origin: 'Guwahati hub', destination: 'Imphal district hospital', cargo: 'Essential medicines', quantity: '480', priority: 'critical', vehicleType: 'All-terrain truck' });
  const [selected, setSelected] = useState<string>('');
  const options = calculate.data || [];
  const run = (event: FormEvent) => { event.preventDefault(); calculate.mutate({ data: { ...form, quantity: Number(form.quantity) } }, { onSuccess: (result) => setSelected(result.find((route: any) => route.recommended)?.id || result[0]?.id || '') }); };
  return <div className="animate-rise"><PageHeader eyebrow="Route intelligence" title="Choose the route you can explain." description="Compare weather, terrain and accessibility factors before every high-priority movement." action={<Badge tone="good">MODEL ONLINE</Badge>} /><div className="grid gap-5 lg:grid-cols-[330px_1fr]"><Card title="Calculate options" subtitle="Transparent inputs" testId="card-route-inputs"><form onSubmit={run} className="space-y-4 p-5">{[['origin', 'Origin'], ['destination', 'Destination'], ['cargo', 'Cargo type'], ['quantity', 'Quantity']].map(([key, label]) => <label key={key} className="block"><span className="field-label">{label}</span><input data-testid={`input-route-${key}`} required value={form[key as keyof typeof form]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} type={key === 'quantity' ? 'number' : 'text'} className="field-input" /></label>)}<label className="block"><span className="field-label">Priority</span><select data-testid="select-route-priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="field-input"><option value="critical">Critical</option><option value="high">High</option><option value="standard">Standard</option></select></label><label className="block"><span className="field-label">Vehicle type</span><select data-testid="select-route-vehicle-type" value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })} className="field-input"><option>All-terrain truck</option><option>Medium truck</option><option>Light utility vehicle</option></select></label><Button type="submit" disabled={calculate.isPending} className="w-full" testId="button-calculate-routes"><RouteIcon size={15} /> {calculate.isPending ? 'Calculating…' : 'Calculate route options'}</Button><p className="text-[10px] leading-4 text-muted-foreground">Uses current road, rainfall and incident intelligence. Route scores are advisory, not a replacement for field confirmation.</p></form></Card><div><Card title="Route options" subtitle={`${options.length || (deliveries.data?.length ? '3' : 'No')} transparent options returned`} action={<div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground"><SlidersHorizontal size={14} /> SORT: SCORE</div>} testId="card-route-options"><QueryState loading={calculate.isPending} error={calculate.isError} onRetry={() => calculate.reset()}>{options.length ? <div className="divide-y divide-border/70">{options.map((route: any) => <RouteOptionRow key={route.id} route={route} selected={selected === route.id} onSelect={() => setSelected(route.id)} />)}</div> : <div className="p-10 text-center"><Compass className="mx-auto mb-3 text-primary" size={28} /><p className="font-bold">Set an origin and destination</p><p className="mt-1 text-sm text-muted-foreground">Run the model to see a ranked comparison with the rationale behind every score.</p></div>}</QueryState></Card><div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground"><Activity size={13} className="text-primary" /> {deliveries.data?.length || 0} deliveries currently informing route context · DEMO / SIMULATION DATA</div></div></div></div>;
}

function RouteOptionRow({ route, selected, onSelect }: { route: any; selected: boolean; onSelect: () => void }) {
  return <button data-testid={`button-select-route-${route.id}`} onClick={onSelect} className={cn('block w-full text-left transition hover:bg-secondary/35', selected && 'bg-primary/[.045]')}><div className="grid gap-4 px-5 py-5 md:grid-cols-[1fr_115px_115px_100px] md:items-center"><div><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-extrabold">{route.name}</span>{route.recommended && <Badge tone="good">RECOMMENDED</Badge>}{selected && <Badge tone="info">SELECTED</Badge>}</div><p className="mt-1 text-xs text-muted-foreground">{route.explanation?.[0] || 'Balanced accessibility and hazard exposure.'}</p><div className="mt-3 flex flex-wrap gap-2">{(route.explanation || []).slice(0, 3).map((point: string) => <span key={point} className="rounded bg-secondary px-2 py-1 text-[10px] font-semibold text-muted-foreground">{point}</span>)}</div></div><Metric label="ETA" value={route.eta} /><Metric label="Access" value={`${route.accessibility}%`} /><div><div className="text-[10px] font-bold uppercase text-muted-foreground">Risk</div><div className={cn('mt-1 text-sm font-extrabold', toneClass(route.overallRisk) === 'critical' ? 'text-destructive' : toneClass(route.overallRisk) === 'warning' ? 'text-accent-foreground' : 'text-primary')}>{route.overallRisk}</div><div className="mt-1 h-1.5 overflow-hidden rounded bg-secondary"><div className="h-full bg-primary" style={{ width: `${route.score || 70}%` }} /></div></div></div></button>;
}

function Metric({ label, value }: { label: string; value: ReactNode }) { return <div><div className="text-[10px] font-bold uppercase text-muted-foreground">{label}</div><div className="mt-1 text-sm font-extrabold">{value}</div></div>; }

function FleetPage() {
  const query = useListVehicles();
  const vehicles = query.data || [];
  const [filter, setFilter] = useState('all');
  const shown = vehicles.filter((v: any) => filter === 'all' || v.status?.toLowerCase() === filter);
  return <QueryState loading={query.isLoading} error={query.isError} onRetry={() => query.refetch()}><div className="animate-rise"><PageHeader eyebrow="Fleet status" title="Every vehicle has a job." description="Live movement, fuel and risk context for the regional vehicle pool." action={<Button variant="outline" onClick={() => query.refetch()} testId="button-refresh-fleet"><RefreshCw size={15} /> Refresh telemetry</Button>} /><div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><StatTile label="In transit" value={vehicles.filter((v: any) => v.status?.toLowerCase().includes('transit') || v.status?.toLowerCase().includes('active')).length || 24} icon={Navigation} /><StatTile label="Available" value={vehicles.filter((v: any) => v.status?.toLowerCase().includes('available')).length || 8} icon={CheckCircle2} /><StatTile label="At risk" value={vehicles.filter((v: any) => toneClass(v.risk) === 'critical' || toneClass(v.risk) === 'warning').length || 5} icon={AlertTriangle} tone="warning" /><StatTile label="Fuel watch" value={`${Math.round(vehicles.reduce((sum: number, v: any) => sum + (v.fuel || 76), 0) / (vehicles.length || 1))}%`} icon={Fuel} /></div><Card className="mt-5" title="Vehicle register" subtitle="Telemetry refreshes every 60 seconds" action={<div className="flex gap-1 rounded-md bg-secondary p-1">{['all', 'active', 'available'].map((item) => <button data-testid={`button-fleet-filter-${item}`} key={item} onClick={() => setFilter(item)} className={cn('rounded px-3 py-1.5 text-[10px] font-bold uppercase', filter === item ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}>{item}</button>)}</div>} testId="card-fleet-register"><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Vehicle / operator</th><th>Movement</th><th>Load</th><th>Fuel</th><th>ETA</th><th>State</th></tr></thead><tbody>{shown.map((vehicle: any) => <tr key={vehicle.id} data-testid={`row-vehicle-${vehicle.id}`}><td><div className="font-bold">{vehicle.id}</div><div className="mt-1 text-[11px] text-muted-foreground">{vehicle.type} · {vehicle.driver}</div></td><td><div className="flex items-center gap-1.5 text-xs font-semibold">{vehicle.origin} <ArrowRight size={13} className="text-primary" /> {vehicle.destination}</div><div className="mt-1 text-[10px] text-muted-foreground">{vehicle.speed || 0} km/h</div></td><td><div className="text-xs font-bold">{vehicle.cargo}</div><div className="mt-1 text-[10px] text-muted-foreground">{vehicle.capacity || 0} capacity</div></td><td><div className="flex items-center gap-2 text-xs font-bold"><div className="h-1.5 w-14 overflow-hidden rounded bg-secondary"><div className={cn('h-full', (vehicle.fuel || 70) < 30 ? 'bg-destructive' : 'bg-primary')} style={{ width: `${vehicle.fuel || 70}%` }} /></div>{vehicle.fuel || 70}%</div></td><td className="font-mono text-xs">{vehicle.eta || '—'}</td><td><Badge tone={vehicle.risk || vehicle.status}>{vehicle.risk || vehicle.status || 'Nominal'}</Badge></td></tr>)}</tbody></table>{!shown.length && <EmptyState label="No vehicles match this filter" />}</div></Card></div></QueryState>;
}

function StatTile({ label, value, icon: Icon, tone }: { label: string; value: ReactNode; icon: any; tone?: string }) { return <div className="rounded-lg border border-border bg-card p-4"><Icon size={17} className={tone === 'warning' ? 'text-accent-foreground' : 'text-primary'} /><div className="mt-3 text-2xl font-extrabold tracking-[-.05em]">{value}</div><div className="mt-1 text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground">{label}</div></div>; }

function SuppliesPage() {
  const query = useListDistricts();
  const districts = query.data || [];
  const [search, setSearch] = useState('');
  const shown = districts.filter((d: any) => `${d.name} ${d.state}`.toLowerCase().includes(search.toLowerCase()));
  return <QueryState loading={query.isLoading} error={query.isError} onRetry={() => query.refetch()}><div className="animate-rise"><PageHeader eyebrow="District supply intelligence" title="Know the cover before it becomes a shortage." description="District-level stock, access and weather signals for essential goods across the region." action={<div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-[11px] font-bold"><Package size={15} className="text-primary" /> {districts.length || 8} districts monitored</div>} /><div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div className="flex flex-wrap gap-2"><Badge tone="critical">2 critical cover</Badge><Badge tone="warning">4 on watch</Badge><Badge tone="good">Network access 94.6%</Badge></div><input data-testid="input-search-districts" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search district or state" className="field-input max-w-xs" /></div><Card title="District register" subtitle="Stock cover is calculated against current consumption rate" testId="card-district-register"><div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-3">{shown.map((district: any) => <div key={district.id} data-testid={`card-district-${district.id}`} className="bg-card p-5 transition hover:bg-secondary/25"><div className="flex items-start justify-between gap-3"><div><div className="text-base font-extrabold">{district.name}</div><div className="mt-1 text-[11px] text-muted-foreground">{district.state} · population {Number(district.population || 0).toLocaleString('en-IN')}</div></div><Badge tone={district.risk}>{district.risk || 'stable'}</Badge></div><div className="mt-5 grid grid-cols-3 gap-3"><Metric label="Supply cover" value={`${district.daysOfSupply ?? '—'}d`} /><Metric label="Access" value={`${district.accessibility ?? '—'}%`} /><Metric label="Incidents" value={district.activeIncidents ?? 0} /></div><div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><CloudRain size={14} className="text-primary" /> {district.weather || 'Weather normal'}</div>{district.criticalNeeds?.length > 0 && <div className="mt-3 border-t border-border pt-3"><div className="text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground">Critical needs</div><div className="mt-2 flex flex-wrap gap-1.5">{district.criticalNeeds.map((need: string) => <span key={need} className="rounded bg-accent/15 px-2 py-1 text-[10px] font-bold text-accent-foreground">{need}</span>)}</div></div>}</div>)}</div>{!shown.length && <EmptyState label="No districts match your search" />}</Card></div></QueryState>;
}

function IncidentsPage() {
  const query = useListIncidents();
  const create = useCreateIncident();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: 'Landslide', district: 'Imphal West', road: 'NH-2 / Senapati approach', severity: 'high', description: '' });
  const submit = (event: FormEvent) => { event.preventDefault(); create.mutate({ data: form }, { onSuccess: () => { setOpen(false); setForm({ ...form, description: '' }); client.invalidateQueries({ queryKey: getListIncidentsQueryKey() }); client.invalidateQueries({ queryKey: getGetDashboardQueryKey() }); } }); };
  return <QueryState loading={query.isLoading} error={query.isError} onRetry={() => query.refetch()}><div className="animate-rise"><PageHeader eyebrow="Incident command" title="Turn a field signal into a decision." description="Track active disruptions, coordinate follow-up, and keep the operational picture honest." action={<Button onClick={() => setOpen(true)} testId="button-open-incident-form"><MessageSquareWarning size={15} /> Report incident</Button>} /><div className="grid gap-5 lg:grid-cols-[1fr_330px]"><Card title="Active incident register" subtitle={`${query.data?.length || 0} field reports requiring attention`} testId="card-incidents"><div className="divide-y divide-border/70">{(query.data || []).map((incident: any) => <div key={incident.id} data-testid={`row-incident-${incident.id}`} className="p-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div className="flex gap-3"><div className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-md', toneClass(incident.severity) === 'critical' ? 'bg-destructive/10 text-destructive' : 'bg-accent/15 text-accent-foreground')}><AlertTriangle size={17} /></div><div><div className="flex flex-wrap items-center gap-2"><span className="font-bold">{incident.type}</span><Badge tone={incident.severity}>{incident.severity}</Badge><Badge tone={incident.status}>{incident.status}</Badge></div><div className="mt-1 text-xs text-muted-foreground">{incident.district} · {incident.road}</div><p className="mt-3 max-w-2xl text-sm leading-5">{incident.description}</p></div></div><div className="font-mono text-[10px] text-muted-foreground">{formatTime(incident.timestamp)}</div></div></div>)}{!query.data?.length && <EmptyState label="No active incidents. Field picture is clear." />}</div></Card><Card title="Command guidance" subtitle="Response posture" testId="card-incident-guidance"><div className="space-y-3 p-5"><div className="rounded-md border-l-2 border-accent bg-accent/10 p-3 text-xs leading-5"><div className="font-bold">Validate before escalating</div><p className="mt-1 text-muted-foreground">Every field report should carry a district, road and severity so routing decisions remain explainable.</p></div><div className="rounded-md border-l-2 border-primary bg-primary/5 p-3 text-xs leading-5"><div className="font-bold">Use field mode offline</div><p className="mt-1 text-muted-foreground">Capture first. Sync when a network window opens.</p></div><Link href="/field" data-testid="link-open-field-mode" className="flex items-center justify-between border-t border-border pt-4 text-xs font-bold text-primary">Open field mode <ArrowRight size={14} /></Link></div></Card></div>{open && <IncidentDialog form={form} setForm={setForm} onClose={() => setOpen(false)} onSubmit={submit} pending={create.isPending} />}</div></QueryState>;
}

function IncidentDialog({ form, setForm, onClose, onSubmit, pending }: { form: any; setForm: (value: any) => void; onClose: () => void; onSubmit: (event: FormEvent) => void; pending: boolean }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-sidebar/50 p-4"><div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-lg border border-border bg-card shadow-2xl"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><div className="text-[11px] font-bold uppercase tracking-[.15em] text-primary">Field reporting</div><h2 className="mt-1 text-lg font-extrabold">New incident report</h2></div><button data-testid="button-close-incident-form" onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-secondary"><X size={18} /></button></div><form onSubmit={onSubmit} className="space-y-4 p-5"><div className="grid gap-4 sm:grid-cols-2"><label><span className="field-label">Type</span><select data-testid="select-incident-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="field-input"><option>Landslide</option><option>Flooding</option><option>Road damage</option><option>Weather closure</option><option>Security</option></select></label><label><span className="field-label">Severity</span><select data-testid="select-incident-severity" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className="field-input"><option>low</option><option>moderate</option><option>high</option><option>critical</option></select></label></div><label><span className="field-label">District</span><input data-testid="input-incident-district" required value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className="field-input" /></label><label><span className="field-label">Road / corridor</span><input data-testid="input-incident-road" required value={form.road} onChange={(e) => setForm({ ...form, road: e.target.value })} className="field-input" /></label><label><span className="field-label">Description</span><textarea data-testid="textarea-incident-description" required minLength={8} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What is blocked, where, and what is the immediate effect?" className="field-input min-h-24 resize-y" /></label><div className="flex justify-end gap-2 pt-2"><Button variant="quiet" onClick={onClose} testId="button-cancel-incident">Cancel</Button><Button type="submit" disabled={pending} testId="button-submit-incident">{pending ? 'Submitting…' : 'Submit report'}</Button></div></form></div></div>;
}

function AlertsPage() {
  const query = useListAlerts();
  const action = useActionAlert();
  const client = useQueryClient();
  const [tab, setTab] = useState('open');
  const alerts = (query.data || []).filter((alert: any) => tab === 'open' ? !['resolved', 'closed'].includes(alert.status?.toLowerCase()) : ['resolved', 'closed'].includes(alert.status?.toLowerCase()));
  const act = (id: string, actionName: 'acknowledge' | 'assign' | 'escalate' | 'resolve') => action.mutate({ id, data: { action: actionName } }, { onSuccess: () => client.invalidateQueries({ queryKey: getListAlertsQueryKey() }) });
  return <QueryState loading={query.isLoading} error={query.isError} onRetry={() => query.refetch()}><div className="animate-rise"><PageHeader eyebrow="Actionable alerts" title="The queue is a conversation, not a siren." description="Acknowledge what is seen, assign what needs ownership, and resolve what is truly closed." action={<Badge tone="warning">{alerts.length} requiring action</Badge>} /><Card title="Alert queue" subtitle="Prioritized by operational consequence" action={<div className="flex gap-1 rounded-md bg-secondary p-1"><button data-testid="button-alerts-open" onClick={() => setTab('open')} className={cn('rounded px-3 py-1.5 text-[10px] font-bold uppercase', tab === 'open' ? 'bg-card shadow-sm' : 'text-muted-foreground')}>Active</button><button data-testid="button-alerts-history" onClick={() => setTab('history')} className={cn('rounded px-3 py-1.5 text-[10px] font-bold uppercase', tab === 'history' ? 'bg-card shadow-sm' : 'text-muted-foreground')}>History</button></div>} testId="card-alert-queue"><div className="divide-y divide-border/70">{alerts.map((alert: any) => <div key={alert.id} data-testid={`row-alert-${alert.id}`} className="p-5"><div className="flex flex-col gap-4 md:flex-row md:items-start"><div className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-md', toneClass(alert.severity) === 'critical' ? 'bg-destructive/10 text-destructive' : toneClass(alert.severity) === 'warning' ? 'bg-accent/15 text-accent-foreground' : 'bg-primary/10 text-primary')}><Bell size={16} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-bold">{alert.title}</span><Badge tone={alert.severity}>{alert.severity}</Badge><Badge tone={alert.status}>{alert.status}</Badge></div><p className="mt-2 text-sm leading-5 text-muted-foreground">{alert.message}</p><div className="mt-2 font-mono text-[10px] text-muted-foreground">{formatTime(alert.createdAt)} · {alert.id}</div></div><div className="flex shrink-0 flex-wrap gap-2">{(alert.actions || ['acknowledge', 'assign', 'resolve']).map((actionName: string) => <button key={actionName} data-testid={`button-alert-${actionName}-${alert.id}`} disabled={action.isPending} onClick={() => act(alert.id, actionName as 'acknowledge' | 'assign' | 'escalate' | 'resolve')} className="rounded border border-border px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide hover:border-primary hover:text-primary">{actionName}</button>)}</div></div></div>)}{!alerts.length && <EmptyState label={tab === 'open' ? 'No active alerts. The queue is clear.' : 'No resolved alerts in the current history.'} />}</div></Card></div></QueryState>;
}

function AnalyticsPage() {
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');
  const query = useGetAnalytics({ range });
  const analytics: any = query.data || {};
  const metrics = [{ label: 'Delivery success', value: analytics.deliverySuccess, suffix: '%', target: 100, icon: CheckCircle2 }, { label: 'Route reliability', value: analytics.routeReliability, suffix: '%', target: 100, icon: RouteIcon }, { label: 'Network utilization', value: analytics.utilization, suffix: '%', target: 100, icon: Gauge }, { label: 'Avg. response time', value: analytics.responseTime, suffix: ' min', target: 60, icon: Clock3 }, { label: 'Average delay', value: analytics.averageDelay, suffix: ' min', target: 60, icon: Clock3 }, { label: 'Open shortages', value: analytics.shortages, suffix: '', target: 20, icon: Package }]; return <QueryState loading={query.isLoading} error={query.isError} onRetry={() => query.refetch()}><div className="animate-rise"><PageHeader eyebrow="Operational analytics" title="Measure the decisions, not just the movement." description="Read system performance over time, then use the signal to adjust posture." action={<div className="flex gap-1 rounded-md border border-border bg-card p-1">{(['7d', '30d', '90d'] as const).map((item) => <button key={item} data-testid={`button-analytics-${item}`} onClick={() => setRange(item)} className={cn('rounded px-3 py-2 text-[11px] font-bold', range === item ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>{item}</button>)}</div>} /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{metrics.map((metric) => { const Icon = metric.icon; const value = metric.value ?? '—'; const pct = typeof metric.value === 'number' ? Math.min(100, (metric.value / metric.target) * 100) : 0; return <div key={metric.label} data-testid={`analytics-${metric.label.toLowerCase().replaceAll(' ', '-')}`} className="rounded-lg border border-border bg-card p-5"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[.1em] text-muted-foreground">{metric.label}</span><Icon size={16} className="text-primary" /></div><div className="mt-4 text-3xl font-extrabold tracking-[-.06em]">{value}{value !== '—' && <span className="text-base text-muted-foreground">{metric.suffix}</span>}</div><div className="mt-4 h-1.5 overflow-hidden rounded bg-secondary"><div className={cn('h-full rounded', metric.label.includes('delay') || metric.label.includes('shortage') ? 'bg-accent' : 'bg-primary')} style={{ width: `${pct}%` }} /></div><div className="mt-2 text-[10px] font-semibold text-muted-foreground">Compared with previous {range}</div></div>; })}</div><Card className="mt-5" title="Operational readout" subtitle={`Rolling window · ${range} · DEMO / SIMULATION DATA`} testId="card-analytics-readout"><div className="grid gap-5 p-5 md:grid-cols-3"><div className="rounded-md bg-primary/5 p-4"><div className="text-[10px] font-bold uppercase tracking-[.12em] text-primary">Strong signal</div><p className="mt-2 text-sm font-bold">Accessibility remains the network’s leading advantage.</p></div><div className="rounded-md bg-accent/10 p-4"><div className="text-[10px] font-bold uppercase tracking-[.12em] text-accent-foreground">Watch signal</div><p className="mt-2 text-sm font-bold">Response time and delay widen together on weather days.</p></div><div className="rounded-md bg-destructive/5 p-4"><div className="text-[10px] font-bold uppercase tracking-[.12em] text-destructive">Decision cue</div><p className="mt-2 text-sm font-bold">Protect routes before stock cover drops below seven days.</p></div></div></Card></div></QueryState>;
}

function EmergencyPage() {
  const create = useCreateMission();
  const [created, setCreated] = useState<any>(null);
  const [form, setForm] = useState({ mission: 'Essential medicine replenishment', destination: 'Churachandpur district hospital', cargo: 'Medical supplies', quantity: '320', deadline: 'Within 18 hours', priority: 'critical' });
  const submit = (event: FormEvent) => { event.preventDefault(); create.mutate({ data: { ...form, quantity: Number(form.quantity) } }, { onSuccess: setCreated }); };
  return <div className="animate-rise"><div className="mb-7 overflow-hidden rounded-lg bg-sidebar p-6 text-sidebar-foreground md:p-8"><div className="flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.18em] text-sidebar-accent-foreground"><span className="animate-pulse-dot h-2 w-2 rounded-full bg-accent" /> Restricted response workspace</div><h1 className="mt-3 text-3xl font-extrabold tracking-[-.05em] md:text-[42px]">Emergency mode.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-sidebar-foreground/65">Create a mission with a clear destination, cargo, deadline and priority. The network will return a vehicle and route posture.</p></div><div className="rounded-md border border-sidebar-border bg-sidebar-accent/70 px-4 py-3"><div className="text-[10px] font-bold uppercase tracking-[.13em] text-sidebar-foreground/50">Posture</div><div className="mt-1 flex items-center gap-2 text-sm font-bold"><span className="h-2 w-2 rounded-full bg-accent" /> Ready to deploy</div></div></div></div><div className="grid gap-5 lg:grid-cols-[1fr_360px]"><Card title="Create emergency mission" subtitle="Every field is required for dispatch" testId="card-create-mission"><form onSubmit={submit} className="grid gap-4 p-5 sm:grid-cols-2"><label className="sm:col-span-2"><span className="field-label">Mission title</span><input data-testid="input-mission-title" required value={form.mission} onChange={(e) => setForm({ ...form, mission: e.target.value })} className="field-input" /></label><label><span className="field-label">Destination</span><input data-testid="input-mission-destination" required value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} className="field-input" /></label><label><span className="field-label">Cargo</span><input data-testid="input-mission-cargo" required value={form.cargo} onChange={(e) => setForm({ ...form, cargo: e.target.value })} className="field-input" /></label><label><span className="field-label">Quantity</span><input data-testid="input-mission-quantity" required type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="field-input" /></label><label><span className="field-label">Deadline</span><select data-testid="select-mission-deadline" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="field-input"><option>Within 6 hours</option><option>Within 12 hours</option><option>Within 18 hours</option><option>Within 24 hours</option></select></label><label><span className="field-label">Priority</span><select data-testid="select-mission-priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="field-input"><option>critical</option><option>high</option><option>standard</option></select></label><div className="flex items-end sm:col-span-2"><Button type="submit" disabled={create.isPending} testId="button-create-mission"><Siren size={15} /> {create.isPending ? 'Building mission…' : 'Create mission'}</Button></div></form></Card><Card title="Dispatch checklist" subtitle="Before you commit" testId="card-dispatch-checklist"><div className="space-y-4 p-5">{['Destination has active district coverage', 'Cargo is matched to a supply risk', 'A primary and backup route are available', 'Field contact can confirm handover'].map((item) => <div key={item} className="flex items-center gap-3 text-sm"><span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-primary"><Check size={13} /></span>{item}</div>)}</div></Card></div>{created && <Card className="mt-5 border-primary/40" title="Mission created" subtitle="Dispatch recommendation returned by the network" testId="card-created-mission"><div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4"><Metric label="Mission" value={created.mission} /><Metric label="Vehicle" value={created.vehicle} /><Metric label="Primary route" value={created.route} /><Metric label="ETA / risk" value={`${created.eta} · ${created.risk}`} /></div><div className="border-t border-border px-5 py-4 text-xs text-muted-foreground">Backup route: <span className="font-bold text-foreground">{created.backupRoute}</span> · status <span className="font-bold text-primary">{created.status}</span></div></Card>}</div>;
}

function FieldPage() {
  const create = useCreateIncident();
  const client = useQueryClient();
  const [online, setOnline] = useState(true);
  const [saved, setSaved] = useState(0);
  const [form, setForm] = useState({ type: 'Road damage', district: '', road: '', severity: 'moderate', description: '' });
  const submit = (event: FormEvent) => { event.preventDefault(); if (!online) { setSaved(saved + 1); setForm({ ...form, description: '' }); return; } create.mutate({ data: form }, { onSuccess: () => { setSaved(saved + 1); setForm({ ...form, description: '' }); client.invalidateQueries({ queryKey: getListIncidentsQueryKey() }); } }); };
  return <div className="mx-auto max-w-3xl animate-rise"><div className="mb-6 flex items-center justify-between"><div><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.18em] text-primary"><Radio size={14} /> Field mode</div><h1 className="mt-2 text-3xl font-extrabold tracking-[-.05em]">Capture first. Sync when ready.</h1></div><button data-testid="button-toggle-field-network" onClick={() => setOnline(!online)} className={cn('flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-bold', online ? 'border-primary/30 bg-primary/5 text-primary' : 'border-accent/40 bg-accent/10 text-accent-foreground')}>{online ? <Wifi size={15} /> : <WifiOff size={15} />} {online ? 'Online' : 'Offline'}</button></div><div className="mb-5 grid grid-cols-3 gap-2"><div className="rounded-md border border-border bg-card p-3"><div className="text-[10px] font-bold uppercase text-muted-foreground">Connection</div><div className="mt-2 text-sm font-extrabold">{online ? 'Good' : 'No network'}</div></div><div className="rounded-md border border-border bg-card p-3"><div className="text-[10px] font-bold uppercase text-muted-foreground">Pending sync</div><div className="mt-2 text-sm font-extrabold">{online ? 0 : saved}</div></div><div className="rounded-md border border-border bg-card p-3"><div className="text-[10px] font-bold uppercase text-muted-foreground">Reports today</div><div className="mt-2 text-sm font-extrabold">{saved + 6}</div></div></div><Card title="New field report" subtitle={online ? 'Report will be sent to regional command immediately.' : 'Report will be held locally and synced when connection returns.'} testId="card-field-report"><form onSubmit={submit} className="space-y-5 p-5"><div className="grid gap-4 sm:grid-cols-2"><label><span className="field-label">Incident type</span><select data-testid="select-field-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="field-input"><option>Road damage</option><option>Landslide</option><option>Flooding</option><option>Weather closure</option><option>Security</option></select></label><label><span className="field-label">Severity</span><select data-testid="select-field-severity" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className="field-input"><option>low</option><option>moderate</option><option>high</option><option>critical</option></select></label></div><div className="grid gap-4 sm:grid-cols-2"><label><span className="field-label">District</span><input data-testid="input-field-district" required value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} placeholder="Current district" className="field-input" /></label><label><span className="field-label">Road / landmark</span><input data-testid="input-field-road" required value={form.road} onChange={(e) => setForm({ ...form, road: e.target.value })} placeholder="NH-2 near..." className="field-input" /></label></div><label><span className="field-label">What do you see?</span><textarea data-testid="textarea-field-description" required minLength={8} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the condition, passability and immediate supply impact." className="field-input min-h-36 resize-y" /></label><div className="flex items-center justify-between border-t border-border pt-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><HardHat size={15} className="text-primary" /> GPS and photo capture available on device</div><Button type="submit" disabled={create.isPending} testId="button-submit-field-report">{online ? 'Submit field report' : 'Save for sync'} <ArrowRight size={15} /></Button></div></form></Card><div className="mt-4 rounded-md border border-accent/40 bg-accent/10 p-4 text-xs leading-5 text-accent-foreground"><div className="font-bold">Field safety note</div><div className="mt-1">Do not approach unstable slopes or floodwater to improve a report. A low-confidence signal is safer than a preventable injury.</div></div></div>;
}

function SettingsPage() {
  const [role, setRole] = useState('Regional operations lead');
  const [language, setLanguage] = useState('English');
  const [demo, setDemo] = useState(true);
  const [saved, setSaved] = useState(false);
  return <div className="animate-rise"><PageHeader eyebrow="Workspace settings" title="Make the cockpit yours." description="Choose the operating context, language and data posture for this workspace." /><div className="grid gap-5 lg:grid-cols-[1fr_330px]"><Card title="Role and language" subtitle="These preferences stay on this device" testId="card-settings-preferences"><div className="space-y-5 p-5"><label><span className="field-label">Operational role</span><select data-testid="select-settings-role" value={role} onChange={(e) => setRole(e.target.value)} className="field-input"><option>Regional operations lead</option><option>District coordinator</option><option>Fleet controller</option><option>Field responder</option></select></label><label><span className="field-label">Interface language</span><select data-testid="select-settings-language" value={language} onChange={(e) => setLanguage(e.target.value)} className="field-input"><option>English</option><option>Assamese</option><option>Manipuri</option><option>Bengali</option><option>Hindi</option></select></label><div className="flex items-center justify-between rounded-md border border-border p-4"><div><div className="text-sm font-bold">Show demo data labels</div><div className="mt-1 text-xs text-muted-foreground">Keep simulation context visible in every view.</div></div><button data-testid="button-toggle-demo-labels" onClick={() => setDemo(!demo)} className={cn('relative h-6 w-11 rounded-full transition', demo ? 'bg-primary' : 'bg-secondary')}><span className={cn('absolute top-1 h-4 w-4 rounded-full bg-card transition', demo ? 'left-6' : 'left-1')} /></button></div><Button onClick={() => setSaved(true)} testId="button-save-settings">{saved ? <><Check size={15} /> Saved</> : 'Save preferences'}</Button></div></Card><Card title="Workspace facts" subtitle="Current session" testId="card-settings-facts"><div className="divide-y divide-border/70">{[['Region', 'North Eastern Region'], ['Time zone', 'IST · UTC+05:30'], ['Data posture', demo ? 'DEMO / SIMULATION DATA' : 'LIVE DATA'], ['Build', 'DOR-NER 0.1.0']].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 px-5 py-4 text-xs"><span className="text-muted-foreground">{label}</span><span className="text-right font-bold">{value}</span></div>)}</div></Card></div></div>;
}

function MobileQuickNav() { return <div className="mb-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">{navItems.slice(0, 5).map((item) => <Link key={item.href} href={item.href} data-testid={`link-mobile-${item.label.toLowerCase().replaceAll(' ', '-')}`} className="shrink-0 rounded-md border border-border bg-card px-3 py-2 text-[11px] font-bold">{item.label}</Link>)}</div>; }

function Router() {
  return <RoutedErrorBoundary><Shell><MobileQuickNav /><Switch><Route path="/" component={Home} /><Route path="/routes" component={RoutesPage} /><Route path="/fleet" component={FleetPage} /><Route path="/supplies" component={SuppliesPage} /><Route path="/incidents" component={IncidentsPage} /><Route path="/alerts" component={AlertsPage} /><Route path="/analytics" component={AnalyticsPage} /><Route path="/emergency" component={EmergencyPage} /><Route path="/field" component={FieldPage} /><Route path="/settings" component={SettingsPage} /><Route component={NotFound} /></Switch></Shell></RoutedErrorBoundary>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;