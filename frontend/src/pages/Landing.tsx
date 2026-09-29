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
import { BentoCard, BentoGrid } from '@/components/ui/bento-grid'
import { BlurFade } from '@/components/ui/blur-fade'
import { BorderBeam } from '@/components/ui/border-beam'
import { DotPattern } from '@/components/ui/dot-pattern'
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button'
import { Marquee } from '@/components/ui/marquee'
import { ShimmerButton } from '@/components/ui/shimmer-button'

const CAPABILITIES = [
  'JWT + RBAC tenants',
  'Fail-closed WebSocket gate',
  'Kanban position ordering',
  'TipTap / ProseMirror docs',
  'Argon2 auth',
  'Neon Postgres on Vercel',
  'Pytest suite green',
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
      <DotPattern className="absolute inset-0 opacity-30 [mask-image:radial-gradient(280px_circle_at_center,white,transparent)]" />
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
      <div className="absolute inset-x-0 top-10 flex gap-3 px-6 opacity-40">
        {['Backlog', 'In Progress', 'Review'].map((col) => (
          <div key={col} className="flex-1 rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">{col}</p>
            <div className="mt-2 space-y-1.5">
              <div className="h-8 rounded-md bg-white/10" />
              <div className="h-8 rounded-md bg-white/5" />
            </div>
          </div>
        ))}
      </div>
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,oklch(0.55_0.12_175/0.28),transparent_55%)]" />
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
    <div className="flex size-full min-h-full bg-[#0b1118] text-left text-neutral-100">
      <aside className="hidden w-40 shrink-0 flex-col gap-1 border-r border-white/10 bg-black/40 p-3 sm:flex">
        <div className="mb-3 flex items-center gap-2 px-1">
          <div className="flex size-5 items-center justify-center rounded-md bg-teal-500">
            <Zap size={10} className="text-slate-950" />
          </div>
          <span className="truncate text-xs font-semibold text-white">Acme Corp</span>
        </div>
        {['Home', 'Projects', 'Docs', 'Settings'].map((item, i) => (
          <div
            key={item}
            className={cn(
              'rounded-md px-2 py-1.5 text-[11px]',
              i === 1 ? 'bg-teal-500/20 text-teal-200' : 'text-white/45'
            )}
          >
            {item}
          </div>
        ))}
      </aside>
      <div className="flex flex-1 gap-2 overflow-hidden p-3">
        {[
          { name: 'Backlog', cards: ['Dashboard layout', 'CI pipeline'] },
          { name: 'In Progress', cards: ['JWT refresh', 'Kanban DnD'] },
          { name: 'Review', cards: ['Landing redesign'] },
        ].map((col) => (
          <div key={col.name} className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/45">
                {col.name}
              </span>
              <span className="rounded-full border border-white/15 px-1.5 text-[9px] text-white/40">
                {col.cards.length}
              </span>
            </div>
            {col.cards.map((title) => (
              <div
                key={title}
                className="rounded-lg border border-white/12 bg-[#151b24] p-2.5 text-[11px] font-medium text-white/90"
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
    <div className="dark relative min-h-screen bg-[#070b12] text-white">
      {/* Static atmosphere — no continuous canvas animation (scroll stays stable) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-5%,oklch(0.48_0.11_175/0.38),transparent_58%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,oklch(0.4_0.08_200/0.2),transparent_40%)]" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)',
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          }}
        />
      </div>

      <header className="relative z-20 px-4 pt-4">
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between rounded-2xl border border-white/15 bg-[#0b1118]/85 px-4 shadow-lg shadow-black/20 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-teal-500 shadow-md shadow-teal-500/30">
              <Zap size={14} className="text-slate-950" strokeWidth={2.5} />
            </div>
            <span className="font-display text-sm font-extrabold tracking-tight text-white">
              FlowBoard
            </span>
          </div>
          <nav className="flex items-center gap-2">
            <Link
              to="/auth/login"
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              Sign in
            </Link>
            <Link to="/auth/register">
              <InteractiveHoverButton className="h-8 border-white/20 bg-white/5 px-4 text-xs text-white">
                Get started
              </InteractiveHoverButton>
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative z-10 px-6 pb-10 pt-16 sm:pt-20">
        <div className="mx-auto max-w-4xl text-center">
          <BlurFade delay={0.05}>
            <div className="mb-7 inline-flex rounded-full border border-teal-400/30 bg-teal-400/10 px-3.5 py-1.5">
              <span className="text-xs font-semibold tracking-wide text-teal-200">
                Multi-tenant workspace · portfolio demo
              </span>
            </div>
          </BlurFade>

          <BlurFade delay={0.1}>
            <p className="font-display mb-4 text-5xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_24px_rgba(45,212,191,0.25)] sm:text-6xl md:text-7xl">
              FlowBoard
            </p>
          </BlurFade>

          <BlurFade delay={0.16}>
            <h1 className="font-display mb-5 text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
              Ship work in one tenant-safe space.{' '}
              <span className="bg-gradient-to-r from-teal-200 via-teal-300 to-cyan-200 bg-clip-text text-transparent">
                Together.
              </span>
            </h1>
          </BlurFade>

          <BlurFade delay={0.22}>
            <p className="mx-auto mb-9 max-w-xl text-pretty text-base leading-relaxed text-white/75 sm:text-lg">
              Boards, docs, and RBAC isolation — built to show fail-closed auth and ordered
              Kanban, not invented traction metrics.
            </p>
          </BlurFade>

          <BlurFade delay={0.28}>
            <div className="mb-14 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/auth/register">
                <ShimmerButton
                  className="shadow-2xl shadow-teal-500/20"
                  background="oklch(0.72 0.12 175)"
                  shimmerColor="#ecfeff"
                >
                  <span className="flex items-center gap-2 text-sm font-bold text-slate-950">
                    Start free workspace
                    <ArrowRight size={15} />
                  </span>
                </ShimmerButton>
              </Link>
              <Link
                to="/auth/login"
                className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
              >
                Sign in
                <ArrowRight size={14} />
              </Link>
            </div>
          </BlurFade>
        </div>

        <BlurFade delay={0.35} className="relative mx-auto max-w-5xl">
          <div className="relative rounded-2xl p-px">
            <BorderBeam
              size={140}
              duration={12}
              colorFrom="#5eead4"
              colorTo="#22d3ee"
              borderWidth={2}
            />
            <div className="overflow-hidden rounded-2xl border border-white/15 bg-[#0b1118] shadow-2xl shadow-black/60">
              <div className="flex items-center gap-3 border-b border-white/10 bg-black/50 px-4 py-2.5">
                <div className="flex gap-1.5">
                  <div className="size-2.5 rounded-full bg-white/25" />
                  <div className="size-2.5 rounded-full bg-white/25" />
                  <div className="size-2.5 rounded-full bg-white/25" />
                </div>
                <div className="mx-auto flex h-6 w-64 items-center justify-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  <span className="font-mono text-[10px] text-white/55">
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

      <section className="relative z-10 overflow-hidden py-10">
        <Marquee pauseOnHover className="[--duration:45s]">
          {CAPABILITIES.map((item) => (
            <div
              key={item}
              className="mx-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-white/70"
            >
              {item}
            </div>
          ))}
        </Marquee>
      </section>

      <section className="relative z-10 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 max-w-lg">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-teal-300">
              What you can verify
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Built for the hard parts
            </h2>
            <p className="mt-3 text-base text-white/65">
              Differentiator is tenant authz and ordering — not another Kanban skin.
            </p>
          </div>
          <BentoGrid>
            {FEATURES.map((f) => (
              <BentoCard key={f.name} {...f} />
            ))}
          </BentoGrid>
        </div>
      </section>

      <section className="relative z-10 px-6 py-24">
        <div className="relative mx-auto max-w-2xl text-center">
          <h2 className="font-display mb-3 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Ready to flow?
          </h2>
          <p className="mb-8 text-base text-white/65">
            Create an account — we open a starter workspace so you can move a card immediately.
          </p>
          <Link to="/auth/register">
            <ShimmerButton background="oklch(0.72 0.12 175)" shimmerColor="#ecfeff">
              <span className="text-sm font-bold text-slate-950">Create your workspace</span>
            </ShimmerButton>
          </Link>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 px-6 py-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-5 items-center justify-center rounded-md bg-teal-500">
              <Zap size={9} className="text-slate-950" />
            </div>
            <span className="font-display text-xs font-semibold text-white/60">FlowBoard</span>
          </div>
          <p className="text-xs text-white/45">
            UI powered by{' '}
            <a
              href="https://magicui.design"
              className="text-teal-300/90 underline-offset-2 hover:underline"
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
