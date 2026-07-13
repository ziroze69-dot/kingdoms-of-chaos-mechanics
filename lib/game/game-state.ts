/**
 * ============================================================
 * KINGDOMS OF CHAOS — Game State Factory & Helpers
 * ============================================================
 * State is a plain serializable object. All mutations happen
 * through the TurnManager / ConflictResolver, which treat the
 * state immutably (clone -> modify -> return). That gives you
 * free undo, save/load, and deterministic replays.
 */

import { CONFIG } from './config'
import type { GameState, Player, PlayerId, Tile } from './types'

/** Create a fresh 4-player game. `botFlags[i]` marks player i as AI. */
export function createGameState(names: string[], botFlags: boolean[]): GameState {
  const players: Player[] = Array.from({ length: CONFIG.PLAYER_COUNT }, (_, i) => ({
    id: i as PlayerId,
    name: names[i] ?? `Player ${i + 1}`,
    isBot: botFlags[i] ?? false,
    hp: CONFIG.STARTING_HP,
    gold: CONFIG.STARTING_GOLD,
    hand: ['fireball', 'shield', 'gold_rush'], // simple starting hand
    isAlive: true,
  }))

  // 4x4 board. Each player starts owning one corner tile.
  const corners = [0, 3, 12, 15]
  const tiles: Tile[] = Array.from({ length: CONFIG.BOARD_SIZE }, (_, i) => ({
    id: i,
    owner: corners.includes(i) ? (corners.indexOf(i) as PlayerId) : null,
    structure: 'none',
    trapArmed: false,
  }))

  return {
    phase: 'HANDOFF', // start with a "pass to Player 1" screen
    round: 1,
    players,
    tiles,
    activePlayerIndex: 0,
    buffers: { 0: [], 1: [], 2: [], 3: [] },
    lastResolutionLog: [],
    winner: null,
  }
}

/** Deep clone — state is plain JSON, so this is safe and cheap. */
export function cloneState(state: GameState): GameState {
  return structuredClone(state)
}

export function getPlayer(state: GameState, id: PlayerId): Player {
  return state.players[id]
}

export function alivePlayers(state: GameState): Player[] {
  return state.players.filter((p) => p.isAlive)
}

/** Round income: base gold + farm bonuses. Called at the start of each round. */
export function applyIncome(state: GameState): void {
  for (const p of state.players) {
    if (!p.isAlive) continue
    const farms = state.tiles.filter((t) => t.owner === p.id && t.structure === 'farm').length
    p.gold += CONFIG.GOLD_PER_ROUND + farms * CONFIG.GOLD_PER_FARM
  }
}

/**
 * Win condition: last kingdom standing.
 * Only records the winner — the phase transition to GAME_OVER happens
 * in acknowledgeResolution(), so the final battle report is still shown.
 */
export function checkGameOver(state: GameState): boolean {
  const alive = alivePlayers(state)
  if (alive.length <= 1) {
    state.winner = alive[0]?.id ?? null
    return true
  }
  return false
}
