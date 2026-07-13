'use client'

/**
 * Handoff / Resolution / GameOver screens for Pass & Play.
 * The HANDOFF screen is the privacy wall between sub-turns:
 * nothing secret is rendered until the next player confirms.
 */

import { Button } from '@/components/ui/button'
import { Board } from '@/components/game/board'
import type { GameState } from '@/lib/game/types'

/** Privacy screen: shows nothing secret. Bot turns auto-advance (handled by parent). */
export function HandoffScreen({ state, onReady }: { state: GameState; onReady: () => void }) {
  const player = state.players[state.activePlayerIndex]

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <div>
        <p className="text-sm uppercase tracking-widest text-muted-foreground">Round {state.round}</p>
        <h2 className="mt-2 text-3xl font-bold text-balance">Pass the device to {player.name}</h2>
        <p className="mt-2 text-muted-foreground">
          {player.isBot ? 'The AI is scheming...' : 'No peeking, everyone else!'}
        </p>
      </div>
      {!player.isBot && (
        <Button size="lg" onClick={onReady}>
          I am {player.name} — start my turn
        </Button>
      )}
    </div>
  )
}

/** Battle report: replays the simultaneous resolution. */
export function ResolutionScreen({ state, onContinue }: { state: GameState; onContinue: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Round {state.round} — Battle Report</h2>
      <Board tiles={state.tiles} viewerId={null} selectedTileId={null} />

      <div className="rounded-lg border bg-card p-3">
        {state.lastResolutionLog.length === 0 ? (
          <p className="text-sm text-muted-foreground">A quiet round. Nothing happened.</p>
        ) : (
          <ul className="flex flex-col gap-1.5 text-sm">
            {state.lastResolutionLog.map((e, i) => (
              <li key={i} className="leading-relaxed">
                {e.message}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Public standings */}
      <div className="grid grid-cols-2 gap-2">
        {state.players.map((p) => (
          <div key={p.id} className="rounded-lg border bg-card p-2 text-sm">
            <span className="font-medium">{p.name}</span>{' '}
            <span className="text-muted-foreground">{p.isAlive ? `HP ${p.hp} · ${p.gold}g` : 'Eliminated'}</span>
          </div>
        ))}
      </div>

      <Button size="lg" onClick={onContinue}>
        {state.winner !== null || state.players.filter((p) => p.isAlive).length <= 1 ? 'See final result' : 'Start next round'}
      </Button>
    </div>
  )
}

export function GameOverScreen({ state, onRestart }: { state: GameState; onRestart: () => void }) {
  const winner = state.winner !== null ? state.players[state.winner] : null
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <h2 className="text-4xl font-bold text-balance">
        {winner ? `${winner.name} rules the Kingdoms of Chaos!` : 'Mutual destruction. Nobody wins.'}
      </h2>
      <p className="text-muted-foreground">The war lasted {state.round} rounds.</p>
      <Button size="lg" onClick={onRestart}>
        Play again
      </Button>
    </div>
  )
}
