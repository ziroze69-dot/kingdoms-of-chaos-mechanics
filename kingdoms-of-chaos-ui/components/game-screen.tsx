'use client'

import { useState } from 'react'
import {
  Anvil,
  Castle,
  ChevronDown,
  ChevronUp,
  Coins,
  Crown,
  Flame,
  Footprints,
  Heart,
  LockKeyhole,
  Shield,
  Sparkles,
  Swords,
  Trees,
  Zap,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type KingdomTone = 'red' | 'blue' | 'green' | 'yellow'

type Player = {
  name: string
  title: string
  hp: number
  gold: number
  ap: number
  tone: KingdomTone
}

const players: Player[] = [
  { name: 'Ashen Crown', title: 'Kael', hp: 84, gold: 12, ap: 4, tone: 'red' },
  { name: 'Frostmere', title: 'Lyra', hp: 72, gold: 9, ap: 3, tone: 'blue' },
  { name: 'Thornhold', title: 'Rowan', hp: 91, gold: 7, ap: 5, tone: 'green' },
  { name: 'Sunspire', title: 'Aurelia', hp: 66, gold: 15, ap: 2, tone: 'yellow' },
]

const terrain = [
  'castle-red', 'plain', 'forest', 'plain', 'mountain', 'castle-blue',
  'plain', 'forest', 'plain', 'ruin', 'plain', 'plain',
  'mountain', 'plain', 'shrine', 'plain', 'forest', 'plain',
  'plain', 'ruin', 'plain', 'shrine', 'plain', 'mountain',
  'plain', 'forest', 'plain', 'plain', 'ruin', 'plain',
  'castle-green', 'plain', 'mountain', 'forest', 'plain', 'castle-yellow',
]

const toneClasses: Record<KingdomTone, { border: string; text: string; fill: string; glow: string }> = {
  red: { border: 'border-kingdom-red/70', text: 'text-kingdom-red', fill: 'bg-kingdom-red', glow: 'shadow-kingdom-red/20' },
  blue: { border: 'border-kingdom-blue/70', text: 'text-kingdom-blue', fill: 'bg-kingdom-blue', glow: 'shadow-kingdom-blue/20' },
  green: { border: 'border-kingdom-green/70', text: 'text-kingdom-green', fill: 'bg-kingdom-green', glow: 'shadow-kingdom-green/20' },
  yellow: { border: 'border-kingdom-yellow/70', text: 'text-kingdom-yellow', fill: 'bg-kingdom-yellow', glow: 'shadow-kingdom-yellow/20' },
}

function PlayerPanel({ player, active = false }: { player: Player; active?: boolean }) {
  const tone = toneClasses[player.tone]
  return (
    <section
      aria-label={`${player.name} status`}
      className={cn(
        'flex min-w-0 flex-col gap-1 border bg-card/95 px-2 py-1.5 shadow-lg backdrop-blur-sm',
        tone.border,
        active && `ring-1 ring-offset-1 ring-offset-background ${tone.text}`,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Crown aria-hidden="true" className={cn('size-3.5 shrink-0', tone.text)} />
          <div className="min-w-0">
            <h2 className="truncate font-serif text-[10px] font-bold uppercase leading-none tracking-wide sm:text-xs">{player.name}</h2>
            <p className="truncate text-[8px] leading-none text-muted-foreground sm:text-[9px]">{player.title}{active ? ' · PLANNING' : ''}</p>
          </div>
        </div>
        <div className={cn('flex size-5 shrink-0 items-center justify-center border text-[9px] font-black', tone.border, tone.text)}>{player.ap}</div>
      </div>
      <div className="flex items-center gap-1.5">
        <Heart aria-hidden="true" className={cn('size-3', tone.text)} />
        <div className="h-1.5 flex-1 overflow-hidden bg-muted" aria-label={`${player.hp} health points`}>
          <div className={cn('h-full', tone.fill)} style={{ width: `${player.hp}%` }} />
        </div>
        <span className="w-5 text-right text-[8px] font-bold tabular-nums">{player.hp}</span>
        <Coins aria-hidden="true" className={cn('ml-1 size-3', tone.text)} />
        <span className="text-[9px] font-bold tabular-nums">{player.gold}</span>
      </div>
    </section>
  )
}

function TerrainIcon({ type }: { type: string }) {
  if (type.startsWith('castle')) return <Castle aria-hidden="true" />
  if (type === 'forest') return <Trees aria-hidden="true" />
  if (type === 'mountain') return <Flame aria-hidden="true" />
  if (type === 'ruin') return <Anvil aria-hidden="true" />
  if (type === 'shrine') return <Sparkles aria-hidden="true" />
  return null
}

function Battlefield() {
  const [selected, setSelected] = useState<number | null>(14)
  return (
    <section aria-label="Battlefield map" className="relative mx-auto aspect-square h-full max-h-[68vh] min-h-0">
      <div className="grid size-full grid-cols-6 border border-border bg-muted/30 shadow-2xl shadow-background">
        {terrain.map((type, index) => {
          const kingdom = type.includes('red') ? 'red' : type.includes('blue') ? 'blue' : type.includes('green') ? 'green' : type.includes('yellow') ? 'yellow' : null
          return (
            <button
              key={`${type}-${index}`}
              type="button"
              aria-label={`Battlefield tile ${index + 1}, ${type.replace('-', ' ')}`}
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
              className={cn(
                'relative flex min-h-0 items-center justify-center border-b border-r border-border/70 text-muted-foreground transition-colors hover:bg-accent/50 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [&>svg]:size-[42%]',
                selected === index && 'bg-accent text-foreground ring-1 ring-inset ring-primary',
                kingdom && toneClasses[kingdom].text,
              )}
            >
              <TerrainIcon type={type} />
              {(index === 8 || index === 16 || index === 26) && (
                <span className={cn('absolute size-1.5 rounded-full', index === 8 ? 'bg-kingdom-red' : index === 16 ? 'bg-kingdom-blue' : 'bg-kingdom-green')} />
              )}
              <span className="absolute bottom-0.5 right-0.5 text-[6px] font-mono opacity-40">{String(index + 1).padStart(2, '0')}</span>
            </button>
          )
        })}
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between px-1 text-[7px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        <span>Westreach</span><span>Eastvale</span>
      </div>
    </section>
  )
}

const cards = [
  { title: 'Night Raid', detail: '+2 attack', icon: Footprints },
  { title: 'Iron Ward', detail: 'Block 3', icon: Shield },
  { title: 'Wild Spark', detail: 'Gain 1 AP', icon: Zap },
]

function SecretDock() {
  const [open, setOpen] = useState(true)
  const [chosen, setChosen] = useState<string[]>(['Attack'])
  const toggleCard = (title: string) => setChosen((current) => current.includes(title) ? current.filter((item) => item !== title) : current.length < 3 ? [...current, title] : current)

  return (
    <aside className={cn('absolute bottom-0 left-1/2 w-[58%] -translate-x-1/2 border border-kingdom-red/70 bg-card/98 shadow-2xl shadow-background transition-transform', !open && 'translate-y-[calc(100%-30px)]')}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex h-7 w-full items-center justify-between px-3 text-left text-[9px] font-bold uppercase tracking-[0.16em] text-kingdom-red">
        <span className="flex items-center gap-1.5"><LockKeyhole aria-hidden="true" className="size-3" /> Kael&apos;s secret planning dock</span>
        {open ? <ChevronDown aria-hidden="true" className="size-3" /> : <ChevronUp aria-hidden="true" className="size-3" />}
      </button>
      <div className="grid grid-cols-[0.8fr_1.5fr_auto] gap-2 border-t border-border p-2">
        <div className="flex flex-col gap-1">
          <p className="text-[7px] font-bold uppercase tracking-widest text-muted-foreground">Action queue</p>
          <div className="grid grid-cols-3 gap-1">
            {['Attack', 'Build', 'Card'].map((action, index) => (
              <button key={action} type="button" onClick={() => toggleCard(action)} className={cn('flex aspect-square items-center justify-center border border-dashed border-border bg-muted text-[7px] font-bold uppercase', chosen.includes(action) && 'border-kingdom-red bg-kingdom-red/10 text-kingdom-red')}>
                {chosen.includes(action) ? action : index + 1}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-[7px] font-bold uppercase tracking-widest text-muted-foreground">Tactical hand · choose up to 3</p>
          <div className="grid grid-cols-3 gap-1">
            {cards.map(({ title, detail, icon: Icon }) => (
              <button key={title} type="button" onClick={() => toggleCard(title)} aria-pressed={chosen.includes(title)} className={cn('flex min-w-0 items-center gap-1 border border-border bg-muted px-1.5 py-1 text-left hover:border-kingdom-red', chosen.includes(title) && 'border-kingdom-red bg-kingdom-red/10')}>
                <Icon aria-hidden="true" className="size-4 shrink-0 text-kingdom-red" />
                <span className="min-w-0"><strong className="block truncate text-[8px] leading-none">{title}</strong><small className="block truncate text-[7px] text-muted-foreground">{detail}</small></span>
              </button>
            ))}
          </div>
        </div>
        <Button type="button" className="h-full min-h-12 rounded-none bg-kingdom-red px-3 text-[8px] font-black uppercase leading-tight text-background hover:bg-kingdom-red/90">
          <Swords data-icon="inline-start" /> End turn<br />& pass phone
        </Button>
      </div>
    </aside>
  )
}

export function GameScreen() {
  return (
    <main className="relative h-dvh min-h-[320px] w-full overflow-hidden bg-background p-2 text-foreground">
      <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 text-center">
        <p className="font-serif text-[10px] font-black uppercase tracking-[0.2em]">Kingdoms of Chaos</p>
        <p className="text-[7px] uppercase tracking-[0.18em] text-muted-foreground">Round IV · Planning Phase</p>
      </div>

      <div className="grid h-full grid-cols-[minmax(120px,1fr)_minmax(260px,2.15fr)_minmax(120px,1fr)] grid-rows-2 gap-2">
        <PlayerPanel player={players[0]} active />
        <div className="row-span-2 min-h-0 pt-5 pb-8"><Battlefield /></div>
        <PlayerPanel player={players[1]} />
        <div className="self-end"><PlayerPanel player={players[2]} /></div>
        <div className="self-end"><PlayerPanel player={players[3]} /></div>
      </div>

      <SecretDock />
      <div className="portrait-warning fixed inset-0 hidden flex-col items-center justify-center gap-3 bg-background p-8 text-center">
        <Zap aria-hidden="true" className="size-8 text-kingdom-yellow" />
        <h1 className="font-serif text-xl font-bold">Rotate to landscape</h1>
        <p className="text-sm text-muted-foreground">Four kingdoms need the full battlefield.</p>
      </div>
    </main>
  )
}
