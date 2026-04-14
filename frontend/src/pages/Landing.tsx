import { useRef, CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import {
  Zap,
  Kanban,
  Users,
  FileText,
  ArrowRight,
  Check,
  ChevronRight,
  LayoutDashboard,
  BookOpen,
  Settings,
} from 'lucide-react'

// ─── Static data ──────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Kanban,
    title: 'Kanban Boards',
    description:
      "Drag-and-drop task management with customizable columns. Full visibility into what's in progress, what's blocked, and what ships next.",
    iconColor: 'text-brand-400',
    iconBg: 'bg-brand-500/10',
    hoverBorder: 'hover:border-brand-500/30',
    hoverGlow: 'hover:shadow-brand-500/10',
    cardGradient: 'from-brand-500/10 to-transparent',
  },
  {
    icon: Users,
    title: 'Real-time Collaboration',
    description:
      "See teammates' presence and live edits the moment they happen. WebSocket-powered sync keeps everyone on the same page — always.",
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10',
    hoverBorder: 'hover:border-emerald-500/30',
    hoverGlow: 'hover:shadow-emerald-500/10',
    cardGradient: 'from-emerald-500/10 to-transparent',
  },
  {
    icon: FileText,
    title: 'Collaborative Docs',
    description:
      "Rich-text documents that auto-save as you type. Link docs to projects and keep your team's knowledge close to where work happens.",
    iconColor: 'text-violet-400',
    iconBg: 'bg-violet-500/10',
    hoverBorder: 'hover:border-violet-500/30',
    hoverGlow: 'hover:shadow-violet-500/10',
    cardGradient: 'from-violet-500/10 to-transparent',
  },
]

const PERKS = [
  'Free to start',
  'No credit card required',
  'Unlimited workspaces',
  'Role-based access control',
]

const STATS = [
  { value: '12,000+', label: 'Teams worldwide' },
  { value: '500K+',   label: 'Tasks shipped'   },
  { value: '99.9%',   label: 'Uptime SLA'      },
]

const LOGOS = ['Axiom', 'Cascade', 'Meridian', 'Helix', 'Stratum', 'Orbit']

// ─── Board mockup data ────────────────────────────────────────────────────────

const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-rose-500',
  high:   'bg-orange-400',
  medium: 'bg-yellow-400',
  low:    'bg-emerald-400',
}

const LABEL_CHIP: Record<string, string> = {
  Design:   'bg-violet-500/20 text-violet-300 border-violet-500/25',
  Backend:  'bg-blue-500/20   text-blue-300   border-blue-500/25',
  Frontend: 'bg-cyan-500/20   text-cyan-300   border-cyan-500/25',
  DevOps:   'bg-amber-500/20  text-amber-300  border-amber-500/25',
}

const AVATAR_PALETTE = [
  'bg-indigo-500', 'bg-emerald-500', 'bg-rose-500',
  'bg-amber-500',  'bg-sky-500',     'bg-violet-500',
]

interface MockCard {
  title:    string
  priority: string
  label?:   string
  avatars?: string[]
}

const MOCK_COLUMNS: { name: string; count: number; cards: MockCard[] }[] = [
  {
    name: 'Backlog', count: 4,
    cards: [
      { title: 'Redesign dashboard layout', priority: 'medium', label: 'Design',   avatars: ['AJ']       },
      { title: 'Set up CI/CD pipeline',     priority: 'high',   label: 'DevOps'                          },
    ],
  },
  {
    name: 'In Progress', count: 2,
    cards: [
      { title: 'Auth flow & JWT refresh',   priority: 'urgent', label: 'Backend',  avatars: ['MK', 'SL'] },
      { title: 'Kanban drag & drop',        priority: 'high',   label: 'Frontend', avatars: ['AJ']       },
    ],
  },
  {
    name: 'Review', count: 3,
    cards: [
      { title: 'Landing page redesign',     priority: 'medium', label: 'Design',   avatars: ['RK']       },
      { title: 'Query optimization',        priority: 'high',   label: 'Backend'                         },
    ],
  },
]

