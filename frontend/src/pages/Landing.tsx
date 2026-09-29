import { Link } from 'react-router-dom'
import {
  Kanban,
  Users,
  FileText,
  ShieldCheck,
  ArrowRight,
  Zap,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text'
import { AuroraText } from '@/components/ui/aurora-text'
import { BentoCard, BentoGrid } from '@/components/ui/bento-grid'
import { BlurFade } from '@/components/ui/blur-fade'
import { BorderBeam } from '@/components/ui/border-beam'
import { DotPattern } from '@/components/ui/dot-pattern'
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button'
import { Marquee } from '@/components/ui/marquee'
import { Particles } from '@/components/ui/particles'
import { ShimmerButton } from '@/components/ui/shimmer-button'
import { FlickeringGrid } from '@/components/ui/flickering-grid'

const CAPABILITIES = [
  'JWT + RBAC tenants',
  'Fail-closed WebSocket gate',
  'Kanban position ordering',
  'TipTap / ProseMirror docs',
  'Argon2 auth',
  'Neon Postgres on Vercel',
  '59 pytest cases',
  'Docker Compose proof path',
]

const FEATURES = [
  {
    name: 'Tenant-safe boards',
    description:
      'Workspace membership on every resource path. Non-members get HTTP 403 — not a soft UI hide.',
    href: '/auth/register',
    cta: 'Try the demo',
    className: 'col-span-3 lg:col-span-1',
    Icon: ShieldCheck,
    background: (
      <DotPattern className="absolute inset-0 opacity-40 [mask-image:radial-gradient(300px_circle_at_center,white,transparent)]" />
    ),
  },
  {
    name: 'Ordered Kanban',
    description:
      'Integer positions without the falsy-0 trap. Drag columns that stay consistent under concurrent creates.',
    href: '/auth/register',
    cta: 'Open a board',
    className: 'col-span-3 lg:col-span-2',
    Icon: Kanban,
    background: (
      <Marquee pauseOnHover className="absolute top-8 [--duration:28s] opacity-50">
        {['Backlog', 'In Progress', 'Review', 'Done', 'Blocked'].map((col) => (
          <div
            key={col}
            className="mx-2 w-36 rounded-lg border border-white/10 bg-card/80 p-3 backdrop-blur"
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {col}
            </p>
            <div className="mt-2 space-y-1.5">
              <div className="h-8 rounded-md bg-muted/80" />
              <div className="h-8 rounded-md bg-muted/50" />
            </div>
          </div>
        ))}
      </Marquee>
    ),
  },
  {
    name: 'Realtime path',
    description:
      'Board mutations publish over Redis when configured. Vercel demo uses NullRedis — Compose remains the fanout proof.',
    href: '/auth/register',
    cta: 'See how it works',
    className: 'col-span-3 lg:col-span-2',
    Icon: Users,
    background: (
      <Particles
        className="absolute inset-0"
        quantity={60}
        ease={70}
        color="#5eead4"
        refresh
      />
    ),
  },
  {
    name: 'Linked docs',
    description:
      'TipTap documents with a ProseMirror JSON contract — knowledge next to the work, not in another tab.',
    href: '/auth/register',
    cta: 'Edit a doc',
    className: 'col-span-3 lg:col-span-1',
    Icon: FileText,
    background: (
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(0.55_0.12_175/0.25),transparent_55%)]" />
    ),
  },
]

