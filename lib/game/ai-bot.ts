/**
 * ============================================================
 * KINGDOMS OF CHAOS — AI Bot Planner (Strict Priority Tree)
 * ============================================================
 * [CHANGED] Complete rewrite with a 3-tier strict priority system:
 *
 *   TIER 1 — EMERGENCY (Defend): if HP <= 30% of max, ONLY generate
 *            defensive actions (towers, traps, shield cards).
 *
 *   TIER 2 — TACTICAL ATTACK: if bot.troops > any_enemy.troops * 1.5,
 *            prioritize attacking viable targets.
 *
 *   TIER 3 — ECONOMIC UPGRADE / GATHER: if gold >= UPGRADE_COST,
 *            upgrade castle; otherwise build farms and opportunistically
 *            attack weak/neutral tiles.
 *
 * The bot still uses the same public API (validateAction -> bufferAction)
 * and never peeks at hidden buffers.
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

/**
 * [CHANGED] Generates candidates using a strict 3-tier priority system.
 * Higher tiers completely dominate lower tiers via weight magnitude.
 */
function generateCandidates(state: GameState, botId: PlayerId): Candidate[] {
  const bot = state.players[botId]
  const candidates: Candidate[] = []

  // --- STRICT PRIORITY FLAGS ---
  // [CHANGED] Exact 30% threshold (was STARTING_HP / 3 = 6.66, now precisely 30%)
  const isEmergency = bot.hp <= CONFIG.STARTING_HP * 0.30

  const enemies = state.players.filter((p) => p.isAlive && p.id !== botId)
  // [NEW] Tactical advantage: bot troops exceed SOME enemy by 1.5x
  const hasTroopAdvantage = enemies.some((e) => bot.troops > e.troops * 1.5)

  // ============================================================
  // TIER 1 — EMERGENCY DEFENSE (hp <= 30%)
  // ============================================================
  if (isEmergency) {
    // Build towers on any own or neutral tile for defense
    for (const tile of state.tiles) {
      if (tile.structure !== 'none') continue
      if (tile.owner === botId || tile.owner === null) {
        candidates.push({
          action: { type: 'BUILD', player: botId, targetTileId: tile.id, structure: 'tower' },
          weight: 10,
        })
        // Traps on owned tiles as defensive deterrent
        if (tile.owner === botId) {
          candidates.push({
            action: { type: 'BUILD', player: botId, targetTileId: tile.id, structure: 'trap' },
            weight: 6,
          })
        }
      }
    }
    // Shield card is highest priority when endangered
    if (bot.hand.includes('shield')) {
      candidates.push({
        action: { type: 'PLAY_CARD', player: botId, cardId: 'shield' },
        weight: 12,
      })
    }
    // Fallback: farm if nothing else affordable (keep economy alive)
    for (const tile of state.tiles) {
      if ((tile.owner === botId || tile.owner === null) && tile.structure === 'none') {
        candidates.push({
          action: { type: 'BUILD', player: botId, targetTileId: tile.id, structure: 'farm' },
          weight: 2,
        })
      }
    }
    // Low-weight cards as last resort
    addCardCandidates(candidates, state, botId, 1)
    return candidates // Strict: emergency blocks lower tiers
  }

  // ============================================================
  // TIER 2 — TACTICAL ATTACK (troops > enemy * 1.5)
  // ============================================================
  if (hasTroopAdvantage) {
    for (const tile of state.tiles) {
      if (tile.owner === null) {
        // Neutral tile: easy capture, moderate weight
        candidates.push({
          action: { type: 'ATTACK', player: botId, targetTileId: tile.id },
          weight: 6,
        })
      } else if (tile.owner !== botId) {
        const owner = state
