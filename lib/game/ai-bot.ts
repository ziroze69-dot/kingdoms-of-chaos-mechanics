/**
 * ============================================================
 * KINGDOMS OF CHAOS — Simple AI Bot Planner
 * ============================================================
 * The bot uses the EXACT same public API as a human player
 * (validateAction -> bufferAction -> commitTurn). It never peeks
 * at other players' buffers — it only reads public board state —
 * so it plays by the same information rules as humans.
 *
 * Strategy (simple weighted heuristic — replace with minimax /
 * MCTS later without touching the rest of the engine):
 *  - Low HP?          prefer Shield / defensive builds.
 *  - Rich?            prefer building farms (economy snowball).
 *  - Weak enemy tile? prefer attacking it.
 */

import { CONFIG } from './config'
import { bufferAction, validateAction } from './turn-manager'
import type { GameAction, GameState, PlayerId } from './types'

/** Plans and buffers up to 3 actions for the given bot player. */
export function planBotTurn(state: GameState, botId: PlayerId, rng: () => number = Math.random): GameState {
  let current = state

  for (let slot = 0; slot < CONFIG.ACTIONS_PER_TURN; slot++) {
    const candidates = generateCandidates(current, botId)

    // Filter to only legal actions given the *current* buffered state
    // (gold decreases as earlier actions in this same turn are buffered).
    const legal = candidates.filter((c) => validateAction(current, c.action) === null)
    if (legal.length === 0) break // nothing affordable -> remaining slots become PASS on commit

    // Weighted random pick — keeps bots unpredictable but sensible.
    const totalWeight = legal.reduce((s, c) => s + c.weight, 0)
    let roll = rng() * totalWeight
    let chosen = legal[0]
    for (const c of legal) {
      roll -= c.weight
      if (roll <= 0) {
        chosen = c
        break
      }
    }

    current = bufferAction(current, chosen.action)
  }

  return current
}

interface Candidate {
  action: GameAction
  weight: number
}

function generateCandidates(state: GameState, botId: PlayerId): Candidate[] {
  const bot = state.players[botId]
  const candidates: Candidate[] = []
  const lowHp = bot.hp <= CONFIG.STARTING_HP / 3

  for (const tile of state.tiles) {
    // ATTACK enemy or neutral tiles. Prefer enemy-owned tiles,
    // and prefer tiles owned by the weakest player (finish them).
    if (tile.owner !== botId) {
      let weight = tile.owner === null ? 1 : 3
      if (tile.owner !== null) {
        const owner = state.players[tile.owner]
        if (owner.hp <= CONFIG.ATTACK_DAMAGE) weight += 4 // lethal range
        if (tile.structure === 'tower') weight -= 1 // towers hurt
      }
      candidates.push({ action: { type: 'ATTACK', player: botId, targetTileId: tile.id }, weight: Math.max(1, weight) })
    }

    // BUILD on own/neutral tiles.
    if (tile.owner === botId || tile.owner === null) {
      if (tile.structure === 'none') {
        candidates.push({ action: { type: 'BUILD', player: botId, targetTileId: tile.id, structure: 'farm' }, weight: bot.gold > 6 ? 3 : 1 })
        // Traps are the mind-game tool: weight them up on owned frontier tiles.
        candidates.push({ action: { type: 'BUILD', player: botId, targetTileId: tile.id, structure: 'trap' }, weight: tile.owner === botId ? 2 : 1 })
        candidates.push({ action: { type: 'BUILD', player: botId, targetTileId: tile.id, structure: 'tower' }, weight: lowHp ? 3 : 1 })
      }
    }
  }

  // CARDS
  for (const cardId of bot.hand) {
    if (cardId === 'shield') {
      candidates.push({ action: { type: 'PLAY_CARD', player: botId, cardId }, weight: lowHp ? 6 : 1 })
    }
    if (cardId === 'gold_rush') {
      candidates.push({ action: { type: 'PLAY_CARD', player: botId, cardId }, weight: bot.gold < 4 ? 5 : 2 })
    }
    if (cardId === 'fireball') {
      // Target the healthiest rival (cut down the leader).
      const rivals = state.players.filter((p) => p.isAlive && p.id !== botId)
      if (rivals.length > 0) {
        const target = rivals.reduce((a, b) => (a.hp >= b.hp ? a : b))
        candidates.push({ action: { type: 'PLAY_CARD', player: botId, cardId, targetPlayerId: target.id }, weight: 3 })
      }
    }
  }

  return candidates
}