function BoardScreen() {
  return (
    <div className="flex size-full min-h-full bg-[#0b1118] text-left text-neutral-200">
      <aside className="hidden w-40 shrink-0 flex-col gap-1 border-r border-white/5 bg-black/30 p-3 sm:flex">
        <div className="mb-3 flex items-center gap-2 px-1">
          <div className="flex size-5 items-center justify-center rounded-md bg-brand-600">
            <Zap size={10} className="text-white" />
          </div>
          <span className="truncate text-xs font-semibold">Acme Corp</span>
        </div>
        {['Home', 'Projects', 'Docs', 'Settings'].map((item, i) => (
          <div
            key={item}
            className={cn(
              'rounded-md px-2 py-1.5 text-[11px]',
              i === 1 ? 'bg-brand-500/15 text-brand-300' : 'text-neutral-500'
            )}
          >
            {item}
          </div>
        ))}
      </aside>
      <div className="flex flex-1 gap-2 overflow-hidden p-3">
        {[
          {
            name: 'Backlog',
            cards: ['Dashboard layout', 'CI pipeline'],
          },
          {
            name: 'In Progress',
            cards: ['JWT refresh', 'Kanban DnD'],
          },
          {
            name: 'Review',
            cards: ['Landing redesign'],
          },
        ].map((col) => (
          <div key={col.name} className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500">
                {col.name}
              </span>
              <span className="rounded-full border border-white/10 px-1.5 text-[9px] text-neutral-600">
                {col.cards.length}
              </span>
            </div>
            {col.cards.map((title) => (
              <div
                key={title}
                className="rounded-lg border border-white/10 bg-neutral-900/90 p-2.5 text-[11px] font-medium"
              >
                {title}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Landing() {
  return (
    <div className="dark relative min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* Full-bleed atmosphere */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <FlickerBackdrop />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.45_0.08_185/0.22),transparent_55%)]" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Nav */}
      <header className="relative z-20 px-4 pt-4">
        <BlurFade delay={0.05}>
          <div className="mx-auto flex h-12 max-w-5xl items-center justify-between rounded-2xl border border-white/10 bg-background/70 px-4 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-brand-600 shadow-lg shadow-brand-600/30">
                <Zap size={14} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="font-display text-sm font-extrabold tracking-tight">
                FlowBoard
              </span>
            </div>
            <nav className="flex items-center gap-2">
              <Link
                to="/auth/login"
                className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
              >
                Sign in
              </Link>
              <Link to="/auth/register">
                <InteractiveHoverButton className="h-8 border-white/15 bg-transparent px-4 text-xs">
                  Get started
                </InteractiveHoverButton>
              </Link>
            </nav>
          </div>
        </BlurFade>
      </header>

      {/* Hero — brand first, one headline, one line, CTA, dominant visual */}
      <section className="relative z-10 px-6 pb-10 pt-16 sm:pt-20">
        <div className="mx-auto max-w-4xl text-center">
          <BlurFade delay={0.1}>
            <div className="mb-7 inline-flex items-center justify-center">
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                <AnimatedShinyText className="mx-0 text-xs text-muted-foreground">
                  Multi-tenant workspace · portfolio demo
                </AnimatedShinyText>
              </div>
            </div>
          </BlurFade>

          <BlurFade delay={0.15}>
            <p className="font-display mb-3 text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl md:text-7xl">
              FlowBoard
            </p>
          </BlurFade>

          <BlurFade delay={0.22}>
            <h1 className="font-display mb-5 text-balance text-2xl font-bold tracking-tight text-foreground/90 sm:text-3xl md:text-4xl">
              Ship work in one tenant-safe space.{' '}
              <AuroraText className="font-display font-bold">Together.</AuroraText>
            </h1>
          </BlurFade>

          <BlurFade delay={0.35}>
            <p className="mx-auto mb-8 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
              Boards, docs, and RBAC isolation — built to show fail-closed auth and
              ordered Kanban, not invented traction metrics.
            </p>
          </BlurFade>

          <BlurFade delay={0.45}>
            <div className="mb-14 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/auth/register">
                <ShimmerButton
                  className="shadow-2xl"
                  background="oklch(0.52 0.11 185)"
                  shimmerColor="#ccfbf1"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    Start free workspace
                    <ArrowRight size={15} />
                  </span>
                </ShimmerButton>
              </Link>
              <Link
                to="/auth/login"
                className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
              >
                Sign in
                <ArrowRight size={14} />
              </Link>
            </div>
          </BlurFade>
        </div>

        {/* Dominant product visual */}
        <BlurFade delay={0.55} className="relative mx-auto max-w-5xl">
          <div className="relative rounded-2xl p-px">
            <BorderBeam
              size={140}
              duration={10}
              colorFrom="#5eead4"
              colorTo="#0d9488"
              borderWidth={2}
            />
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#12151c] shadow-2xl shadow-black/50">
              {/* Window chrome */}
              <div className="flex items-center gap-3 border-b border-white/5 bg-black/40 px-4 py-2.5">
                <div className="flex gap-1.5">
                  <div className="size-2.5 rounded-full bg-white/15" />
                  <div className="size-2.5 rounded-full bg-white/15" />
                  <div className="size-2.5 rounded-full bg-white/15" />
                </div>
                <div className="mx-auto flex h-6 w-64 items-center justify-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2">
                  <span className="size-1.5 rounded-full bg-emerald-400/80" />
                  <span className="font-mono text-[10px] text-muted-foreground">
                    app.flowboard.dev/acme/board
                  </span>
                </div>
              </div>
              <div className="h-[280px] sm:h-[340px]">
                <BoardScreen />
              </div>
            </div>
          </div>
        </BlurFade>
      </section>

      {/* Capability marquee — honest capabilities only */}
      <section className="relative z-10 py-10">
        <Marquee pauseOnHover className="[--duration:40s]">
          {CAPABILITIES.map((item) => (
            <div
              key={item}
              className="mx-2 rounded-full border border-white/10 bg-card/40 px-4 py-2 text-xs text-muted-foreground backdrop-blur"
            >
              {item}
            </div>
          ))}
        </Marquee>
      </section>

      {/* Features — one job */}
      <section className="relative z-10 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <BlurFade delay={0.1}>
            <div className="mb-10 max-w-lg">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-400">
                What you can verify
              </p>
              <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Built for the hard parts
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Differentiator is tenant authz and ordering — not another Kanban skin.
              </p>
            </div>
          </BlurFade>
          <BentoGrid>
            {FEATURES.map((f) => (
              <BentoCard key={f.name} {...f} />
            ))}
          </BentoGrid>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="relative z-10 overflow-hidden px-6 py-24">
        <Particles
          className="absolute inset-0"
          quantity={40}
          ease={80}
          color="#99f6e4"
          refresh
        />
        <div className="relative mx-auto max-w-2xl text-center">
          <BlurFade>
            <h2 className="font-display mb-3 text-3xl font-bold tracking-tight sm:text-5xl">
              Ready to flow?
            </h2>
            <p className="mb-8 text-sm text-muted-foreground">
              Create a workspace, move a card, edit a doc — full-stack portfolio demo.
            </p>
            <Link to="/auth/register">
              <ShimmerButton background="oklch(0.52 0.11 185)" shimmerColor="#ccfbf1">
                <span className="text-sm font-semibold">Create your workspace</span>
              </ShimmerButton>
            </Link>
          </BlurFade>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-5 items-center justify-center rounded-md bg-brand-600">
              <Zap size={9} className="text-white" />
            </div>
            <span className="font-display text-xs font-semibold text-muted-foreground">
              FlowBoard
            </span>
          </div>
          <p className="text-xs text-muted-foreground/70">
            UI powered by{' '}
            <a
              href="https://magicui.design"
              className="underline-offset-2 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Magic UI
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

function FlickerBackdrop() {
  return (
    <FlickeringGrid
      className="absolute inset-0 z-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]"
      squareSize={3}
      gridGap={7}
      color="#5eead4"
      maxOpacity={0.12}
      flickerChance={0.12}
    />
  )
}