// ─── Shared animation variants ────────────────────────────────────────────────

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}

const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.09 } },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MiniAvatar({ initials, idx }: { initials: string; idx: number }) {
  return (
    <div
      className={`w-[18px] h-[18px] rounded-full ${AVATAR_PALETTE[idx % AVATAR_PALETTE.length]}
        flex items-center justify-center text-[7px] font-bold text-white ring-1 ring-neutral-900`}
    >
      {initials[0]}
    </div>
  )
}

function MockTaskCard({ card }: { card: MockCard }) {
  return (
    <div className="bg-neutral-800/90 rounded-lg border border-neutral-700/40 p-2.5 space-y-2">
      <div className="flex items-start gap-1.5">
        <span className={`mt-[3px] w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[card.priority]}`} />
        <p className="text-[11px] font-medium text-neutral-200 leading-[1.35] flex-1">{card.title}</p>
      </div>

      <div className="flex items-center gap-1.5">
        {card.label && (
          <span
            className={`text-[9px] font-semibold px-1.5 py-[2px] rounded border
              ${LABEL_CHIP[card.label] ?? 'bg-neutral-700 text-neutral-400 border-neutral-600'}`}
          >
            {card.label}
          </span>
        )}
        {card.avatars && card.avatars.length > 0 && (
          <div className="flex -space-x-1 ml-auto">
            {card.avatars.map((a, i) => (
              <MiniAvatar key={a} initials={a} idx={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function BoardMockup() {
  return (
    <div className="relative">
      {/* Under-glow halo */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-2/3 h-14
        bg-brand-600/20 blur-3xl rounded-full pointer-events-none" />

      {/* Perspective wrapper for 3-D entry animation */}
      <div style={{ perspective: '1600px' }}>
        <motion.div
          initial={{ opacity: 0, y: 52, rotateX: 16 }}
          animate={{ opacity: 1, y: 0,  rotateX: 0  }}
          transition={{ duration: 0.9, delay: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* 1 px gradient border */}
          <div className="p-px rounded-2xl bg-gradient-to-b from-neutral-600/60 via-neutral-700/25 to-neutral-800/10 shadow-2xl shadow-black/50">
            <div className="rounded-[15px] overflow-hidden bg-[#0c0c0e]">

              {/* Window chrome */}
              <div className="flex items-center gap-3 px-4 py-2.5
                bg-neutral-900/70 border-b border-neutral-800/70">
                {/* Traffic lights */}
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-700/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-700/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-700/80" />
                </div>

                {/* URL bar */}
                <div className="flex-1 flex justify-center">
                  <div className="h-[22px] w-64 bg-neutral-800/80 rounded-md border
                    border-neutral-700/40 flex items-center justify-center gap-1.5 px-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/70" />
                    <span className="text-[10px] text-neutral-500 font-mono tracking-tight">
                      app.flowboard.dev/acme/board
                    </span>
                  </div>
                </div>

                {/* Online presence */}
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-1.5">
                    {['AJ', 'MK', 'SL'].map((a, i) => (
                      <MiniAvatar key={a} initials={a} idx={i} />
                    ))}
                  </div>
                  <span className="text-[9px] text-neutral-600 font-medium">3 online</span>
                </div>
              </div>

              {/* App body: sidebar + board */}
              <div className="flex h-[210px]">

                {/* Sidebar */}
                <div className="w-[140px] flex-shrink-0 border-r border-neutral-800/50
                  bg-neutral-900/50 flex flex-col py-2.5 px-2 gap-0.5">
                  {/* Workspace header */}
                  <div className="flex items-center gap-1.5 px-2 py-1.5 mb-1">
                    <div className="w-[18px] h-[18px] rounded-md bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-sm shadow-brand-600/40 flex-shrink-0">
                      <Zap size={9} className="text-white" />
                    </div>
                    <span className="text-[11px] font-semibold text-neutral-300 truncate">
                      Acme Corp
                    </span>
                  </div>

                  {/* Nav items */}
                  {[
                    { Icon: LayoutDashboard, label: 'Home',     active: false },
                    { Icon: Kanban,          label: 'Projects', active: true  },
                    { Icon: BookOpen,        label: 'Docs',     active: false },
                    { Icon: Settings,        label: 'Settings', active: false },
                  ].map(({ Icon, label, active }) => (
                    <div
                      key={label}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-default select-none transition-colors
                        ${active
                          ? 'bg-brand-500/15 text-brand-300'
                          : 'text-neutral-600 hover:text-neutral-400'
                        }`}
                    >
                      <Icon size={11} />
                      <span className="text-[10px] font-medium">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Board columns */}
                <div className="flex-1 flex gap-2.5 p-3 overflow-hidden">
                  {MOCK_COLUMNS.map((col) => (
                    <div key={col.name} className="flex-1 min-w-0 flex flex-col gap-2">
                      {/* Column header */}
                      <div className="flex items-center justify-between px-0.5">
                        <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">
                          {col.name}
                        </span>
                        <span className="text-[9px] font-medium bg-neutral-800 text-neutral-600
                          rounded-full px-1.5 py-px border border-neutral-700/40">
                          {col.count}
                        </span>
                      </div>

                      {/* Cards */}
                      <div className="flex flex-col gap-1.5">
                        {col.cards.map((card) => (
                          <MockTaskCard key={card.title} card={card} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

// Reusable dot-grid background style
const dotGrid: CSSProperties = {
  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
  backgroundSize: '28px 28px',
}

export default function Landing() {
  const featuresRef = useRef<HTMLElement>(null)
  const featuresInView = useInView(featuresRef, { once: true, margin: '-80px' })

  const statsRef = useRef<HTMLElement>(null)
  const statsInView = useInView(statsRef, { once: true, margin: '-80px' })

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 overflow-x-hidden">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 px-4 pt-3">
        <div className="max-w-5xl mx-auto">
          <div className="bg-neutral-900/75 border border-neutral-800/60 backdrop-blur-xl
            rounded-2xl h-12 px-5 flex items-center justify-between
            shadow-xl shadow-black/30">

            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500 to-violet-600
                flex items-center justify-center shadow-md shadow-brand-600/40 flex-shrink-0">
                <Zap size={11} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-white text-sm tracking-tight">FlowBoard</span>
            </div>

            {/* Nav */}
            <nav className="flex items-center gap-1">
              <Link
                to="/auth/login"
                className="text-xs text-neutral-400 hover:text-neutral-200 px-3 py-1.5
                  rounded-lg hover:bg-white/5 transition-all duration-150"
              >
                Sign in
              </Link>
              <Link
                to="/auth/register"
                className="text-xs font-semibold bg-white text-neutral-950 hover:bg-neutral-100
                  px-3.5 py-1.5 rounded-lg transition-colors duration-150 shadow-sm"
              >
                Get started
              </Link>
            </nav>

          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-14 px-6 overflow-hidden">

        {/* Layered background glows + dot grid */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-0" style={dotGrid} />
          {/* Centre indigo blob */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2
            w-[900px] h-[500px] bg-brand-600/[0.07] rounded-full blur-[130px]" />
          {/* Left violet accent */}
          <div className="absolute top-10 left-[10%]
            w-[380px] h-[300px] bg-violet-600/[0.06] rounded-full blur-[100px]" />
          {/* Right sky accent */}
          <div className="absolute top-16 right-[10%]
            w-[320px] h-[260px] bg-sky-600/[0.05] rounded-full blur-[100px]" />
          {/* Fade to bg at bottom */}
          <div className="absolute bottom-0 inset-x-0 h-32
            bg-gradient-to-t from-neutral-950 to-transparent" />
        </div>

        <div className="max-w-3xl mx-auto text-center relative">

          {/* Animated badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex mb-7"
          >
            <span className="inline-flex items-center gap-2 border border-brand-500/25
              bg-brand-500/[0.07] text-brand-400 text-xs font-medium px-3.5 py-1.5 rounded-full">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full
                  bg-brand-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-400" />
              </span>
              Now in public beta
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold
              tracking-[-0.03em] leading-[1.07] mb-5"
          >
            <span className="text-white">Ship faster,</span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400
              bg-clip-text text-transparent">
              together.
            </span>
          </motion.h1>

          {/* Sub-heading */}
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-base sm:text-lg text-neutral-400 max-w-xl mx-auto mb-9 leading-relaxed"
          >
            FlowBoard unifies tasks, docs, and teammates into one fast,
            beautiful workspace — built for teams who move at the speed of ideas.
          </motion.p>

          {/* CTA pair */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-9"
          >
            {/* Primary — gradient with shine sweep */}
            <Link
              to="/auth/register"
              className="group relative inline-flex items-center gap-2 overflow-hidden
                bg-gradient-to-br from-brand-500 to-violet-600 text-white font-semibold
                px-7 py-3 rounded-xl text-sm
                shadow-lg shadow-brand-600/30 hover:shadow-brand-600/50
                hover:scale-[1.02] active:scale-[0.99]
                transition-all duration-200"
            >
              {/* Shine sweep */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent
                via-white/15 to-transparent -translate-x-full
                group-hover:translate-x-full transition-transform duration-500 ease-in-out" />
              Start for free
              <ArrowRight
                size={15}
                className="group-hover:translate-x-0.5 transition-transform duration-200"
              />
            </Link>

            {/* Secondary — glass */}
            <Link
              to="/auth/login"
              className="inline-flex items-center gap-1.5
                bg-white/[0.05] hover:bg-white/[0.09]
                border border-white/[0.09] hover:border-white/[0.14]
                text-neutral-300 hover:text-white font-medium
                px-6 py-3 rounded-xl text-sm
                transition-all duration-200"
            >
              Sign in to your account
              <ChevronRight size={14} className="text-neutral-500" />
            </Link>
          </motion.div>

          {/* Perks row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-x-5 gap-y-2"
          >
            {PERKS.map((perk) => (
              <span
                key={perk}
                className="flex items-center gap-1.5 text-[11px] text-neutral-600"
              >
                <Check size={11} className="text-emerald-500" strokeWidth={2.5} />
                {perk}
              </span>
            ))}
          </motion.div>

        </div>
      </section>

      {/* ── App mockup ─────────────────────────────────────────────────────── */}
      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <BoardMockup />
        </div>
      </section>

      {/* ── Logo bar ───────────────────────────────────────────────────────── */}
      <section className="py-10 px-6 border-y border-neutral-800/40">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-[10px] font-bold text-neutral-700
            uppercase tracking-[0.2em] mb-6">
            Trusted by teams at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {LOGOS.map((name) => (
              <span
                key={name}
                className="text-sm font-semibold text-neutral-700
                  hover:text-neutral-400 transition-colors duration-200
                  cursor-default tracking-tight select-none"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section ref={featuresRef} className="py-24 px-6">
        <div className="max-w-5xl mx-auto">

          {/* Section header */}
          <motion.div
            initial="hidden"
            animate={featuresInView ? 'visible' : 'hidden'}
            variants={fadeUp}
            className="text-center mb-14"
          >
            <p className="text-[11px] font-bold text-brand-400 uppercase tracking-[0.18em] mb-3">
              Features
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
              Everything your team needs
            </h2>
            <p className="text-neutral-500 max-w-md mx-auto text-sm leading-relaxed">
              A complete toolkit for planning, building, and shipping — without
              juggling a dozen different apps.
            </p>
          </motion.div>

          {/* Feature cards */}
          <motion.div
            initial="hidden"
            animate={featuresInView ? 'visible' : 'hidden'}
            variants={stagger}
            className="grid sm:grid-cols-3 gap-5"
          >
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                custom={i}
                className={`group relative bg-neutral-900/80 border border-neutral-800
                  rounded-2xl p-6 overflow-hidden cursor-default
                  ${f.hoverBorder} hover:-translate-y-0.5
                  hover:shadow-2xl ${f.hoverGlow}
                  transition-all duration-300`}
              >
                {/* Gradient wash on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${f.cardGradient}
                  opacity-0 group-hover:opacity-100 transition-opacity duration-300
                  rounded-2xl pointer-events-none`} />

                <div className="relative">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl ${f.iconBg}
                    flex items-center justify-center mb-4
                    group-hover:scale-110 transition-transform duration-300`}>
                    <f.icon size={18} className={f.iconColor} />
                  </div>

                  <h3 className="font-semibold text-white text-sm mb-2">{f.title}</h3>
                  <p className="text-xs text-neutral-500 leading-relaxed mb-4">
                    {f.description}
                  </p>

                  {/* Hover arrow hint */}
                  <div className="flex items-center gap-1 text-[11px]
                    text-neutral-700 group-hover:text-neutral-400
                    transition-colors duration-200">
                    <span>Learn more</span>
                    <ArrowRight
                      size={10}
                      className="group-hover:translate-x-0.5 transition-transform duration-200"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </section>

      {/* ── Stats band ─────────────────────────────────────────────────────── */}
      <section
        ref={statsRef}
        className="py-14 px-6 border-y border-neutral-800/40 bg-neutral-900/20"
      >
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial="hidden"
            animate={statsInView ? 'visible' : 'hidden'}
            variants={stagger}
            className="grid grid-cols-3 divide-x divide-neutral-800/60"
          >
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                custom={i}
                className="text-center px-4"
              >
                <div className="text-3xl sm:text-4xl font-bold
                  bg-gradient-to-br from-white to-neutral-400
                  bg-clip-text text-transparent mb-1 tabular-nums">
                  {stat.value}
                </div>
                <div className="text-xs text-neutral-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="relative py-28 px-6 overflow-hidden">

        {/* Atmospheric glows + dot grid */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-0" style={dotGrid} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
            w-[700px] h-[350px] bg-brand-600/[0.09] rounded-full blur-[110px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
            w-[350px] h-[200px] bg-violet-600/[0.07] rounded-full blur-[80px]" />
        </div>

        <div className="max-w-2xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <p className="text-[11px] font-bold text-brand-400 uppercase tracking-[0.18em] mb-4">
              Get started today
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white
              tracking-[-0.02em] leading-[1.1] mb-4">
              Ready to flow?
            </h2>
            <p className="text-neutral-500 mb-9 text-sm max-w-sm mx-auto leading-relaxed">
              Join thousands of teams shipping faster with FlowBoard.
              Free to start — no credit card required.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {/* Primary CTA */}
              <Link
                to="/auth/register"
                className="group relative inline-flex items-center gap-2 overflow-hidden
                  bg-gradient-to-br from-brand-500 to-violet-600 text-white font-semibold
                  px-8 py-3.5 rounded-xl text-sm
                  shadow-lg shadow-brand-600/25 hover:shadow-brand-600/50
                  hover:scale-[1.02] active:scale-[0.99]
                  transition-all duration-200"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-transparent
                  via-white/15 to-transparent -translate-x-full
                  group-hover:translate-x-full transition-transform duration-500" />
                Create your workspace
                <ArrowRight
                  size={15}
                  className="group-hover:translate-x-0.5 transition-transform duration-200"
                />
              </Link>

              {/* Secondary CTA */}
              <Link
                to="/auth/login"
                className="inline-flex items-center gap-1.5
                  text-neutral-400 hover:text-neutral-200
                  font-medium text-sm px-6 py-3.5 rounded-xl
                  hover:bg-white/[0.05] transition-all duration-200"
              >
                Sign in instead
                <ChevronRight size={14} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-neutral-800/50 py-8 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-brand-500 to-violet-600
              flex items-center justify-center shadow-sm shadow-brand-600/30">
              <Zap size={9} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xs font-semibold text-neutral-600">FlowBoard</span>
          </div>
          <p className="text-xs text-neutral-700">
            &copy; {new Date().getFullYear()} FlowBoard. Built with care.
          </p>
        </div>
      </footer>

    </div>
  )
}
