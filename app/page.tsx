'use client'

/**
 * ============================================================
 * KINGDOMS OF CHAOS — Demo Shell (Pass & Play)
 * ============================================================
 * This page is the "engine adapter": it holds the GameState in
 * React state and calls the pure TurnManager functions. To port
 * to another engine, replace this file — lib/game/* is untouched.
 */

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { PlanningPanel } from '@/components/game/planning-panel'
import { GameOverScreen, HandoffScreen, ResolutionScreen } from '@/components/game/screens'
import { planBotTurn } from '@/lib/game/ai-bot'
import { createGameState } from '@/lib/game/game-state'
import { acknowledgeResolution, beginPlanning, commitTurn } from '@/lib/game/turn-manager'
import type { GameState } from '@/lib/game/types'

export default function Page() {
  const [state, setState] = useState<GameState | null>(null)

  // --- Bot autopilot -------------------------------------------------
  // When the handoff lands on a bot, it plans + commits automatically
  // using the same public API a human uses.
  useEffect(() => {
    if (!state || state.phase !== 'HANDOFF') return
    const active = state.players[state.activePlayerIndex]
    if (!active.isBot) return

    const timer = setTimeout(() => {
      // beginPlanning -> bot buffers actions -> commit. All pure calls.
      let next = beginPlanning(state)
      next = planBotTurn(next, active.id)
      next = commitTurn(next)
      setState(next)
    }, 600) // small delay so humans can follow along

    return () => clearTimeout(timer)
  }, [state])

  // --- Setup screen ---------------------------------------------------
  if (!state) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-4 text-center">
        <header>
          <h1 className="text-4xl font-bold text-balance">Kingdoms of Chaos</h1>
          <p className="mt-2 text-muted-foreground text-pretty">
            4 kingdoms. 3 secret actions each. One simultaneous, chaotic resolution.
          </p>
        </header>
        <div className="flex w-full flex-col gap-2">
          <Button size="lg" onClick={() => setState(createGameState(['You', 'Bot Alpha', 'Bot Beta', 'Bot Gamma'], [false, true, true, true]))}>
            1 Player vs 3 AI Bots
          </Button>
          <Button size="lg" variant="outline" onClick={() => setState(createGameState(['Player 1', 'Player 2', 'Player 3', 'Player 4'], [false, false, false, false]))}>
            4 Players (Pass &amp; Play)
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-screen max-w-md p-4">
      {state.phase === 'HANDOFF' && <HandoffScreen state={state} onReady={() => setState(beginPlanning(state))} />}

      {state.phase === 'PLANNING' && (
        <PlanningPanel state={state} onStateChange={setState} onCommit={() => setState(commitTurn(state))} />
      )}

      {state.phase === 'RESOLUTION' && (
        <ResolutionScreen state={state} onContinue={() => setState(acknowledgeResolution(state))} />
      )}

      {state.phase === 'GAME_OVER' && <GameOverScreen state={state} onRestart={() => setState(null)} />}
    </main>
  )
}
