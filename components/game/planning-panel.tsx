'use client'

/**
 * PlanningPanel — the active player's private sub-turn UI.
 * Buffers actions via the TurnManager; nothing executes here.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Board } from '@/components/game/board'
import { CARDS, CONFIG } from '@/lib/game/config'
import { bufferAction, unbufferLastAction, validateAction } from '@/lib/game/turn-manager'
import type { GameAction, GameState, PlayerId, StructureType } from '@/lib/game/types'

type Mode = 'attack' | { build: Exclude<StructureType, 'none'> } | null

export function PlanningPanel({
  state,
  onStateChange,
  onCommit,
}: {
  state: GameState
  onStateChange: (next: GameState) => void
  onCommit: () => void
}) {
  const player = state.players[state.activePlayerIndex]
  const buffer = state.buffers[player.id]
  const [mode, setMode] = useState<Mode>(null)
  const [error, setError] = useState<string | null>(null)
  const slotsLeft = CONFIG.ACTIONS_PER_TURN - buffer.length

  /** Try to buffer an action; surface validation errors instead of throwing. */
  function tryBuffer(action: GameAction) {
    const problem = validateAction(state, action)
    if (problem) {
      setError(problem)
      return
    }
    setError(null)
    setMode(null)
    onStateChange(bufferAction(state, action))
  }

  function handleTileSelect(tileId: number) {
    if (mode === 'attack') {
      tryBuffer({ type: 'ATTACK', player: player.id, targetTileId: tileId })
    } else if (mode && typeof mode === 'object') {
      tryBuffer({ type: 'BUILD', player: player.id, targetTileId: tileId, structure: mode.build })
    }
  }

  function playCard(cardId: (typeof player.hand)[number]) {
    if (cardId === 'fireball') {
      // Fireball needs a player target — pick the healthiest rival for the demo.
      const rivals = state.players.filter((p) => p.isAlive && p.id !== player.id)
      const target = rivals.reduce((a, b) => (a.hp >= b.hp ? a : b))
      tryBuffer({ type: 'PLAY_CARD', player: player.id, cardId, targetPlayerId: target.id })
    } else {
      tryBuffer({ type: 'PLAY_CARD', player: player.id, cardId })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Player status */}
      <div className="flex items-center justify-between rounded-lg border bg-card p-3">
        <div>
          <h2 className="font-semibold">{player.name}&apos;s secret turn</h2>
          <p className="text-sm text-muted-foreground">
            HP {player.hp} · Gold {player.gold} · Round {state.round}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold font-mono">{slotsLeft}</p>
          <p className="text-xs text-muted-foreground">actions left</p>
        </div>
      </div>

      {/* Board — traps of other players are hidden from this viewer */}
      <Board
        tiles={state.tiles}
        viewerId={player.id}
        selectedTileId={null}
        onSelectTile={mode ? handleTileSelect : undefined}
      />
      {mode && (
        <p className="text-center text-sm text-accent-foreground">
          {mode === 'attack' ? 'Select a tile to attack' : `Select a tile to build a ${mode.build}`}
        </p>
      )}

      {/* Action pickers */}
      <div className="grid grid-cols-2 gap-2">
        <Button variant={mode === 'attack' ? 'default' : 'outline'} onClick={() => setMode(mode === 'attack' ? null : 'attack')} disabled={slotsLeft === 0}>
          Attack ({CONFIG.ATTACK_GOLD_COST}g)
        </Button>
        {(['farm', 'tower', 'trap'] as const).map((s) => (
          <Button
            key={s}
            variant={typeof mode === 'object' && mode?.build === s ? 'default' : 'outline'}
            onClick={() => setMode(typeof mode === 'object' && mode?.build === s ? null : { build: s })}
            disabled={slotsLeft === 0}
          >
            Build {s} ({CONFIG.BUILD_COSTS[s]}g)
          </Button>
        ))}
      </div>

      {/* Hand */}
      {player.hand.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {player.hand.map((cardId, i) => (
            <Button key={`${cardId}-${i}`} variant="secondary" size="sm" onClick={() => playCard(cardId)} disabled={slotsLeft === 0}>
              {CARDS[cardId].name} ({CARDS[cardId].goldCost}g)
            </Button>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* The secret buffer */}
      <div className="rounded-lg border bg-card p-3">
        <h3 className="mb-2 text-sm font-medium">Planned actions (secret)</h3>
        {buffer.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing planned yet.</p>
        ) : (
          <ol className="flex flex-col gap-1 text-sm">
            {buffer.map((a, i) => (
              <li key={i} className="font-mono">
                {i + 1}. {describeAction(a)}
              </li>
            ))}
          </ol>
        )}
        <div className="mt-3 flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => onStateChange(unbufferLastAction(state, player.id))} disabled={buffer.length === 0}>
            Undo last
          </Button>
          <Button size="sm" className="flex-1" onClick={onCommit}>
            Lock in turn
          </Button>
        </div>
      </div>
    </div>
  )
}

function describeAction(a: GameAction): string {
  switch (a.type) {
    case 'ATTACK':
      return `Attack tile ${a.targetTileId}`
    case 'BUILD':
      return `Build ${a.structure} on tile ${a.targetTileId}`
    case 'PLAY_CARD':
      return `Play ${CARDS[a.cardId].name}${a.targetPlayerId !== undefined ? ` on Player ${(a.targetPlayerId as PlayerId) + 1}` : ''}`
    case 'PASS':
      return 'Pass'
  }
}
