/**
 * ============================================================
 * KINGDOMS OF CHAOS — Game State Factory & Helpers
 * ============================================================
 * [CHANGED] Board size 6x6 (36 tiles), corners [0, 5, 30, 35].
 * [NEW] Players start with troops and castleLevel.
 * [NEW] applyIncome now grants troops based on castle level.
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
    // [NEW] Initialize military and economic development stats
    troops: CONFIG.STARTING_TROOPS,
    castleLevel: CONFIG.STARTING_CASTLE_LEVEL,
    hand: ['fireball', 'shield', 'gold_rush'], // simple starting hand
    isAlive: true,
  }))

  // [CHANGED] 6x6 board. Each player starts owning one corner tile.
  // For 6x6 grid, corners are: top-left=0, top-right=5, bottom-left=30, bottom-right=35
  const corners = [0, 5, 30, 35]
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

/** Round income: base gold + farm bonuses, and troop recruitment. */
export function applyIncome(state: GameState): void {
  for (const p of state.players) {
    if (!p.isAlive) continue
    const farms = state.tiles.filter((t) => t.owner === p.id && t.structure === 'farm').length
    p.gold += CONFIG.GOLD_PER_ROUND + farms * CONFIG.GOLD_PER_FARM
    // [NEW] Troop recruitment scales with castle level (upgrade incentive)
    p.troops += CONFIG.TROOPS_PER_ROUND + p.castleLevel * CONFIG.TROOPS_PER_CASTLE_LEVEL
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
